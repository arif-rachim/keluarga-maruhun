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
      }),
    )
  }
  return _clientPromise
}

async function coll() {
  const client = await getClient()
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
    // Kolom array (text[]). Bila proyekmu tak mendukung array, ganti ke kolom
    // text/jsonb dan JSON.stringify di sini (sesuaikan fromRow juga).
    spouse_ids: Array.isArray(p.spouseIds) ? p.spouseIds : null,
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
// Cache id: code (id aplikasi) -> id internal Manggaleh.
// Diperlukan karena update/remove memakai id internal Manggaleh.
// ---------------------------------------------------------------------------
const idCache = new Map()

async function resolveId(code) {
  if (idCache.has(code)) return idCache.get(code)
  const rows = await (await coll()).list({ filters: { code: `eq.${code}` }, limit: 1 })
  const mgId = rows?.[0]?.id ?? null
  if (mgId) idCache.set(code, mgId)
  return mgId
}

// ---------------------------------------------------------------------------
// Operasi data (semua async).
// ---------------------------------------------------------------------------
export async function listPeople() {
  const rows = await (await coll()).list()
  idCache.clear()
  for (const r of rows) if (r.code) idCache.set(r.code, r.id)
  return rows.map(fromRow)
}

export async function insertPerson(person) {
  const row = await (await coll()).insert(toRow(person))
  if (row?.code && row?.id) idCache.set(row.code, row.id)
  return row
}

// Patch memakai objek person lengkap (kita kirim seluruh kolom hasil toRow).
export async function patchPerson(code, person) {
  const id = await resolveId(code)
  if (!id) throw new Error(`Manggaleh: baris tak ditemukan untuk code "${code}"`)
  return (await coll()).update(id, toRow(person))
}

export async function deletePerson(code) {
  const id = await resolveId(code)
  if (!id) return
  idCache.delete(code)
  return (await coll()).remove(id)
}

// Berlangganan perubahan koleksi. Karena event realtime hanya membawa op+id
// (bukan data baris), pendekatan paling sederhana & andal untuk pohon kecil
// (~puluhan baris) adalah memuat ulang seluruh daftar pada tiap event.
export async function subscribePeople(onPeople) {
  const client = await getClient()
  return client.realtime.subscribe(COLLECTION, async () => {
    try {
      onPeople(await listPeople())
    } catch (e) {
      console.warn('Manggaleh: gagal menyegarkan setelah event realtime.', e)
    }
  })
}
