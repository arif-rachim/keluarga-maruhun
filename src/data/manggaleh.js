// Adapter backend Manggaleh (https://github.com/arif-rachim/manggaleh).
// DRAFT integrasi cloud: menggantikan/menambah lapisan localStorage agar
// data silsilah tersinkron antar perangkat & realtime.
//
// Catatan penting:
// - Hanya PUBLISHABLE key (mgpk_...) yang boleh ada di sini — aman untuk
//   browser. JANGAN pernah menaruh SERVICE key di kode klien.
// - Fitur aktif HANYA bila env (VITE_MANGGALEH_*) terisi. Bila kosong,
//   aplikasi tetap berjalan seperti semula (localStorage saja).
// - SDK di-import secara dinamis, jadi tidak ikut ke bundle saat fitur mati.

const CFG = {
  baseUrl: import.meta.env.VITE_MANGGALEH_BASE_URL,
  tenant: import.meta.env.VITE_MANGGALEH_TENANT,
  env: import.meta.env.VITE_MANGGALEH_ENV || 'dev',
  key: import.meta.env.VITE_MANGGALEH_KEY,
}

const COLLECTION = import.meta.env.VITE_MANGGALEH_COLLECTION || 'people'

// Aktif bila baseUrl + tenant + publishable key tersedia.
export function isManggalehEnabled() {
  return Boolean(CFG.baseUrl && CFG.tenant && CFG.key)
}

// Isi data awal ke proyek kosong — set VITE_MANGGALEH_SEED=true SEKALI saja.
export const SEED_ON_EMPTY = import.meta.env.VITE_MANGGALEH_SEED === 'true'

// ---------------------------------------------------------------------------
// Penyimpanan token bearer (localStorage). SDK menyimpan token end-user di sini
// agar bertahan antar reload; realtime/WS juga membacanya saat menyambung.
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'manggaleh.token'
const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* abaikan (mis. mode privat) */
    }
  },
}

// ---------------------------------------------------------------------------
// Klien (singleton, lazy). SDK di-import dinamis agar tidak dibundel saat mati.
// ---------------------------------------------------------------------------
let _clientPromise = null
function getClient() {
  if (!_clientPromise) {
    _clientPromise = import('@manggaleh/sdk').then(({ createClient }) =>
      createClient({
        baseUrl: CFG.baseUrl,
        tenant: CFG.tenant,
        env: CFG.env,
        apiKey: CFG.key,
        storage: tokenStorage,
      }),
    )
  }
  return _clientPromise
}

// ---------------------------------------------------------------------------
// Sesi end-user (WAJIB untuk Data API).
//
// Temuan saat mencocokkan dengan @manggaleh/sdk: publishable key SAJA tidak
// cukup untuk membaca/menulis koleksi — server menolak dengan 401. Setiap
// panggilan data harus membawa token bearer end-user. Karena aplikasi ini
// "mode terbuka" (tanpa layar login, semua melihat pohon yang sama dan koleksi
// `people` TIDAK owner-scoped), kita buat akun end-user ANONIM per-perangkat:
// dibuat sekali (signUp), kredensialnya disimpan lokal, lalu dipakai signIn
// pada kunjungan berikutnya. Identitas ini hanya untuk autentikasi; semua orang
// tetap melihat & menyunting baris yang sama.
// ---------------------------------------------------------------------------
const CREDS_KEY = 'manggaleh.anon'

function loadCreds() {
  try {
    return JSON.parse(localStorage.getItem(CREDS_KEY) || 'null')
  } catch {
    return null
  }
}
function saveCreds(c) {
  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(c))
  } catch {
    /* abaikan */
  }
}
function randomCreds() {
  const hex = (n) => {
    const a = new Uint8Array(n)
    crypto.getRandomValues(a)
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return { email: `anon-${hex(8)}@${CFG.tenant}.local`, password: hex(16), name: 'Dunsanak' }
}

let _sessionPromise = null
function ensureSession() {
  if (_sessionPromise) return _sessionPromise
  _sessionPromise = (async () => {
    const client = await getClient()
    let creds = loadCreds()
    if (creds) {
      try {
        await client.auth.signIn({ email: creds.email, password: creds.password })
        return client
      } catch {
        // Akun anonim hilang / kredensial usang → buat yang baru di bawah.
      }
    }
    creds = randomCreds()
    await client.auth.signUp({ email: creds.email, password: creds.password, name: creds.name })
    saveCreds(creds)
    return client
  })().catch((e) => {
    _sessionPromise = null // izinkan percobaan ulang pada panggilan berikutnya
    throw e
  })
  return _sessionPromise
}

async function coll() {
  const client = await ensureSession()
  return client.data.from(COLLECTION)
}

// ---------------------------------------------------------------------------
// Pemetaan model aplikasi  <->  baris koleksi `people`.
//
// Aplikasi memakai id slug buatan sendiri (mis. "datuk-maruhun") sebagai
// penghubung relasi (parentId/spouseId). Manggaleh mengelola `id` sendiri,
// jadi id aplikasi disimpan di kolom `code` (text, unik) dan SELALU dipakai
// sebagai identitas yang dilihat aplikasi. `id` internal Manggaleh disembunyikan
// dan hanya dipakai untuk update/remove (lihat resolveId).
//
// Konvensi nama kolom = snake_case (lihat "Gotchas" pada docs Manggaleh).
// ---------------------------------------------------------------------------
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
    // Kolom `spouse_ids` bertipe jsonb. Server mengharapkan STRING JSON saat
    // menulis (mengirim array mentah ditolak 400 "value format does not match
    // column type") dan mengembalikannya sebagai array terurai saat membaca.
    spouse_ids:
      Array.isArray(p.spouseIds) && p.spouseIds.length ? JSON.stringify(p.spouseIds) : null,
    // `order` adalah kata-kunci SQL — pakai nama kolom `sibling_order`.
    sibling_order: p.order ?? null,
  }
}

function fromRow(r) {
  const p = {
    id: r.code,
    name: r.name || '',
    gender: r.gender || '',
    birthYear: r.birth_year ?? null,
    deathYear: r.death_year ?? null,
    city: r.city || '',
    country: r.country || '',
    bio: r.bio || '',
    phone: r.phone || '',
    photo: r.photo ?? null,
    parentId: r.parent_id ?? null,
    spouseId: r.spouse_id ?? null,
  }
  // Field opsional hanya ditambahkan bila ada — menjaga bentuk objek tetap
  // ramping (cocok dengan model di seed.js).
  if (r.parent2_id != null) p.parent2Id = r.parent2_id
  if (Array.isArray(r.spouse_ids) && r.spouse_ids.length) p.spouseIds = r.spouse_ids
  if (r.sibling_order != null) p.order = r.sibling_order
  return p
}

// ---------------------------------------------------------------------------
// Sesi pengguna + gerbang tulis (whitelist).
//
// Tulisan TIDAK langsung ke koleksi; semuanya lewat server-side function
// `mutatePeople` yang MEMERIKSA ULANG nomor telepon pemanggil terhadap koleksi
// `whitelist`. Nomor pengguna yang sedang masuk disimpan lokal dan disertakan
// pada tiap mutasi. (Catatan keamanan: publishable key tetap bisa menulis
// langsung ke koleksi terbuka, jadi ini gerbang tingkat-aplikasi yang tahan
// utak-atik state browser, bukan anti-bypass mutlak — lihat
// docs/MANGGALEH_WHITELIST.md.)
// ---------------------------------------------------------------------------
const SESSION_KEY = 'manggaleh.session' // { name, phone }

export function canonPhone(p) {
  let d = String(p ?? '').replace(/[^0-9]/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  return d
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}
export function saveSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* abaikan */
  }
}

// Tanya server apakah nomor ada di whitelist. -> { approved, name }
export async function checkAccess(phone) {
  const client = await ensureSession()
  const res = await client.functions.invoke('checkAccess', { phone: canonPhone(phone) })
  return res || { approved: false, name: null }
}

// Jalankan satu mutasi lewat function bergerbang. Melempar bila ditolak server.
async function mutate(payload) {
  const phone = loadSession()?.phone
  const client = await ensureSession()
  const res = await client.functions.invoke('mutatePeople', { ...payload, phone })
  if (!res || res.ok !== true) {
    throw new Error('Manggaleh: mutasi ditolak (' + (res?.error || 'unknown') + ')')
  }
  return res
}

// ---------------------------------------------------------------------------
// Operasi data.  BACA langsung (publishable + end-user); TULIS lewat gerbang.
// ---------------------------------------------------------------------------
export async function listPeople() {
  // `list()` membatasi default 50 / maks 200 baris per panggilan. Karena
  // silsilah bisa melebihi itu, ambil SELURUH baris lewat paginasi keyset.
  const c = await coll()
  const rows = []
  let cursor
  do {
    const { data, nextCursor } = await c.page({ limit: 200, cursor })
    rows.push(...data)
    cursor = nextCursor ?? undefined
  } while (cursor)
  return rows.map(fromRow)
}

// Seed proyek kosong (jalur dev: VITE_MANGGALEH_SEED) — aksi admin satu kali,
// memakai tx langsung (bukan lewat gerbang). Server membatasi ~120 request/menit
// & maks 50 operasi/transaksi, jadi dipecah per-batch.
const TX_BATCH = 50
export async function insertManyPeople(people) {
  const client = await ensureSession()
  for (let i = 0; i < people.length; i += TX_BATCH) {
    const ops = people
      .slice(i, i + TX_BATCH)
      .map((p) => ({ op: 'insert', collection: COLLECTION, values: toRow(p) }))
    await client.tx(ops)
  }
}

export async function insertPerson(person) {
  return mutate({ op: 'insert', values: toRow(person) })
}

export async function patchPerson(code, person) {
  return mutate({ op: 'update', code, patch: toRow(person) })
}

export async function deletePerson(code) {
  return mutate({ op: 'remove', code })
}

// Berlangganan perubahan koleksi. Karena event realtime hanya membawa op+id
// (bukan data baris), pendekatan paling sederhana & andal untuk pohon kecil
// (~puluhan baris) adalah memuat ulang seluruh daftar pada tiap event.
export async function subscribePeople(onPeople) {
  const client = await ensureSession()
  return client.realtime.subscribe(COLLECTION, async () => {
    try {
      onPeople(await listPeople())
    } catch (e) {
      console.warn('Manggaleh: gagal menyegarkan setelah event realtime.', e)
    }
  })
}
