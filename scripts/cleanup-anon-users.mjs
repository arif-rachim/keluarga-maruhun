// Pembersih akun end-user "sampah" yang menumpuk di Manggaleh.
//
// LATAR: dulu aplikasi membuat akun anonim PER-PERANGKAT (anon-<hex>@…) dan
// tiap skrip membuat akun ber-timestamp (smoke-/seeder-/import-/iqbal-/fila2-/
// fix-/asni-…). Itu sudah diperbaiki (satu akun bersama), tapi akun lama telanjur
// menumpuk. Skrip ini mengidentifikasi & (opsional) menghapusnya.
//
// PENTING soal endpoint:
//   @manggaleh/sdk TIDAK punya API list/hapus user (hanya signUp/signIn/signOut/
//   getSession). Penghapusan butuh SERVICE key + endpoint admin backend, yang
//   path persisnya bergantung versi Manggaleh-mu. Karena itu skrip ini TIDAK
//   menebak endpoint: kamu menyuplai-nya lewat env (lihat bawah), atau cukup
//   pakai mode --from-file untuk menghasilkan daftar yang aman dihapus lewat
//   dashboard.
//
// ── BAGIAN YANG SUDAH PASTI BENAR (tanpa jaringan) ──────────────────────────
// Klasifikasi aman: HANYA email yang COCOK pola sampah di bawah yang ditandai
// hapus. Akun keluarga asli (email non-pola) maupun dua akun bersama yang baru
// (anon-shared@…, script-shared@…) TIDAK PERNAH tersentuh (allowlist hapus, bukan
// blocklist).
//
// CARA PAKAI
//   1) Klasifikasi dari file/stdin (paling aman, tanpa kunci/endpoint):
//        node scripts/cleanup-anon-users.mjs --from-file users.json
//        cat users.json | node scripts/cleanup-anon-users.mjs --from-file -
//      `users.json` = array user hasil export dashboard, mis:
//        [{ "id": "...", "email": "anon-1a2b@silsilah-maruhun.local" }, ...]
//      Output: daftar id yang AMAN dihapus (+ yang dipertahankan).
//
//   2) Hapus via endpoint admin (kamu yang suplai endpoint + service key):
//        MANGGALEH_SERVICE_KEY=mgsk_xxx \
//        MANGGALEH_ADMIN_LIST_URL='https://api.manggaleh.com/...users' \
//        MANGGALEH_ADMIN_DELETE_URL='https://api.manggaleh.com/...users/{id}' \
//        node scripts/cleanup-anon-users.mjs --apply
//      Tanpa --apply = DRY RUN (hanya menampilkan rencana, tidak menghapus).

const TENANT = process.env.VITE_MANGGALEH_TENANT || ''

// Pola email "sampah" yang aman dihapus. Semua diakhiri @<tenant>.local dan
// punya penanda acak/timestamp. Cocokkan case-insensitive.
const JUNK_PATTERNS = [
  /^anon-[0-9a-f]{16}@/i, // akun per-perangkat lama dari aplikasi
  /^smoke-\d+@/i, // smoke test
  /^seeder-\d+@/i, // seed
  /^import-\d+@/i, // import-wa-mayar
  /^iqbal-\d+@/i,
  /^fila2-\d+@/i,
  /^fix-\d+@/i,
  /^asni-\d+@/i,
]

// Akun yang HARUS dipertahankan (akun bersama baru). Jangan pernah hapus.
const KEEP_EXACT = new Set([
  `anon-shared@${TENANT}.local`.toLowerCase(),
  `script-shared@${TENANT}.local`.toLowerCase(),
  (process.env.MANGGALEH_SCRIPT_EMAIL || '').toLowerCase(),
  (process.env.VITE_MANGGALEH_ANON_EMAIL || '').toLowerCase(),
])

function isJunk(email) {
  if (!email) return false
  const e = String(email).toLowerCase()
  if (KEEP_EXACT.has(e)) return false
  return JUNK_PATTERNS.some((re) => re.test(e))
}

function classify(users) {
  const del = []
  const keep = []
  for (const u of users) {
    const email = u.email ?? u.username ?? ''
    ;(isJunk(email) ? del : keep).push({ id: u.id ?? u.user_id ?? null, email })
  }
  return { del, keep }
}

async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const fromFileIdx = args.indexOf('--from-file')

async function loadUsers() {
  if (fromFileIdx !== -1) {
    const path = args[fromFileIdx + 1]
    const { readFileSync } = await import('node:fs')
    const raw = path === '-' ? await readStdin() : readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : parsed.users || parsed.data || []
  }
  // Mode jaringan: ambil dari endpoint admin yang kamu suplai.
  const url = process.env.MANGGALEH_ADMIN_LIST_URL
  const key = process.env.MANGGALEH_SERVICE_KEY
  if (!url || !key) {
    console.error(
      'Butuh --from-file <path>, ATAU set MANGGALEH_ADMIN_LIST_URL + MANGGALEH_SERVICE_KEY.\n' +
        'Lihat komentar di atas file ini.',
    )
    process.exit(2)
  }
  const res = await fetch(url, { headers: authHeaders(key) })
  if (!res.ok) {
    console.error(`Gagal list users: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  const body = await res.json()
  return Array.isArray(body) ? body : body.users || body.data || []
}

// Header otorisasi service key. Manggaleh memakai apiKey; bila instance-mu
// memakai skema lain (mis. x-api-key), sesuaikan via MANGGALEH_AUTH_HEADER.
function authHeaders(key) {
  const name = process.env.MANGGALEH_AUTH_HEADER || 'authorization'
  const value = name.toLowerCase() === 'authorization' ? `Bearer ${key}` : key
  return { [name]: value, 'content-type': 'application/json' }
}

async function main() {
  const users = await loadUsers()
  const { del, keep } = classify(users)

  console.log(`Total user diperiksa : ${users.length}`)
  console.log(`Dipertahankan (aman) : ${keep.length}`)
  console.log(`Ditandai untuk hapus : ${del.length}`)
  console.log('\n— Contoh yang DIPERTAHANKAN —')
  keep.slice(0, 10).forEach((u) => console.log('  keep  ', u.email))
  console.log('\n— Yang akan DIHAPUS —')
  del.forEach((u) => console.log('  DELETE', u.email, u.id ? `(${u.id})` : '(tanpa id)'))

  if (!apply) {
    console.log('\nDRY RUN. Tidak ada yang dihapus. Tambah --apply untuk menghapus.')
    return
  }

  const tmpl = process.env.MANGGALEH_ADMIN_DELETE_URL
  const key = process.env.MANGGALEH_SERVICE_KEY
  if (!tmpl || !key) {
    console.error('--apply butuh MANGGALEH_ADMIN_DELETE_URL (berisi {id}) + MANGGALEH_SERVICE_KEY.')
    process.exit(2)
  }
  let okN = 0
  for (const u of del) {
    if (!u.id) {
      console.warn('  lewati (tanpa id):', u.email)
      continue
    }
    const res = await fetch(tmpl.replace('{id}', encodeURIComponent(u.id)), {
      method: 'DELETE',
      headers: authHeaders(key),
    })
    if (res.ok) {
      okN++
      console.log('  dihapus:', u.email)
    } else {
      console.error('  GAGAL  :', u.email, res.status, await res.text())
    }
  }
  console.log(`\nSelesai. ${okN}/${del.length} dihapus.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
