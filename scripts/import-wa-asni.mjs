// Koreksi cabang Hj. Asni & Hj. Emawati dari masukan Fila (14 Juni 2026).
// Memperbaiki kesalahan struktur: beberapa pasangan tercatat sebagai anak, dan
// beberapa cucu tercatat di level yang salah. Idempoten; tulis langsung (admin).
//
//   node --env-file=.env.local scripts/import-wa-asni.mjs
import { createClient } from '@manggaleh/sdk'
import { ensureScriptSession } from './_anon-session.mjs'

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

// Anggota baru
const INSERTS = [
  { code: 'fitria-allend', name: 'Fitria', gender: 'P', spouse_id: 'allend' },
]

// PATCH per code (hanya field yang diubah)
const PATCHES = {
  // Hj. Asni: urutan anak = Else, Allend, Alber, Alfrio
  // — Else ♥ Anderson; anak: Dzaky, Riska, Caca, Kayla
  anderson: { parent_id: null, parent2_id: null, spouse_id: 'else', gender: 'L' },
  else: { spouse_id: 'anderson', sibling_order: 0 },
  dzaky: { parent_id: 'else', parent2_id: 'anderson', sibling_order: 0 },
  riska: { parent_id: 'else', parent2_id: 'anderson', sibling_order: 1 },
  caca: { parent_id: 'else', parent2_id: 'anderson', sibling_order: 2 },
  kayla: { parent_id: 'else', parent2_id: 'anderson', sibling_order: 3 },
  // — Allend ♥ Fitria; anak: Alfi, Queenara, Syifa, Hamim, Rubben, Alka
  allend: { spouse_id: 'fitria-allend', sibling_order: 1 },
  'alfi-maulia': { parent2_id: 'fitria-allend', sibling_order: 0, spouse_id: null }, // lepas Queenara
  queenara: { parent_id: 'allend', parent2_id: 'fitria-allend', spouse_id: null, gender: 'P', sibling_order: 1 },
  syifa: { parent2_id: 'fitria-allend', sibling_order: 2 },
  hamim: { parent2_id: 'fitria-allend', sibling_order: 3 },
  rubben: { parent2_id: 'fitria-allend', sibling_order: 4 },
  alka: { parent2_id: 'fitria-allend', sibling_order: 5 },
  // — Alber ♥ Siska; anak: Fajar, Kartika, Arya
  siska: { parent_id: null, parent2_id: null, spouse_id: 'alber', gender: 'P' },
  alber: { spouse_id: 'siska', sibling_order: 2 },
  fajar: { parent2_id: 'siska', sibling_order: 0 },
  kartika: { parent2_id: 'siska', sibling_order: 1 },
  arya: { parent2_id: 'siska', sibling_order: 2 },
  // — Alfrio ♥ Novi; anak: Alvaro, Aliyah
  novi: { parent_id: null, parent2_id: null, spouse_id: 'rio', gender: 'P' },
  rio: { spouse_id: 'novi', sibling_order: 3 },
  alvaro: { parent2_id: 'novi', sibling_order: 0 },
  aliyah: { parent2_id: 'novi', sibling_order: 1 },
  // Hj. Emawati: lengkapi nama
  alfakhrie: { name: 'Alfakhrie Zk' },
  // Tante Wati = perempuan
  'wati-m4e8r': { gender: 'P' },
}

async function main() {
  const client = createClient(cfg)
  await ensureScriptSession(client, cfg, 'wa-asni')
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
  console.log(`\nSelesai. insert=${ins} patch=${pat}`)
}

main().catch((e) => { console.error('Gagal:', e); process.exit(1) })
