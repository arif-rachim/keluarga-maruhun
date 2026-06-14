// Impor cabang Mama Mayar (Asmayar) ♥ Syamsuar Syarif dari pesan WA Mama.
// Sekali-jalan, idempoten. Tulis langsung ke koleksi `people` (impor admin).
//
//   node --env-file=.env.local scripts/import-wa-mayar.mjs
//
// Lihat rencana: 8 anak + 10 cucu Mama Mayar; perbaiki Yelfy ganda/salah-induk.
import { createClient } from '@manggaleh/sdk'

const E = process.env
const cfg = {
  baseUrl: E.VITE_MANGGALEH_BASE_URL,
  tenant: E.VITE_MANGGALEH_TENANT,
  env: E.VITE_MANGGALEH_ENV || 'dev',
  apiKey: E.VITE_MANGGALEH_KEY,
}
if (!cfg.baseUrl || !cfg.tenant || !cfg.apiKey) {
  console.error('Env Manggaleh belum lengkap (jalankan dengan --env-file=.env.local)')
  process.exit(1)
}

// Pemetaan ke baris koleksi (snake_case), seperti personToRow di src/data/manggaleh.js.
function toRow(p) {
  return {
    code: p.code,
    name: p.name ?? '',
    gender: p.gender ?? '',
    birth_year: p.birthYear ?? null,
    death_year: p.deathYear ?? null,
    city: p.city ?? '',
    country: p.country ?? '',
    bio: p.bio ?? '',
    phone: '',
    photo: null,
    parent_id: p.parentId ?? null,
    parent2_id: p.parent2Id ?? null,
    spouse_id: p.spouseId ?? null,
    spouse_ids: null,
    sibling_order: p.order ?? null,
  }
}

// ── Anggota BARU (insert penuh) ──────────────────────────────────────────────
const INSERTS = [
  // Pasangan yang menikah masuk (tanpa induk)
  { code: 'syamsuar-syarif', name: 'Syamsuar Syarif', gender: 'L', spouseId: 'mayar', bio: 'Suami Asmayar (Mama Mayar).' },
  { code: 'fauzi', name: 'Fauzi', gender: 'L', city: 'Jakarta', spouseId: 'nelly-syam-pzk9t' },
  { code: 'daniel-tuty', name: 'Daniel', gender: 'L', city: 'Manado', spouseId: 'tuty-syam' },
  { code: 'sudarno', name: 'Sudarno', gender: 'L', city: 'Jakarta', spouseId: 'yenny-syam-p15sd' },
  { code: 'sari-iqbal', name: 'Sari', gender: 'P', city: 'Jakarta', bio: 'Almarhumah.', spouseId: 'm-iqbal-syam-tuxtu' },
  { code: 'herryson-adam', name: 'Herryson Adam', gender: 'L', city: 'Ambon', spouseId: 'lenny-syam' },

  // Anak Mama Mayar yang belum ada
  { code: 'tuty-syam', name: 'Tuty Syam', gender: 'P', city: 'Manado', parentId: 'mayar', parent2Id: 'syamsuar-syarif', spouseId: 'daniel-tuty', order: 2 },
  { code: 'm-ridwan-syam', name: 'Muhammad Ridwan Syam', gender: 'L', city: 'Jakarta', bio: 'Almarhum.', parentId: 'mayar', parent2Id: 'syamsuar-syarif', order: 5 },
  { code: 'lenny-syam', name: 'Lenny Syam', gender: 'P', city: 'Ambon', bio: 'Akrab dipanggil Kani.', parentId: 'mayar', parent2Id: 'syamsuar-syarif', spouseId: 'herryson-adam', order: 7 },

  // Cucu — anak Tuty (♥ Daniel) — urutan sesuai WA: 1.Fira 2.Akbar 3.Ilham
  { code: 'fira', name: 'Fira', gender: 'P', parentId: 'tuty-syam', parent2Id: 'daniel-tuty', order: 0 },
  { code: 'akbar', name: 'Akbar', gender: 'L', parentId: 'tuty-syam', parent2Id: 'daniel-tuty', order: 1 },
  { code: 'ilham', name: 'Ilham', gender: 'L', parentId: 'tuty-syam', parent2Id: 'daniel-tuty', order: 2 },
  // Cucu — anak M Iqbal Syam (♥ Sari)
  { code: 'eneng', name: 'Eneng', gender: 'P', city: 'Jakarta', parentId: 'm-iqbal-syam-tuxtu', parent2Id: 'sari-iqbal', order: 0 },
  // Cucu — anak Lenny (♥ Herryson Adam) — urutan WA: 1.Kyla 2.Radja 3.Ara
  { code: 'kyla', name: 'Kyla', gender: 'P', parentId: 'lenny-syam', parent2Id: 'herryson-adam', order: 0 },
  { code: 'radja', name: 'Radja', gender: 'L', parentId: 'lenny-syam', parent2Id: 'herryson-adam', order: 1 },
  { code: 'ara', name: 'Ara', gender: 'P', parentId: 'lenny-syam', parent2Id: 'herryson-adam', order: 2 },
]

// ── PATCH anggota yang sudah ada (hanya field tertentu) ──────────────────────
const PATCHES = {
  mayar: { spouse_id: 'syamsuar-syarif' },
  memmy: { parent2_id: 'syamsuar-syarif', sibling_order: 0 },
  'nelly-syam-pzk9t': { spouse_id: 'fauzi', parent2_id: 'syamsuar-syarif', sibling_order: 1, gender: 'P', city: 'Jakarta' },
  'yenny-syam-p15sd': { spouse_id: 'sudarno', parent2_id: 'syamsuar-syarif', sibling_order: 3, gender: 'P', city: 'Jakarta' },
  'm-iqbal-syam-tuxtu': { spouse_id: 'sari-iqbal', parent2_id: 'syamsuar-syarif', sibling_order: 4, gender: 'L', city: 'Jakarta' },
  // Yelfy: pindahkan jadi anak Mayar (bukan anak Memmy)
  yelfy: { parent_id: 'mayar', parent2_id: 'syamsuar-syarif', sibling_order: 6 },
  // Urutan anak Yelfy sesuai WA: 1.Rizqy 2.Vanissa 3.Ferdy
  rizqy: { sibling_order: 0 },
  vanisa: { sibling_order: 1 },
  ferdiansyah: { sibling_order: 2 },
}

// ── HAPUS duplikat stub ──────────────────────────────────────────────────────
const REMOVES = ['yelfy-syam-dzc9v']

async function main() {
  const client = createClient(cfg)
  await client.auth.signUp({
    email: `import-${Date.now()}@${cfg.tenant}.local`,
    password: 'password123',
    name: 'Importer',
  })
  const people = client.data.from('people')

  // Muat semua → peta code -> {id}
  const all = []
  let cursor
  do {
    const { data, nextCursor } = await people.page({ limit: 200, cursor, order: 'code.asc' })
    all.push(...data)
    cursor = nextCursor ?? undefined
  } while (cursor)
  const idByCode = new Map(all.map((r) => [r.code, r.id]))
  console.log('Baris awal:', all.length)

  // 1) INSERT (lewati bila code sudah ada)
  let inserted = 0
  for (const p of INSERTS) {
    if (idByCode.has(p.code)) {
      console.log(`  skip insert (sudah ada): ${p.code}`)
      continue
    }
    const row = await people.insert(toRow(p))
    idByCode.set(p.code, row.id)
    inserted++
    console.log(`  + insert: ${p.name} [${p.code}]`)
  }

  // 2) PATCH (resolve id via code)
  let patched = 0
  for (const [code, patch] of Object.entries(PATCHES)) {
    const id = idByCode.get(code)
    if (!id) {
      console.warn(`  ! patch dilewati, code tak ada: ${code}`)
      continue
    }
    await people.update(id, patch)
    patched++
    console.log(`  ~ patch: ${code} -> ${JSON.stringify(patch)}`)
  }

  // 3) REMOVE duplikat
  let removed = 0
  for (const code of REMOVES) {
    const id = idByCode.get(code)
    if (!id) {
      console.log(`  remove dilewati (tak ada): ${code}`)
      continue
    }
    await people.remove(id)
    removed++
    console.log(`  - remove: ${code}`)
  }

  console.log(`\nSelesai. insert=${inserted} patch=${patched} remove=${removed}`)
}

main().catch((e) => {
  console.error('Impor gagal:', e)
  process.exit(1)
})
