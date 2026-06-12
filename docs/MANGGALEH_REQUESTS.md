# Usulan Perubahan + Persetujuan PIN

Agar data silsilah terjaga, **tidak ada lagi ubah data langsung**. Alur barunya:

1. Saat melihat profil seseorang, siapa pun bisa menekan **"Usulkan ubah / tambah /
   hapus"** — muncul form berisi data sekarang, diedit seperlunya, isi **nama
   pengaju**, lalu **kirim**. Usulan masuk sebagai **pending**.
2. **Semua orang melihat daftar usulan pending** (tombol "Usulan" di header).
3. Menyetujui (atau menolak) sebuah usulan butuh **PIN 6 digit**. Hanya orang
   tertentu yang kamu beri PIN bisa menyetujui. Setelah disetujui, perubahan baru
   diterapkan ke pohon — dan muncul real-time di semua perangkat.

Aktif hanya saat integrasi Manggaleh menyala. Pada mode localStorage (tanpa env),
aplikasi memakai pengeditan langsung seperti semula.

## Cara kerja

```
Mengajukan:  Frontend ─► insert ke koleksi `requests` (terbuka, tanpa PIN)
Menyetujui:  Frontend ─► function resolveRequest({code, action, pin})
                          ├─ cek PIN (server-side, tak ada di bundle)
                          ├─ terapkan op ke `people` (insert/update/remove)
                          └─ set status usulan -> approved/rejected
Realtime:    perubahan `people` & `requests` ─► semua klien menyegarkan
```

| Berkas | Peran |
| --- | --- |
| `functions/resolveRequest.js` | Cek PIN + terapkan perubahan ke `people` |
| `src/data/manggaleh.js` | `submitRequest`, `listRequests`, `resolveRequest`, dll. |
| `src/hooks/useRequests.js` | Daftar usulan (hydrate + realtime) |
| `src/components/RequestsPanel.jsx` | Daftar pending + input PIN |
| `src/components/AddMemberSheet.jsx` | Form usulan (tambah/ubah) + nama pengaju |
| `scripts/manggaleh-set-pin.mjs` | Menyetel PIN persetujuan |

Koleksi: `requests` (code, op, target_code, target_name, payload jsonb,
relation jsonb, requester, note, status, summary).

## Menyetel / mengganti PIN

PIN disimpan **di dalam kode function di server**, bukan di bundle frontend.
Tetapkan lewat skrip (PIN asli tidak pernah masuk repo):

```bash
mg login --url https://api.manggaleh.com           # sekali
MANGGALEH_APPROVE_PIN=482913 node scripts/manggaleh-set-pin.mjs
```

Ganti PIN kapan saja dengan menjalankan ulang skrip memakai angka baru. Bagikan
PIN hanya ke orang yang berwenang menyetujui.

> Nilai PIN yang sedang aktif saat fitur ini dibuat adalah **`482913`**
> (sementara) — **segera ganti** dengan PIN-mu sendiri.

## ⚠️ Batas keamanan (penting)

Ini **gerbang tingkat-aplikasi**, **bukan anti-bypass mutlak**:

- Publishable key (dibutuhkan untuk baca + realtime) secara teknis masih bisa
  menulis langsung ke koleksi `people`/`requests` lewat API. Manggaleh (saat ini)
  tak bisa mengunci tulis sambil tetap mengizinkan baca/realtime.
- PIN dicek di server dan tak pernah ada di bundle, tetapi karena 6 digit, secara
  teori bisa ditebak (≈1 juta kombinasi; rate limit server ~120/menit memperlambat
  jadi berhari-hari). Pakai PIN yang tidak mudah ditebak.

Untuk app silsilah keluarga internal, alur ini memberi integritas yang baik:
pengguna biasa tidak bisa mengubah data tanpa melalui usulan + persetujuan PIN.
Untuk anti-bypass mutlak diperlukan menghapus publishable key dari frontend dan
mengalirkan semua baca/tulis lewat admin function (kehilangan realtime → polling).

## Memperbarui function

```bash
# resolveRequest tanpa mengubah PIN tidak disarankan (akan mereset PIN ke
# placeholder). Selalu set PIN lewat skrip:
MANGGALEH_APPROVE_PIN=<pin> node scripts/manggaleh-set-pin.mjs
```
