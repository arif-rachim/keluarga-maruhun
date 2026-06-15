// Rekonsiliasi cabang Hj. Rosna dengan data terbaru dari M. Iqbal (15 Juni 2026).
// Melengkapi nama & tahun lahir, menambah pasangan & 4 cabang baru (Azwar, Yon
// Hendri, Ardi, Rinaldi), menambah anak Asni (Elmi), serta MENGGANTI anak Else
// sesuai Iqbal. Idempoten; tulis langsung (admin).
//
//   node --env-file=.env.local scripts/import-iqbal-rosna.mjs
import { createClient } from '@manggaleh/sdk'

const E = process.env
const cfg = {
  baseUrl: E.VITE_MANGGALEH_BASE_URL,
  tenant: E.VITE_MANGGALEH_TENANT,
  env: E.VITE_MANGGALEH_ENV || 'dev',
  apiKey: E.VITE_MANGGALEH_KEY,
}
if (!cfg.baseUrl || !cfg.tenant || !cfg.apiKey) {
  console.error('Env Manggaleh belum lengkap (--env-file=.env.local)')
  process.exit(1)
}

// Anggota baru. Urutan: kepala cabang dulu, lalu pasangan & anak.
const INSERTS = [
  // — Pasangan untuk anggota yang sudah ada
  { code: 'djama-husein', name: 'Djama Husein', gender: 'L', bio: 'Almarhum', spouse_id: 'suna' },
  { code: 'bermawi', name: 'Bermawi St Radjo', gender: 'L', bio: 'Almarhum', spouse_id: 'asni' },
  { code: 'hanif-muchtar', name: 'Hanif Muchtar', gender: 'L', birth_year: 1951, spouse_id: 'emawati' },

  // — Anak Asni baru: Elmi Astrabel ♥ Maivendri
  { code: 'elmi', name: 'Elmi Astrabel', gender: 'P', birth_year: 1975, parent_id: 'asni', parent2_id: 'bermawi', spouse_id: 'maivendri', sibling_order: 3 },
  { code: 'maivendri', name: 'Maivendri', gender: 'L', birth_year: 1970, spouse_id: 'elmi' },
  { code: 'ardel', name: 'Ardel Aulia Dzikri', gender: 'L', birth_year: 2003, parent_id: 'elmi', parent2_id: 'maivendri', sibling_order: 0 },
  { code: 'adli', name: 'Adli Muhammad Alkhairi', gender: 'L', birth_year: 2005, parent_id: 'elmi', parent2_id: 'maivendri', sibling_order: 1 },

  // — Anak Else (pengganti, sesuai Iqbal)
  { code: 'elland-dzaki', name: 'Elland Dzaki Ramadhan', gender: 'L', birth_year: 1999, parent_id: 'else', parent2_id: 'anderson', sibling_order: 0 },
  { code: 'farah-salsabilla', name: 'Farah Salsabilla', gender: 'P', birth_year: 2001, parent_id: 'else', parent2_id: 'anderson', sibling_order: 1 },
  { code: 'andika-dzikry', name: 'Andika Dzikry Gazanova', gender: 'L', birth_year: 2005, parent_id: 'else', parent2_id: 'anderson', sibling_order: 2 },

  // — Cabang Azwar ♥ Desniwelti
  { code: 'azwar', name: 'Azwar', gender: 'L', birth_year: 1954, parent_id: 'suna', parent2_id: 'djama-husein', spouse_id: 'desniwelti', sibling_order: 1 },
  { code: 'desniwelti', name: 'Desniwelti', gender: 'P', birth_year: 1956, spouse_id: 'azwar' },
  { code: 'delen-novri', name: 'Delen Novri', gender: '', birth_year: 1982, parent_id: 'azwar', parent2_id: 'desniwelti', sibling_order: 0 },
  { code: 'hera-resinia', name: 'Hera Resinia', gender: 'P', birth_year: 1984, parent_id: 'azwar', parent2_id: 'desniwelti', sibling_order: 1 },
  { code: 'ahmad-rivai', name: "Ahmad Riva'i", gender: 'L', birth_year: 1990, parent_id: 'azwar', parent2_id: 'desniwelti', sibling_order: 2 },
  { code: 'virli-novita', name: 'Virli Novita Sari', gender: 'P', birth_year: 1998, parent_id: 'azwar', parent2_id: 'desniwelti', sibling_order: 3 },

  // — Cabang Yon Hendri ♥ Tukiyem
  { code: 'yon-hendri', name: 'Yon Hendri', gender: 'L', parent_id: 'suna', parent2_id: 'djama-husein', spouse_id: 'tukiyem', sibling_order: 3 },
  { code: 'tukiyem', name: 'Tukiyem', gender: 'P', spouse_id: 'yon-hendri' },
  { code: 'elian', name: 'Elian', gender: '', parent_id: 'yon-hendri', parent2_id: 'tukiyem', sibling_order: 0 },

  // — Cabang Ardi ♥ Waljiati
  { code: 'ardi', name: 'Ardi', gender: 'L', birth_year: 1962, parent_id: 'suna', parent2_id: 'djama-husein', spouse_id: 'waljiati', sibling_order: 4 },
  { code: 'waljiati', name: 'Waljiati', gender: 'P', birth_year: 1970, spouse_id: 'ardi' },
  { code: 'achmad-faizal', name: 'Achmad Faizal', gender: 'L', birth_year: 1990, parent_id: 'ardi', parent2_id: 'waljiati', sibling_order: 0 },
  { code: 'haryanto-ardi', name: 'Haryanto Ardi', gender: 'L', birth_year: 1994, parent_id: 'ardi', parent2_id: 'waljiati', sibling_order: 1 },
  { code: 'fadilah-ardiansyah', name: 'Fadilah Ardiansyah', gender: '', birth_year: 2001, parent_id: 'ardi', parent2_id: 'waljiati', sibling_order: 2 },
  { code: 'aditya-azka', name: 'Aditya Azka Hilmi', gender: 'L', birth_year: 2004, parent_id: 'ardi', parent2_id: 'waljiati', sibling_order: 3 },

  // — Cabang Rinaldi ♥ Uun
  { code: 'rinaldi', name: 'Rinaldi', gender: 'L', parent_id: 'suna', parent2_id: 'djama-husein', spouse_id: 'uun', sibling_order: 5 },
  { code: 'uun', name: 'Uun', gender: 'P', spouse_id: 'rinaldi' },
  { code: 'rini', name: 'Rini', gender: 'P', parent_id: 'rinaldi', parent2_id: 'uun', sibling_order: 0 },
  { code: 'rani-rena', name: 'Rani', gender: 'P', parent_id: 'rinaldi', parent2_id: 'uun', sibling_order: 1 },
  { code: 'rena', name: 'Rena', gender: 'P', parent_id: 'rinaldi', parent2_id: 'uun', sibling_order: 2 },
]

// PATCH per code (hanya field yang diubah)
const PATCHES = {
  // Matriark
  suna: { name: 'Hj. Rosna', spouse_id: 'djama-husein' },
  // Asni: + tahun lahir + pasangan + urutan anak Rosna (Asni=0)
  asni: { name: 'Hj. Asni', birth_year: 1952, spouse_id: 'bermawi', sibling_order: 0 },
  // Anak Asni — urutan Iqbal: Allend, Else, Albert, Elmi, Alfrio
  allend: { name: 'H. Allend Costlanto', birth_year: 1971, sibling_order: 0 },
  else: { sibling_order: 1 },
  alber: { name: 'Albert Carlanto', birth_year: 1974, sibling_order: 2 },
  elmi: { sibling_order: 3 },
  rio: { name: 'Alfrio Marlanto', birth_year: 1983, sibling_order: 4 },
  // Anak Allend — urutan Iqbal: Alfi, Syifa, Hamim, Rubiansah; lalu Queenara, Alka (ekstra)
  'fitria-allend': { birth_year: 1974 },
  'alfi-maulia': { birth_year: 1995, sibling_order: 0 },
  syifa: { name: 'Syifa Assrofiyah', birth_year: 1999, sibling_order: 1 },
  hamim: { name: 'Hamim Al-Fariz', birth_year: 2001, sibling_order: 2 },
  rubben: { name: 'Rubiansah Fahbandi', birth_year: 2006, sibling_order: 3 },
  queenara: { sibling_order: 4 },
  alka: { sibling_order: 5 },
  // Else ♥ Anderson (rename suami; anak diganti via INSERT+REMOVE)
  anderson: { name: 'Anderson Gazanova', birth_year: 1972 },
  // Emawati ♥ Hanif Muchtar (urutan Rosna=2; tahun lahir 1959 dibiarkan)
  emawati: { spouse_id: 'hanif-muchtar', sibling_order: 2 },
  // Anak Emawati — urutan Iqbal: Mohammad Iqbal, Nadien, Achmad Fazri
  'moch-iqbal': { birth_year: 1978, sibling_order: 0 },
  nadien: { birth_year: 1982, sibling_order: 1 },
  aji: { birth_year: 1987, sibling_order: 2 },
  // Anak Rosna yang dipertahankan: rapikan urutan
  'ujang-glj32': { sibling_order: 6 },
  'iwan-2kuns': { sibling_order: 7 },
  // Rani & Rena = dua orang terpisah (node lama 'Rani Rena' jadi 'Rani')
  'rani-rena': { name: 'Rani' },
}

// Anak Else lama yang diganti sesuai Iqbal
const REMOVES = ['dzaky', 'riska', 'caca', 'kayla']

async function main() {
  const client = createClient(cfg)
  await client.auth.signUp({ email: `iqbal-${Date.now()}@${cfg.tenant}.local`, password: 'password123', name: 'Iqbal import' })
  const ppl = client.data.from('people')
  const all = []
  let cursor
  do {
    const { data, nextCursor } = await ppl.page({ limit: 200, cursor, order: 'code.asc' })
    all.push(...data)
    cursor = nextCursor ?? undefined
  } while (cursor)
  const idByCode = new Map(all.map((r) => [r.code, r.id]))

  let ins = 0
  for (const p of INSERTS) {
    if (idByCode.has(p.code)) { console.log('  skip insert (ada):', p.code); continue }
    const r = await ppl.insert(p)
    idByCode.set(p.code, r.id)
    ins++
    console.log('  + insert:', p.name, `[${p.code}]`)
  }

  let pat = 0
  for (const [code, patch] of Object.entries(PATCHES)) {
    const id = idByCode.get(code)
    if (!id) { console.warn('  ! patch dilewati, code tak ada:', code); continue }
    await ppl.update(id, patch)
    pat++
    console.log(`  ~ ${code}: ${JSON.stringify(patch)}`)
  }

  let rem = 0
  for (const code of REMOVES) {
    const id = idByCode.get(code)
    if (!id) { console.log('  remove dilewati (tak ada):', code); continue }
    await ppl.remove(id)
    rem++
    console.log('  - remove:', code)
  }

  console.log(`\nSelesai. insert=${ins} patch=${pat} remove=${rem}`)
}

main().catch((e) => { console.error('Gagal:', e); process.exit(1) })
