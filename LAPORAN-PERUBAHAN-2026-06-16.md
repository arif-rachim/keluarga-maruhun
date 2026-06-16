# Laporan Perubahan Data Silsilah — 16 Juni 2026

**Database:** Manggaleh production (tenant `silsilah-maruhun/dev`)
**Sifat laporan:** rekap konsolidasi — merangkum seluruh perubahan sesi data terakhir (14–15 Juni 2026) beserta keadaan data terkini per 16 Juni 2026.
**Sumber kebenaran:** database production; `src/data/seed.js` adalah cerminannya (no. HP di-strip demi privasi).

---

## 1. Ringkasan data yang kita punya (per 16 Juni 2026)

| Metrik | Jumlah |
|---|---|
| **Total anggota** | **233** |
| Laki-laki | 94 |
| Perempuan | 93 |
| Belum diisi jenis kelaminnya | 46 |
| Punya tahun lahir | 70 (30%) |
| Ditandai almarhum/almarhumah (death year) | 4 |
| Punya pasangan tercatat | 90 |
| Node akar (kepala cabang / menantu tanpa induk tercatat) | 48 |
| Referensi menggantung (dangling) | **0** ✅ |

**Sebaran per generasi** (kedalaman dari Datuk Maruhun):

| Generasi | Jumlah anggota |
|---|---|
| Gen 1 (Datuk Maruhun & pasangan + kepala cabang menikah-masuk) | 48 |
| Gen 2 | 10 |
| Gen 3 | 43 |
| Gen 4 | 74 |
| Gen 5 | 58 |

> Integritas: 0 referensi menggantung — semua `parentId`/`spouseId`/`spouseIds` menunjuk ke anggota yang ada. `seed.js` tersinkron dengan production.

---

## 2. Apa saja yang berubah (sesi 14–15 Juni 2026)

Total anggota bertumbuh **201 → 233** (+32). Ringkas per cabang:

### A. Cabang Hj. Rosna — dari dokumen M. Iqbal
- **Nama dilengkapi:** Rosna→Hj. Rosna, Allend Kotslanto→H. Allend Costlanto, Alber→Albert Carlanto, Anderson Dt Rajo Sulaiman→Anderson Gazanova, Alfrio Martlanto→Alfrio Marlanto, Syifa→Syifa Assrofiyah, Hamim→Hamim Al-Fariz, Rubben→Rubiansah Fahbandi.
- **Tahun lahir ditambahkan** untuk 13 orang (Asni 1952 … Akhmad Fazri 1987).
- **Pasangan baru:** Djama Husein (suami Rosna, alm), Bermawi St Radjo (suami Asni, alm), Hanif Muchtar (suami Emawati).
- **Cabang/anak baru:** keturunan Elmi Astrabel, Azwar, Yon Hendri, Ardi, Rinaldi (total belasan nama).
- **Struktur:** anak Else diganti sesuai Iqbal; **Rani & Rena dipisah** jadi dua orang.
- **Urutan anak** diselaraskan dengan dokumen Iqbal (Rosna, Asni, Allend, Emawati).

### B. Cabang Hj. Asma + Syahrul Zain St Sati — WhatsApp group Family
- Ibu "Rosma"→**Hj. Asma**; suami→**Syahrul Zain St Sati**.
- 7 nama anak dirapikan (Zein→Zain + nama formal); **2 anak baru:** Eryunis Zain, Upik Leny Zain.
- Urutan 9 anak ditetapkan.

### C. Cabang Umar — WhatsApp group Family
- Khairani→**Khairani Putri Noerza**; Nelly Silviati ditandai almarhumah; **"Iang"→"Andri"**; urutan: Nelly, Desi, Andri.

### D. Cabang Om Yoen (di bawah Nurjanah) — WhatsApp group Family
- **Adhi** dipindah jadi **suami Cindy**; **Keanu & Kayra** jadi **anak Cindy**; Om Yoen & Tante Adek ditandai almarhum; kota Cikampek.

### E. Perbaikan jodoh Karangan (15 Juni, 09:25)
- **Syamsinar** dibuat sebagai istri ke-2 Karangan; bio Karangan dipulihkan; **Ellyzar** ditautkan ke ibu yang benar (Syamsinar). Inilah yang menambah total 232 → **233**.

---

## 3. Siapa yang mengubah (audit)

Berdasarkan metadata `updated_by`/`created_at` di production untuk sesi 15 Juni 2026 — **81 record disentuh, 35 baru dibuat**:

- **Otomasi (skrip impor, atas dokumen Iqbal & masukan WhatsApp group Family):** ~72 record, beberapa batch (≈02:56, 03:06, 03:09, 05:49, 06:03, 09:25 UTC). Mencakup seluruh bagian A–E di atas.
- **Anggota keluarga langsung via aplikasi (2 pengguna):**
  - Pengguna `C1wcbBN4…` — **8 record** (05:20–05:40 UTC): Muhammad Adriansyah, Citra Raditha, Mysha Anum, Aysha Nadira Syifa, Atiya Dyandra Nafisha, Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan.
  - Pengguna `TZVggJGq…` — **1 record** (05:12 UTC): Muhammad Budi Wirawan.

> Catatan: nama asli pengguna tak bisa dipetakan dari ID akun lewat publishable key (hanya ID akun yang tersedia). Lihat juga catatan terpisah soal **akun pengguna anonim yang dibuat otomatis** (di luar laporan ini).

---

## 4. Sisa pekerjaan / belum dilengkapi

- Tahun lahir & jenis kelamin anak-anak **Hj. Asma** (46 anggota masih kosong jenis kelaminnya secara keseluruhan; 70% belum punya tahun lahir).
- Urutan saudara **Nenek Misah** (cabang Nurjanah).
- **Indryani Barnas** (cabang Ellyzar) sengaja dibiarkan tanpa urutan atas keputusan terakhir.

---

*Sumber kebenaran = database production. `seed.js` adalah cerminannya. Disusun 16 Juni 2026.*
