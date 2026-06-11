# Integrasi Cloud dengan Manggaleh (DRAFT)

Membuat silsilah tersinkron antar perangkat (real-time) dengan
[Manggaleh](https://github.com/arif-rachim/manggaleh) sebagai backend —
menggantikan penyimpanan localStorage yang per-perangkat.

> **Status: draft / proof-of-concept.** Kode sudah ditulis dan build hijau,
> tetapi **belum diuji terhadap server Manggaleh sungguhan** (host
> `api.manggaleh.com` diblokir oleh network allowlist saat draft ini dibuat).
> Jalankan langkah verifikasi di bawah dari mesin lokal sebelum diandalkan.

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
| `src/data/manggaleh.js` | Klien + pemetaan model↔baris + CRUD + realtime |
| `src/hooks/useManggalehSync.js` | Hydrate, push-diff, langganan realtime |
| `src/hooks/useFamily.js` | Memanggil `useManggalehSync` (satu baris, ter-guard) |
| `.env.example` | Contoh konfigurasi (salin ke `.env.local`) |

## Langkah 1 — Provisioning (CLI, dari mesin lokal)

```bash
npm install -g @manggaleh/cli

# Masuk dengan akunmu (lihat `mg --help` untuk perintah persisnya).
mg login --url https://api.manggaleh.com --email you@example.com

# Buat proyek (tenant).
mg projects create --name "Silsilah Maruhun" --slug silsilah-maruhun

# Buat koleksi `people`. Nama kolom snake_case; `code` = id aplikasi (slug),
# `sibling_order` dipakai karena `order` adalah kata-kunci SQL.
mg collections create --project silsilah-maruhun --env dev --name people \
  --columns "code:text!,name:text!,gender:text,birth_year:integer,death_year:integer,city:text,country:text,bio:text,phone:text,photo:text,parent_id:text,parent2_id:text,spouse_id:text,spouse_ids:text[],sibling_order:integer"

# Ambil PUBLISHABLE key (aman untuk browser).
mg keys create --project silsilah-maruhun --env dev --type publishable
```

> **Tambahkan indeks UNIK pada kolom `code`** (lewat dashboard bila CLI belum
> mendukungnya) agar id aplikasi tidak terduplikasi.

## Langkah 2 — Konfigurasi front-end

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan slug proyek dan **publishable key** dari Langkah 1.
Untuk run pertama yang masih kosong, set `VITE_MANGGALEH_SEED=true` agar 55
anggota awal (dari `src/data/seed.js`) terisi otomatis — lalu **kembalikan ke
`false`** setelah terisi.

```bash
npm run dev
```

## Pemetaan model

Aplikasi memakai id slug buatan sendiri (mis. `datuk-maruhun`) sebagai
penghubung relasi. Manggaleh mengelola `id` internalnya sendiri, jadi id
aplikasi disimpan di kolom `code` dan **selalu** dipakai sebagai identitas yang
dilihat UI. Pemetaan field ada di `toRow` / `fromRow` (`src/data/manggaleh.js`):

| Aplikasi | Kolom Manggaleh |
| --- | --- |
| `id` | `code` (text, unik) |
| `birthYear` / `deathYear` | `birth_year` / `death_year` |
| `parentId` / `parent2Id` | `parent_id` / `parent2_id` |
| `spouseId` / `spouseIds` | `spouse_id` / `spouse_ids` (text[]) |
| `order` | `sibling_order` |

Bila proyekmu tak mendukung kolom array, ubah `spouse_ids` menjadi `text`/`jsonb`
dan sesuaikan `JSON.stringify`/`JSON.parse` di `toRow`/`fromRow`.

## Keamanan & mode terbuka

- **Hanya publishable key di front-end.** Service key (akses admin penuh) tidak
  boleh masuk ke kode klien atau repo.
- Aplikasi ini **mode terbuka** (siapa pun boleh menambah anggota, dan langsung
  terlihat semua). Maka koleksi sengaja **tidak** memakai owner-column RLS yang
  akan menyembunyikan baris milik orang lain. Konsekuensinya: siapa pun yang
  punya publishable key dapat menulis. Untuk produksi, pertimbangkan
  mengaktifkan auth end-user + aturan tulis, atau memindahkan penulisan ke
  server-side function.

## Catatan & batasan yang diketahui

- **Belum teruji live** (lihat status di atas). Verifikasi: tambah anggota di
  satu browser → muncul otomatis di browser lain (realtime), lalu reload untuk
  memastikan tersimpan.
- **Realtime memuat-ulang seluruh daftar** tiap event — sederhana & andal untuk
  pohon kecil (~puluhan baris). Untuk data besar, optimalkan ke patch per-baris.
- **Push-diff memakai perbandingan JSON** antar snapshot; paling buruk hanya
  menghasilkan satu patch berlebih, tidak merusak data.
- **`reset` lokal** (tombol refresh) hanya mengosongkan cache localStorage; ia
  tidak menghapus data remote.
