// Smoke-test integrasi Manggaleh terhadap server hidup.
//
// Mencocokkan perilaku @manggaleh/sdk dengan asumsi adapter (src/data/manggaleh.js):
//   - Data API WAJIB sesi end-user (publishable key saja → 401).
//   - kolom jsonb `spouse_ids`: tulis = JSON.stringify, baca = array terurai.
//   - list() dibatasi 50/200 → paginasi via page().
//   - insert/update mengembalikan baris lengkap (id + code); remove → void.
//   - realtime mengirim { type:'change', op, id, collection }.
//
// Membaca konfigurasi dari env (lihat .env.local). TIDAK memuat kredensial apa
// pun di dalam berkas ini. Jalankan:
//
//   node --env-file=.env.local scripts/manggaleh-smoke.mjs
import { createClient } from '@manggaleh/sdk'

const E = process.env
const cfg = {
  baseUrl: E.VITE_MANGGALEH_BASE_URL,
  tenant: E.VITE_MANGGALEH_TENANT,
  env: E.VITE_MANGGALEH_ENV || 'dev',
  apiKey: E.VITE_MANGGALEH_KEY,
}
const COLLECTION = E.VITE_MANGGALEH_COLLECTION || 'people'

if (!cfg.baseUrl || !cfg.tenant || !cfg.apiKey) {
  console.error('Env Manggaleh belum lengkap. Jalankan dengan --env-file=.env.local')
  process.exit(1)
}

const log = (...a) => console.log(...a)
const j = (v) => JSON.stringify(v)
let pass = 0
const ok = (cond, label) => {
  log(`${cond ? '✓' : '✗'} ${label}`)
  if (cond) pass++
  else process.exitCode = 1
}

const client = createClient(cfg)
const people = client.data.from(COLLECTION)
const CODE = `smoke-${Date.now()}`
const realtimeHits = []
let unsub = null

async function main() {
  log('▶ Konfigurasi:', { ...cfg, apiKey: cfg.apiKey.slice(0, 10) + '…' }, 'collection=', COLLECTION)

  // 0) Data API tanpa sesi → harus ditolak (membuktikan perlunya end-user).
  try {
    await people.list({ limit: 1 })
    ok(false, 'tanpa sesi: list seharusnya ditolak (tapi lolos)')
  } catch (e) {
    ok(e.status === 401, `tanpa sesi: list ditolak ${e.status} (publishable key saja tidak cukup)`)
  }

  // 1) Sesi end-user anonim (seperti ensureSession di adapter).
  await client.auth.signUp({
    email: `smoke-${Date.now()}@${cfg.tenant}.local`,
    password: 'password123',
    name: 'Smoke',
  })
  ok(Boolean(client.getToken()), 'signUp end-user → token diterbitkan')

  // 2) realtime subscribe (return SINKRON berupa fungsi unsub).
  unsub = client.realtime.subscribe(COLLECTION, (e) => {
    if (e.id === insertedId) realtimeHits.push(e)
  })
  ok(typeof unsub === 'function', 'realtime.subscribe() → fungsi unsub')
  await wait(1500) // beri waktu socket terbuka

  // 3) INSERT (jsonb dikirim sebagai string JSON).
  const inserted = await people.insert({
    code: CODE,
    name: 'Smoke Test',
    gender: 'L',
    birth_year: 1900,
    spouse_ids: JSON.stringify(['a', 'b']),
    sibling_order: 3,
  })
  var insertedId = inserted.id
  ok(inserted.id != null && inserted.code === CODE, 'insert() → baris lengkap (id + code)')
  ok(Array.isArray(inserted.spouse_ids) && inserted.spouse_ids.length === 2,
     `jsonb round-trip: tulis string → baca array (${j(inserted.spouse_ids)})`)

  // 4) Paginasi penuh via page().
  let cursor, total = 0
  do {
    const { data, nextCursor } = await people.page({ limit: 200, cursor })
    total += data.length
    cursor = nextCursor ?? undefined
  } while (cursor)
  ok(total >= 1, `page() paginasi penuh → ${total} baris`)

  // 5) filter eq. (dipakai resolveId).
  const eqRes = await people.list({ filters: { code: `eq.${CODE}` }, limit: 1 })
  ok(eqRes.length === 1 && eqRes[0].code === CODE, 'list filters {code:"eq.<code>"} → 1 baris')

  // 6) UPDATE.
  const updated = await people.update(inserted.id, { city: 'Padang' })
  ok(updated.city === 'Padang', 'update() → field tersimpan')

  // 7) REMOVE (→ void/undefined).
  const removed = await people.remove(inserted.id)
  ok(removed === undefined, 'remove() → void')

  // 8) realtime menerima event untuk baris uji.
  await wait(2000)
  const ops = realtimeHits.map((e) => e.op)
  ok(ops.includes('insert') && ops.includes('update') && ops.includes('delete'),
     `realtime menerima insert/update/delete (${ops.join(',') || 'tidak ada'})`)

  log(`\nΣ ${pass}/9 cek lulus`)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

main()
  .then(() => {
    if (typeof unsub === 'function') unsub()
    log(process.exitCode ? '\n❌ ada cek yang gagal' : '\n✅ semua cek lulus')
    process.exit(process.exitCode || 0)
  })
  .catch((e) => {
    console.error('\n❌ smoke gagal:', e)
    if (typeof unsub === 'function') unsub()
    process.exit(1)
  })
