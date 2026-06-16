// Update dari Fila (14–15 Juni 2026) untuk beberapa cabang:
//  - Om Yoen: Adhi = suami Cindy; Keanu & Kayra = anak Cindy (cucu Om Yoen).
//  - Umar: lengkapi Khairani; tandai Nelly (almh).
//  - Cabang ibu Fila (Asma ♥ Syahrul Zain St Sati): rename + lengkapi nama anak
//    + tambah Eryunis & Upik Leny. (Mapping Army/Ermi DITAHAN untuk konfirmasi.)
// Idempoten; tulis langsung (admin).
//
//   node --env-file=.env.local scripts/import-fila-2.mjs
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

// Anggota baru: 2 anak Asma yang hilang
const INSERTS = [
  { code: 'eryunis', name: 'Eryunis Zain', gender: '', parent_id: 'soma', parent2_id: 'syahrul-zain', sibling_order: 6 },
  { code: 'upik-leny', name: 'Upik Leny Zain', gender: 'P', parent_id: 'soma', parent2_id: 'syahrul-zain', sibling_order: 7 },
]

const PATCHES = {
  // — Cabang Om Yoen (di bawah Nurjanah)
  'om-yoen': { bio: 'Almarhum', city: 'Cikampek' },
  cindy: { spouse_id: 'adhi', gender: 'P', sibling_order: 0 },
  adhi: { parent_id: null, parent2_id: null, spouse_id: 'cindy', gender: 'L' }, // dari anak → suami Cindy
  keanu: { parent_id: 'cindy', parent2_id: 'adhi', sibling_order: 0 }, // jadi cucu (anak Cindy)
  kayra: { parent_id: 'cindy', parent2_id: 'adhi', sibling_order: 1 },
  deden: { city: 'Cikampek' },
  adek: { bio: 'Almarhumah' },

  // — Cabang Umar (urutan Fila: Nelly, Desi, Andri)
  khairani: { name: 'Khairani Putri Noerza' },
  nelly: { bio: 'Almarhumah', sibling_order: 0 },
  desi: { sibling_order: 1 },
  iang: { name: 'Andri', sibling_order: 2 }, // Fila: nama asli Andri, panggilan Iang (bio lama dipertahankan)

  // — Cabang ibu Fila: Hj. Asma ♥ Syahrul Zain St Sati
  soma: { name: 'Hj. Asma' },
  'syahrul-zain': { name: 'Syahrul Zain St Sati' },
  // Anak (Zein→Zain + nama formal + urutan 1..9 dari Fila).
  'ermi-zein-7ehnu': { name: 'Army Zain', sibling_order: 0 }, // Fila: anak ke-1 = Army
  'erwin-zein-och1x': { name: 'Erwin Zain', sibling_order: 1 },
  'heman-zein-9d29v': { name: 'Erman Zain', sibling_order: 2 },
  tuti: { name: 'Astuti Zain', sibling_order: 3 },
  'wati-m4e8r': { name: 'Ernawati Zain', sibling_order: 4 },
  ita: { name: 'Ernida Zain', sibling_order: 5 },
  tini: { name: 'Hartini Zain', sibling_order: 8 },
}

async function main() {
  const client = createClient(cfg)
  await ensureScriptSession(client, cfg, 'fila-2')
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
