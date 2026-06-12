// Manggaleh server-side function: mutatePeople
//
// Satu-satunya jalur tulis yang dipakai aplikasi untuk koleksi `people`. Server
// MEMERIKSA ULANG nomor telepon pemanggil terhadap `whitelist` sebelum menulis,
// sehingga gerbang tidak bisa dilewati hanya dengan mengutak-atik state di
// browser. (Catatan: karena publishable key tetap bisa menulis langsung ke
// koleksi terbuka, ini bukan penghalang anti-bypass mutlak — lihat
// docs/MANGGALEH_WHITELIST.md.)
//
// input: { phone, op: 'insert'|'update'|'remove'|'reorder', ... }
//   insert : { values }                     -> baris people lengkap (snake_case)
//   update : { code, patch }                -> code = id aplikasi
//   remove : { code }
//   reorder: { items: [{ code, sibling_order }] }
// Return: { ok: boolean, error?: string, row?: object }

function canon(p) {
  var d = String(p == null ? '' : p).replace(/[^0-9]/g, '')
  if (d.indexOf('0') === 0) d = '62' + d.slice(1)
  return d
}

// Hanya kolom yang dikenal yang boleh ditulis (cegah kolom liar).
var COLS = [
  'code', 'name', 'gender', 'birth_year', 'death_year', 'city', 'country',
  'bio', 'phone', 'photo', 'parent_id', 'parent2_id', 'spouse_id',
  'spouse_ids', 'sibling_order',
]
function pick(o) {
  var r = {}
  if (!o) return r
  for (var i = 0; i < COLS.length; i++) {
    var k = COLS[i]
    if (o[k] !== undefined) r[k] = o[k]
  }
  return r
}

async function idOf(ctx, code) {
  if (!code) return null
  var res = await ctx.db.list('people', { code: 'eq.' + code, limit: 1 })
  var row = res && res.data && res.data[0]
  return row ? row.id : null
}

module.exports = async (input, ctx) => {
  var phone = canon(input && input.phone)
  if (!phone) return { ok: false, error: 'no_phone' }

  var wl = await ctx.db.list('whitelist', { phone: 'eq.' + phone, limit: 1 })
  if (!(wl && wl.data && wl.data[0])) return { ok: false, error: 'not_whitelisted' }

  var op = input && input.op
  if (op === 'insert') {
    // ctx.db.insert mengembalikan baris langsung (bukan { data }).
    var ins = await ctx.db.insert('people', pick(input.values))
    return { ok: true, row: ins }
  }
  if (op === 'update') {
    var uid = await idOf(ctx, input.code)
    if (!uid) return { ok: false, error: 'not_found' }
    var upd = await ctx.db.update('people', uid, pick(input.patch))
    return { ok: true, row: upd }
  }
  if (op === 'remove') {
    var rid = await idOf(ctx, input.code)
    if (rid) await ctx.db.remove('people', rid)
    return { ok: true }
  }
  if (op === 'reorder') {
    var items = (input && input.items) || []
    var ops = []
    for (var i = 0; i < items.length; i++) {
      var oid = await idOf(ctx, items[i].code)
      if (oid) {
        ops.push({
          op: 'update', collection: 'people', id: oid,
          patch: { sibling_order: items[i].sibling_order },
        })
      }
    }
    if (ops.length) await ctx.db.tx(ops)
    return { ok: true, count: ops.length }
  }
  return { ok: false, error: 'bad_op' }
}
