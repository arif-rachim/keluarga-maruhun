// Perbaikan: usulan "tambah jodoh Syamsinar" tak pernah membuat orang; malah
// menimpa bio Karangan. Skrip ini: buat Syamsinar (istri ke-2 Karangan),
// pulihkan bio/jenis kelamin Karangan, tautkan spouse_ids, dan perbaiki ibu
// Ellyzar (Nurjani -> Syamsinar). Idempoten; tulis langsung (admin).
//
//   node --env-file=.env.local scripts/import-fix-syamsinar.mjs
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

const KARANGAN_BIO =
  'Mak Dang (anak tertua), gelar Sutan Mangkuto. Lahir Bukittinggi 18 Juli 1919, wafat Jakarta 25 Maret 1981. Selalu memperhatikan semua kemenakan.'

const INSERTS = [
  {
    code: 'syamsinar',
    name: 'Syamsinar',
    gender: 'P',
    city: 'Tarok',
    bio: 'Istri kedua Karangan (Inyik Karangan); ibunda Ellyzar (akrab dipanggil TT Ely).',
    spouse_id: 'karangan',
  },
]

const PATCHES = {
  // Pulihkan Karangan (bio tertimpa + jenis kelamin) & tautkan dua istri
  karangan: { bio: KARANGAN_BIO, gender: 'L', city: '', spouse_ids: ['nurjani', 'syamsinar'] },
  // Ellyzar = anak Karangan + Syamsinar (bukan Nurjani)
  ellyzar: { parent2_id: 'syamsinar' },
}

async function main() {
  const client = createClient(cfg)
  await ensureScriptSession(client, cfg, 'fix-syamsinar')
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
