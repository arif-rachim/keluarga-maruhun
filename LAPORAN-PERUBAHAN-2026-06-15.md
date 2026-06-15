# Laporan Perubahan Data Silsilah — 15 Juni 2026

**Database:** Manggaleh production (tenant `silsilah-maruhun/dev`)
**Sumber masukan:** dokumen **M. Iqbal** (cabang Rosna) & **masukan dari WhatsApp group Family** (cabang Asma, Umar, Om Yoen)
**Hasil:** total anggota **201 → 232**. Semua disinkronkan ke `src/data/seed.js` (no. HP di-strip demi privasi).

---

## A. Cabang Hj. Rosna — dari dokumen Iqbal

### Nama dilengkapi / diperbaiki
| Sebelum | Sesudah |
|---|---|
| Rosna | **Hj. Rosna** |
| Allend Kotslanto | **H. Allend Costlanto** |
| Alber | **Albert Carlanto** |
| Anderson Dt Rajo Sulaiman | **Anderson Gazanova** |
| Alfrio Martlanto | **Alfrio Marlanto** |
| Syifa | **Syifa Assrofiyah** |
| Hamim | **Hamim Al-Fariz** |
| Rubben | **Rubiansah Fahbandi** |

### Tahun lahir ditambahkan
Asni (1952), Allend (1971), Fitria (1974), Alfi Maulia (1995), Syifa (1999),
Hamim (2001), Rubiansah (2006), Albert (1974), Anderson (1972), Alfrio (1983),
Mohammad Iqbal (1978), Nadien (1982), Akhmad Fazri (1987).

### Pasangan baru ditambahkan
Djama Husein (suami Rosna, alm), Bermawi St Radjo (suami Asni, alm),
Hanif Muchtar (suami Emawati).

### Anak / cabang baru ditambahkan
- **Anak Asni baru:** Elmi Astrabel + Maivendri -> Ardel Aulia Dzikri, Adli Muhammad Alkhairi
- **Cabang Azwar** + Desniwelti -> Delen Novri, Hera Resinia, Ahmad Riva'i, Virli Novita Sari
- **Cabang Yon Hendri** + Tukiyem -> Elian
- **Cabang Ardi** + Waljiati -> Achmad Faizal, Haryanto Ardi, Fadilah Ardiansyah, Aditya Azka Hilmi
- **Cabang Rinaldi** + Uun -> Rini, Rani, Rena

### Perubahan struktur
- **Anak Else diganti** sesuai Iqbal: dihapus Dzaky, Riska, Caca, Kayla ->
  ditambah Elland Dzaki Ramadhan, Farah Salsabilla, Andika Dzikry Gazanova.
- **Rani & Rena dipisah** menjadi dua orang (semula satu node "Rani Rena").

### Urutan anak diselaraskan dengan Iqbal
- Rosna -> Asni, Azwar, Emawati, Yon Hendri, Ardi, Rinaldi (lalu Ujang, Iwan)
- Asni -> Allend, Else, Albert, Elmi, Alfrio
- Allend -> Alfi, Syifa, Hamim, Rubiansah (lalu Queenara, Alka)
- Emawati -> Mohammad Iqbal, Nadien, Achmad Fazri

> Dipertahankan (ada di data, tak ada di daftar Iqbal): Queenara, Alka, Ujang, Iwan.

---

## B. Cabang Hj. Asma + Syahrul Zain St Sati — masukan WhatsApp group Family
- Nama ibu **"Rosma" -> "Hj. Asma"** (dikonfirmasi bio lama: "dipanggil Tek Soma").
- Suami **"Syahrul Zain" -> "Syahrul Zain St Sati"**.
- Nama anak dirapikan (Zein -> Zain + nama formal): Ermi -> **Army Zain**,
  Erwin -> **Erwin Zain**, Herman -> **Erman Zain**, Tuti -> **Astuti Zain**,
  Wati -> **Ernawati Zain**, Tante Ida -> **Ernida Zain**, Tini -> **Hartini Zain**.
- **Anak baru:** Eryunis Zain, Upik Leny Zain (sebelumnya hilang).
- Urutan 9 anak: Army, Erwin, Erman, Astuti, Ernawati, Ernida, Eryunis, Upik Leny, Hartini.

---

## C. Cabang Umar — masukan WhatsApp group Family
- Khairani -> **"Khairani Putri Noerza"**; Nelly Silviati ditandai almarhumah.
- **"Iang" -> "Andri"** (nama asli Andri, panggilan Iang).
- Urutan anak: **Nelly Silviati, Desi, Andri**.

---

## D. Cabang Om Yoen (di bawah Nurjanah) — masukan WhatsApp group Family
- **Adhi** dipindah dari "anak Om Yoen" -> **suami Cindy**.
- **Keanu & Kayra** dipindah -> **anak Cindy** (cucu Om Yoen).
- Om Yoen ditandai almarhum, Tante Adek almarhumah; kota **Cikampek** (Om Yoen, Om Deden).

---

## E. Audit perubahan hari ini — siapa yang mengubah
Total record disentuh hari ini (15 Juni 2026): **81** (35 baru dibuat).
Berdasarkan metadata `updated_by` di production:

- **Otomasi (skrip impor — atas dokumen Iqbal & masukan WhatsApp group Family):**
  ~72 record, dijalankan beberapa batch (sekitar 02:56, 03:06, 03:09, 05:49, 06:03 UTC).
  Inilah seluruh perubahan yang dirinci di bagian A–D.

- **Anggota keluarga langsung via aplikasi (2 pengguna):**
  - Pengguna `C1wcbBN4…` — **8 record** (05:20–05:40 UTC):
    Muhammad Adriansyah, Citra Raditha, Mysha Anum, Aysha Nadira Syifa,
    Atiya Dyandra Nafisha, Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan.
    (3 di antaranya baru dibuat hari ini: Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan.)
  - Pengguna `TZVggJGq…` — **1 record** (05:12 UTC): Muhammad Budi Wirawan.

> Catatan: nama asli pengguna tidak dapat dipetakan dari ID akun via API (hanya ID
> yang tersedia). Perubahan dua pengguna di atas dilakukan langsung lewat aplikasi,
> terpisah dari skrip impor.

---

## Catatan umum
- **Tante Ita / Hendri / Hendra:** dikonfirmasi sudah benar — tidak diubah.
- **Belum dilengkapi (atas permintaan):** tahun lahir & jenis kelamin anak-anak
  Hj. Asma; urutan saudara Nenek Misah (cabang Nurjanah).
- Sumber kebenaran = database production. `seed.js` adalah cerminannya.
