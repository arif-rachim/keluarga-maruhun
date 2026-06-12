// Manggaleh server-side function: resolveRequest
//
// Menyetujui / menolak satu usulan perubahan. Persetujuan WAJIB PIN 6 digit yang
// dicek di server (tidak pernah ada di bundle frontend). Saat disetujui,
// perubahan baru diterapkan ke koleksi `people`.
//
// input: { code, action: 'approve'|'reject', pin }
// Return: { ok, status?: 'approved'|'rejected', error? }
//
// PIN di bawah adalah PLACEHOLDER. Set nilai aslinya lewat:
//   MANGGALEH_APPROVE_PIN=123456 node --env-file=.env.local scripts/manggaleh-set-pin.mjs
// (skrip menyuntik PIN lalu push function; PIN asli tidak pernah masuk repo.)
var APPROVE_PIN = '000000'

function digits(s) {
  return String(s == null ? '' : s).replace(/[^0-9]/g, '')
}

var PCOLS = [
  'code', 'name', 'gender', 'birth_year', 'death_year', 'city', 'country',
  'bio', 'phone', 'photo', 'parent_id', 'parent2_id', 'spouse_id',
  'spouse_ids', 'sibling_order',
]
function pick(o) {
  var r = {}
  if (!o) return r
  for (var i = 0; i < PCOLS.length; i++) {
    var k = PCOLS[i]
    if (o[k] !== undefined) r[k] = o[k]
  }
  return r
}

async function rowByCode(ctx, code) {
  if (!code) return null
  var res = await ctx.db.list('people', { code: 'eq.' + code, limit: 1 })
  return (res && res.data && res.data[0]) || null
}

async function allPeople(ctx) {
  var out = []
  var cursor
  do {
    var res = await ctx.db.list('people', { limit: 200, cursor: cursor })
    var d = (res && res.data) || []
    for (var i = 0; i < d.length; i++) out.push(d[i])
    cursor = res && res.nextCursor ? res.nextCursor : null
  } while (cursor)
  return out
}

async function applyInsert(ctx, req) {
  var payload = pick(req.payload || {})
  await ctx.db.insert('people', payload)
  var rel = req.relation || {}
  if (rel.type === 'spouse' && rel.anchorCode) {
    var anchor = await rowByCode(ctx, rel.anchorCode)
    if (anchor) {
      var existing =
        Array.isArray(anchor.spouse_ids) && anchor.spouse_ids.length
          ? anchor.spouse_ids
          : anchor.spouse_id
            ? [anchor.spouse_id]
            : []
      if (existing.length >= 1) {
        var set = {}
        for (var i = 0; i < existing.length; i++) set[existing[i]] = 1
        set[payload.code] = 1
        await ctx.db.update('people', anchor.id, { spouse_ids: JSON.stringify(Object.keys(set)) })
      } else {
        await ctx.db.update('people', anchor.id, { spouse_id: payload.code })
      }
    }
  }
}

async function applyUpdate(ctx, req) {
  var row = await rowByCode(ctx, req.target_code)
  if (!row) return
  await ctx.db.update('people', row.id, pick(req.payload || {}))
}

async function applyRemove(ctx, req) {
  var target = req.target_code
  var row = await rowByCode(ctx, target)
  if (row) await ctx.db.remove('people', row.id)
  // Bersihkan referensi ke orang yang dihapus.
  var all = await allPeople(ctx)
  var ops = []
  for (var i = 0; i < all.length; i++) {
    var p = all[i]
    var patch = {}
    if (p.parent_id === target) patch.parent_id = null
    if (p.parent2_id === target) patch.parent2_id = null
    if (p.spouse_id === target) patch.spouse_id = null
    if (Array.isArray(p.spouse_ids) && p.spouse_ids.indexOf(target) >= 0) {
      patch.spouse_ids = JSON.stringify(p.spouse_ids.filter(function (x) { return x !== target }))
    }
    if (Object.keys(patch).length) ops.push({ op: 'update', collection: 'people', id: p.id, patch: patch })
  }
  for (var j = 0; j < ops.length; j += 50) await ctx.db.tx(ops.slice(j, j + 50))
}

module.exports = async (input, ctx) => {
  var action = input && input.action
  if (action !== 'approve' && action !== 'reject') return { ok: false, error: 'bad_action' }
  if (digits(input.pin) !== APPROVE_PIN) return { ok: false, error: 'bad_pin' }

  var res = await ctx.db.list('requests', { code: 'eq.' + (input.code || ''), limit: 1 })
  var req = res && res.data && res.data[0]
  if (!req) return { ok: false, error: 'not_found' }
  if (req.status !== 'pending') return { ok: false, error: 'already_' + req.status }

  if (action === 'reject') {
    await ctx.db.update('requests', req.id, { status: 'rejected' })
    return { ok: true, status: 'rejected' }
  }

  if (req.op === 'insert') await applyInsert(ctx, req)
  else if (req.op === 'update') await applyUpdate(ctx, req)
  else if (req.op === 'remove') await applyRemove(ctx, req)
  else return { ok: false, error: 'bad_op' }

  await ctx.db.update('requests', req.id, { status: 'approved' })
  return { ok: true, status: 'approved' }
}
