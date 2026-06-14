// Isi data awal (seed) silsilah ke proyek Manggaleh — sekali jalan.
//
// Setara dengan jalur VITE_MANGGALEH_SEED=true di aplikasi, tapi lewat Node
// (berguna bila tak ingin menjalankan browser). Memakai pemetaan `toRow` yang
// SAMA dengan src/data/manggaleh.js (termasuk jsonb spouse_ids = string JSON).
//
// Membaca konfigurasi dari env (.env.local). Tidak memuat kredensial apa pun.
//
//   node --env-file=.env.local scripts/manggaleh-seed.mjs          # seed bila kosong
//   node --env-file=.env.local scripts/manggaleh-seed.mjs --reset  # hapus semua lalu seed
import { createClient } from '@manggaleh/sdk'
import { SEED_PEOPLE } from '../src/data/seed.js'

const E = process.env
const cfg = {
  baseUrl: E.VITE_MANGGALEH_BASE_URL,
  tenant: E.VITE_MANGGALEH_TENANT,
  env: E.VITE_MANGGALEH_ENV || 'dev',
  apiKey: E.VITE_MANGGALEH_KEY,
}
const COLLECTION = E.VITE_MANGGALEH_COLLECTION || 'people'
const RESET = process.argv.includes('--reset')

if (!cfg.baseUrl || !cfg.tenant || !cfg.apiKey) {
  console.error('Env Manggaleh belum lengkap. Jalankan dengan --env-file=.env.local')
  process.exit(1)
}

// Pemetaan identik dengan adapter (src/data/manggaleh.js → toRow).
function toRow(p) {
  return {
    code: p.id,
    name: p.name ?? '',
    gender: p.gender ?? '',
    birth_year: p.birthYear ?? null,
    death_year: p.deathYear ?? null,
    city: p.city ?? '',
    country: p.country ?? '',
    bio: p.bio ?? '',
    phone: p.phone ?? '',
    photo: p.photo ?? null,
    parent_id: p.parentId ?? null,
    parent2_id: p.parent2Id ?? null,
    spouse_id: p.spouseId ?? null,
    spouse_ids:
      Array.isArray(p.spouseIds) && p.spouseIds.length ? JSON.stringify(p.spouseIds) : null,
    sibling_order: p.order ?? null,
  }
}

// Server membatasi ~120 request/menit & maks 50 operasi per transaksi, jadi
// insert/delete massal dikirim per-batch lewat client.tx (sedikit request).
const TX_BATCH = 50

async function listAll(coll) {
  const rows = []
  let cursor
  do {
    const { data, nextCursor } = await coll.page({ limit: 200, cursor, order: 'code.asc' })
    rows.push(...data)
    cursor = nextCursor ?? undefined
  } while (cursor)
  return rows
}

async function txInBatches(client, ops, label) {
  let done = 0
  for (let i = 0; i < ops.length; i += TX_BATCH) {
    const slice = ops.slice(i, i + TX_BATCH)
    await client.tx(slice)
    done += slice.length
    console.log(`  ${label}: ${done}/${ops.length}`)
  }
}

async function main() {
  const client = createClient(cfg)
  // Sesi end-user anonim (Data API mewajibkannya).
  await client.auth.signUp({
    email: `seeder-${Date.now()}@${cfg.tenant}.local`,
    password: 'password123',
    name: 'Seeder',
  })
  const coll = client.data.from(COLLECTION)

  let existing = await listAll(coll)
  console.log(`Baris saat ini: ${existing.length}`)

  if (existing.length && RESET) {
    console.log(`--reset: menghapus ${existing.length} baris…`)
    const delOps = existing.map((r) => ({ op: 'delete', collection: COLLECTION, id: r.id }))
    await txInBatches(client, delOps, 'hapus')
    existing = await listAll(coll)
  }

  if (existing.length) {
    console.log(`Koleksi sudah berisi ${existing.length} baris — lewati seed. (pakai --reset untuk paksa)`)
    process.exit(0)
  }

  console.log(`Menyisipkan ${SEED_PEOPLE.length} anggota…`)
  const insOps = SEED_PEOPLE.map((p) => ({ op: 'insert', collection: COLLECTION, values: toRow(p) }))
  await txInBatches(client, insOps, 'sisip')

  const after = await listAll(coll)
  const ok = after.length === SEED_PEOPLE.length
  console.log(`Selesai. Total baris sekarang: ${after.length} (diharapkan ${SEED_PEOPLE.length}).`)
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error('Seed gagal:', e)
  process.exit(1)
})
