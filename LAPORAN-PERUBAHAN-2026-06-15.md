# Laporan Perubahan Data Silsilah — 15 Juni 2026

**Database:** Manggaleh production (tenant `silsilah-maruhun/dev`)
**Sumber masukan:** dokumen **M. Iqbal** (cabang Rosna) & WhatsApp **Fila** (cabang Asma, Umar, Om Yoen)
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

### Tahun lahir ditambahkan (11 orang)
Asni (1952), Allend (1971), Fitria (1974), Alfi Maulia (1995), Syifa (1999),
Hamim (2001), Rubiansah (2006), Albert (1974), Anderson (1972), Alfrio (1983),
Mohammad Iqbal (1978), Nadien (1982), Akhmad Fazri (1987).

### Pasangan baru ditambahkan
Djama Husein (suami Rosna, alm), Bermawi St Radjo (suami Asni, alm),
Hanif Muchtar (suami Emawati).

### Anak / cabang baru ditambahkan
- **Anak Asni baru:** Elmi Astrabel ♥ Maivendri → Ardel Aulia Dzikri, Adli Muhammad Alkhairi
- **Cabang Azwar** ♥ Desniwelti → Delen Novri, Hera Resinia, Ahmad Riva'i, Virli Novita Sari
- **Cabang Yon Hendri** ♥ Tukiyem → Elian
- **Cabang Ardi** ♥ Waljiati → Achmad Faizal, Haryanto Ardi, Fadilah Ardiansyah, Aditya Azka Hilmi
- **Cabang Rinaldi** ♥ Uun → Rini, **Rani**, **Rena**

### Perubahan struktur
- **Anak Else diganti** sesuai Iqbal: dihapus **Dzaky, Riska, Caca, Kayla** →
  ditambah **Elland Dzaki Ramadhan, Farah Salsabilla, Andika Dzikry Gazanova**.
- **Rani & Rena dipisah** menjadi dua orang (semula satu node "Rani Rena").

### Urutan anak diselaraskan dengan Iqbal
- Rosna → Asni, Azwar, Emawati, Yon Hendri, Ardi, Rinaldi (lalu Ujang, Iwan)
- Asni → Allend, Else, Albert, Elmi, Alfrio
- Allend → Alfi, Syifa, Hamim, Rubiansah (lalu Queenara, Alka)
- Emawati → Mohammad Iqbal, Nadien, Achmad Fazri

> Dipertahankan (ada di data, tak ada di daftar Iqbal): Queenara, Alka, Ujang, Iwan.

---

## B. Cabang ibu Fila: Hj. Asma ♥ Syahrul Zain St Sati — dari Fila

### Perbaikan
- Nama ibu **"Rosma" → "Hj. Asma"** (dikonfirmasi bio lama: "dipanggil Tek Soma").
- Suami **"Syahrul Zain" → "Syahrul Zain St Sati"**.
- Nama anak dirapikan (Zein → Zain + nama formal):
  Ermi → **Army Zain** · Erwin → **Erwin Zain** · Herman → **Erman Zain** ·
  Tuti → **Astuti Zain** · Wati → **Ernawati Zain** · Tante Ida → **Ernida Zain** ·
  Tini → **Hartini Zain**.

### Anak baru ditambahkan
**Eryunis Zain** dan **Upik Leny Zain** (sebelumnya hilang).

### Urutan 9 anak (sesuai Fila)
Army, Erwin, Erman, Astuti, Ernawati, Ernida, Eryunis, Upik Leny, Hartini.

---

## C. Cabang Umar — dari Fila
- **Khairani → "Khairani Putri Noerza"**.
- **Nelly Silviati** ditandai almarhumah.
- **"Iang" → "Andri"** (nama asli Andri, panggilan Iang).
- Urutan anak diselaraskan: **Nelly Silviati, Desi, Andri**.

---

## D. Cabang Om Yoen (di bawah Nurjanah) — dari Fila
### Perbaikan struktur
- **Adhi** dipindah dari "anak Om Yoen" → **suami Cindy**.
- **Keanu & Kayra** dipindah → **anak Cindy** (cucu Om Yoen).

### Penanda
- Om Yoen ditandai almarhum, Tante Adek almarhumah; kota **Cikampek** (Om Yoen, Om Deden).

---

## Catatan
- **Tante Ita / Hendri / Hendra:** dikonfirmasi Fila sudah benar — tidak diubah.
- **Belum dilengkapi (atas permintaan):** tahun lahir & jenis kelamin anak-anak
  Hj. Asma; urutan saudara Nenek Misah (cabang Nurjanah).
- Sumber kebenaran = database production. `seed.js` adalah cerminannya (227→232).

## Riwayat commit (branch `claude/repo-review-93477x`)
- `cf74c96` Rekonsiliasi cabang Hj. Rosna dari data Iqbal + sinkron seed.js
- `ef5be91` Pisahkan Rani & Rena menjadi dua orang (anak Rinaldi)
- `c1735b1` Selaraskan urutan anak (sibling order) dengan dokumen Iqbal
- `1a2bf68` Update cabang Om Yoen, Umar, & Asma dari masukan Fila
- `49ef436` Konfirmasi Fila: Army Zain (anak ke-1) & Andri (= Iang)
- `c6b01b9` Selaraskan urutan anak Umar dengan masukan Fila
