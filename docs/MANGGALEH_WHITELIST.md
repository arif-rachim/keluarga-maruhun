# Gerbang Sunting via Whitelist Nomor Telepon

Agar tidak semua orang bisa mengubah silsilah, aplikasi punya **gerbang sunting**:
untuk menambah/mengubah/menghapus anggota, pengguna harus "masuk" dengan **nama +
nomor WhatsApp**. Nomor dicocokkan dengan koleksi `whitelist` di server; hanya
nomor terdaftar yang boleh menyunting. Tanpa masuk, aplikasi tetap bisa
**dilihat & dijelajahi** (read-only).

Fitur ini hanya aktif saat integrasi Manggaleh menyala (env terisi). Pada mode
localStorage, tidak ada gerbang (perilaku asli).

## Cara kerja

```
Frontend (publishable key)
  ├─ BACA + realtime  ───────────────►  koleksi people (terbuka)
  └─ TULIS  ─► function checkAccess / mutatePeople ─► cek `whitelist` ─► tulis people
```

- **`checkAccess(phone)`** — dipakai saat login; balas `{ approved, name }`.
- **`mutatePeople({ phone, op, … })`** — satu-satunya jalur tulis aplikasi.
  Server **memeriksa ulang** nomor terhadap `whitelist` sebelum menulis, jadi
  gerbang tidak bisa dilewati hanya dengan mengutak-atik state di browser.

Berkas terkait:

| Berkas | Peran |
| --- | --- |
| `functions/checkAccess.js` | Function server: cek nomor di whitelist |
| `functions/mutatePeople.js` | Function server: tulis people setelah verifikasi whitelist |
| `src/access/useAccess.jsx` | Konteks React: sesi login + `canEdit` |
| `src/components/LoginSheet.jsx` | Lembar masuk (nama + nomor) |
| `src/data/manggaleh.js` | `checkAccess`, sesi, tulis lewat `mutatePeople` |
| `scripts/manggaleh-whitelist.mjs` | Kelola daftar nomor (service key, lokal) |

## ⚠️ Batas keamanan (penting)

Ini **gerbang tingkat-aplikasi**, **bukan anti-bypass mutlak**. Karena:

- Publishable key (dibutuhkan untuk **realtime + baca**) **selalu bisa menulis
  langsung** ke koleksi terbuka — Manggaleh (saat ini) tak punya cara mengunci
  tulis sambil tetap mengizinkan baca/realtime.
- **Nomor telepon tidak diverifikasi** (tanpa OTP). Siapa pun yang *tahu* sebuah
  nomor terdaftar bisa memakainya.

Artinya: gerbang ini menghentikan pengguna biasa & tahan terhadap utak-atik
localStorage, tetapi **penyerang teknis** masih bisa menulis langsung lewat API
memakai publishable key. Untuk app silsilah keluarga internal, ini umumnya
memadai. Bila butuh benar-benar anti-bypass, satu-satunya cara di Manggaleh saat
ini adalah membuang publishable key dari frontend dan mengalirkan **semua** baca
& tulis lewat admin function (function-key) — yang berarti **kehilangan realtime
dan menggantinya dengan polling**.

## Mengelola daftar nomor

Whitelist dikelola dengan **service key** (akses admin) lewat skrip Node —
**bukan** dari frontend. Service key **tidak boleh** di-commit dan **tidak boleh**
memakai prefix `VITE_` (agar tidak ikut ke bundle).

Buat service key (sekali):

```bash
mg keys create --project silsilah-maruhun --env dev --type service --name admin-mgmt
# salin nilai mgsk_… (hanya ditampilkan sekali)
```

Lalu kelola:

```bash
# nomor boleh ditulis bebas (spasi/strip/0/+62) — dinormalkan otomatis ke 62…
MANGGALEH_SERVICE_KEY=mgsk_xxx node --env-file=.env.local scripts/manggaleh-whitelist.mjs list
MANGGALEH_SERVICE_KEY=mgsk_xxx node --env-file=.env.local scripts/manggaleh-whitelist.mjs add "0812-3456-7890" "Budi"
MANGGALEH_SERVICE_KEY=mgsk_xxx node --env-file=.env.local scripts/manggaleh-whitelist.mjs remove "0812-3456-7890"
```

## Memperbarui function

Bila mengubah `functions/*.js`, push ulang:

```bash
mg functions push --project silsilah-maruhun --env dev --file functions/checkAccess.js
mg functions push --project silsilah-maruhun --env dev --file functions/mutatePeople.js
```
