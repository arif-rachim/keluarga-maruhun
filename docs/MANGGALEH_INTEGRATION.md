# Integrasi Cloud dengan Manggaleh

Membuat silsilah tersinkron antar perangkat (real-time) dengan
[Manggaleh](https://github.com/arif-rachim/manggaleh) sebagai backend —
menggantikan penyimpanan localStorage yang per-perangkat.

> **Status: teruji terhadap server live** (`api.manggaleh.com`,
> `@manggaleh/sdk@0.1.0`, `@manggaleh/cli@0.2.0`). Adapter sudah dicocokkan
> dengan perilaku SDK asli (lihat "Perbedaan SDK vs draft awal" di bawah) dan
> diverifikasi: seed 167 anggota, realtime lintas-klien, serta persistensi
> setelah reload.

## Cara kerja (offline-first)

Aplikasi tetap **boot instan dari cache lokal** (localStorage), lalu:

1. **Hydrate** — saat mount, data remote dimuat dan menjadi sumber kebenaran.
2. **Push diff** — tiap perubahan lokal (tambah/ubah/hapus/urutkan) dikirim ke
   Manggaleh sebagai selisih (insert/patch/delete).
3. **Realtime** — event dari perangkat lain memicu muat-ulang daftar sehingga
   semua perangkat melihat data yang sama.

Bila env Manggaleh **tidak diisi**, semua ini mati total dan aplikasi berjalan
persis seperti semula (localStorage). Tidak ada perubahan perilaku default.

### Berkas yang terlibat

| Berkas | Peran |
| --- | --- |
| `src/data/manggaleh.js` | Klien + sesi end-user + pemetaan model↔baris + CRUD + realtime |
| `src/hooks/useManggalehSync.js` | Hydrate, push-diff, langganan realtime |
| `src/hooks/useFamily.js` | Memanggil `useManggalehSync` (satu baris, ter-guard) |
| `.env.example` | Contoh konfigurasi (salin ke `.env.local`) |
| `scripts/manggaleh-smoke.mjs` | Smoke-test adapter vs SDK live |
| `scripts/manggaleh-seed.mjs` | Isi/atur ulang data awal lewat Node (tanpa browser) |

## Langkah 1 — Provisioning (CLI)

```bash
npm install -g @manggaleh/cli

mg login --url https://api.manggaleh.com   # email & password ditanyakan
mg projects create --name "Silsilah Maruhun" --slug silsilah-maruhun

# Koleksi `people`. Nama kolom snake_case; `code` = id aplikasi (slug, UNIK),
# `sibling_order` dipakai karena `order` adalah kata-kunci SQL, `spouse_ids`
# bertipe jsonb (CLI belum punya tipe array). Penanda tipe: `!`=NOT NULL, `^`=UNIQUE.
mg collections create --project silsilah-maruhun --env dev --name people \
  --columns "code:text!^,name:text!,gender:text,birth_year:integer,death_year:integer,city:text,country:text,bio:text,phone:text,photo:text,parent_id:text,parent2_id:text,spouse_id:text,spouse_ids:jsonb,sibling_order:integer"

# Ambil PUBLISHABLE key (aman untuk browser).
mg keys create --project silsilah-maruhun --env dev --type publishable
```

> **Catatan origin CLI (sudah teratasi).** Sebelumnya `mg login` ke
> `https://api.manggaleh.com` bisa gagal `403 Invalid origin`: CLI mengirim
> header `Origin: <baseUrl>` dan, lewat HTTP/2, server `better-auth` hanya
> memercayai origin di `trustedOrigins`. **Server kini sudah dikonfigurasi
> memercayai `https://api.manggaleh.com`** (lewat `BETTER_AUTH_URL` /
> `CORS_ALLOWED_ORIGINS` → `controlPlaneOrigins`), sehingga `mg login` dan
> seluruh provisioning lewat CLI resmi berfungsi normal. Bila memakai base URL
> lain, tambahkan URL itu ke `CORS_ALLOWED_ORIGINS` server lalu restart API
> (CLI ≥ 0.2.1 menampilkan petunjuk ini pada pesan error 403).

## Langkah 2 — Konfigurasi front-end

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan slug proyek dan **publishable key** dari Langkah 1
(`.env.local` di-ignore git). Lalu:

```bash
npm run dev
```

### Mengisi data awal (seed)

Ada dua cara — keduanya idempoten (hanya mengisi bila koleksi kosong):

- **Lewat aplikasi:** set `VITE_MANGGALEH_SEED=true` sekali, jalankan
  `npm run dev`, buka aplikasi (data 167 anggota terisi), lalu **kembalikan ke
  `false`**.
- **Lewat Node (tanpa browser):**

  ```bash
  node --env-file=.env.local scripts/manggaleh-seed.mjs          # seed bila kosong
  node --env-file=.env.local scripts/manggaleh-seed.mjs --reset  # hapus semua lalu seed
  ```

Untuk memverifikasi adapter terhadap server kapan saja:

```bash
node --env-file=.env.local scripts/manggaleh-smoke.mjs
```

## Pemetaan model

Aplikasi memakai id slug buatan sendiri (mis. `datuk-maruhun`) sebagai
penghubung relasi. Manggaleh mengelola `id` (uuid) internalnya sendiri, jadi id
aplikasi disimpan di kolom `code` dan **selalu** dipakai sebagai identitas yang
dilihat UI. Pemetaan field ada di `toRow` / `fromRow` (`src/data/manggaleh.js`):

| Aplikasi | Kolom Manggaleh |
| --- | --- |
| `id` | `code` (text, NOT NULL, unik) |
| `birthYear` / `deathYear` | `birth_year` / `death_year` |
| `parentId` / `parent2Id` | `parent_id` / `parent2_id` |
| `spouseId` / `spouseIds` | `spouse_id` (text) / `spouse_ids` (jsonb) |
| `order` | `sibling_order` |

`spouse_ids` bertipe **jsonb**: ditulis sebagai **string JSON**
(`JSON.stringify([...])`) dan dibaca kembali sebagai **array** yang sudah
terurai — sudah ditangani di `toRow`/`fromRow`.

## Perbedaan SDK vs draft awal (yang diperbaiki)

Draft pertama ditulis dari docs SDK saja. Saat dicocokkan dengan
`@manggaleh/sdk@0.1.0` yang sebenarnya, ditemukan & diperbaiki:

1. **Data API mewajibkan sesi end-user.** Publishable key SAJA ditolak `401`.
   Karena aplikasi ini mode terbuka (tanpa layar login), adapter membuat akun
   **end-user anonim per-perangkat**: dibuat sekali (`signUp`), kredensialnya
   disimpan lokal, lalu dipakai `signIn` pada kunjungan berikutnya
   (`ensureSession` di `manggaleh.js`). Koleksi `people` tidak owner-scoped, jadi
   semua end-user melihat & menyunting baris yang sama.
2. **Kolom array tak didukung CLI** → `spouse_ids` memakai **jsonb** (string
   JSON saat tulis, array saat baca), bukan `text[]`.
3. **`list()` dibatasi 50 (maks 200) baris** → `listPeople` mengambil seluruh
   baris lewat **paginasi keyset** (`page()` + `nextCursor`).
4. **Rate limit ~120 request/menit & maks 50 operasi/transaksi** → insert massal
   (seed) memakai **`client.tx`** per-batch 50 (`insertManyPeople`), bukan
   ratusan insert paralel yang akan kena `429`.
5. **Origin CLI** — `mg login` ke `api.manggaleh.com` sempat `403 Invalid
   origin`; sudah teratasi dengan memercayai origin itu di server (lihat catatan
   pada Langkah 1). Provisioning kini bisa sepenuhnya lewat CLI resmi.

## Keamanan & mode terbuka

- **Hanya publishable key di front-end.** Service key (akses admin penuh) tidak
  boleh masuk ke kode klien atau repo.
- Koleksi `people` **terbuka untuk dibaca** (perlu untuk realtime), dan tulisan
  dilewatkan melalui **gerbang whitelist nomor telepon** (server-side function).
  Lihat **[docs/MANGGALEH_WHITELIST.md](./MANGGALEH_WHITELIST.md)** untuk cara
  kerja, batas keamanannya, dan cara mengelola daftar nomor. Singkatnya: gerbang
  ini menahan pengguna biasa & utak-atik localStorage, tetapi bukan anti-bypass
  mutlak karena publishable key tetap bisa menulis langsung ke koleksi terbuka.

## Catatan & batasan yang diketahui

- **Realtime memuat-ulang seluruh daftar** tiap event — sederhana & andal untuk
  pohon kecil/menengah (ratusan baris). Untuk data besar, optimalkan ke patch
  per-baris.
- **Push-diff memakai perbandingan JSON** antar snapshot; paling buruk hanya
  menghasilkan satu patch berlebih, tidak merusak data.
- **`reset` lokal** (tombol refresh) hanya mengosongkan cache localStorage; ia
  tidak menghapus data remote (gunakan `scripts/manggaleh-seed.mjs --reset`).
