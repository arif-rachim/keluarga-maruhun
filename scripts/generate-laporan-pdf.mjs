// Render laporan perubahan 15 Juni 2026 ke PDF (pdfkit, ASCII-safe).
//   node scripts/generate-laporan-pdf.mjs
import PDFDocument from 'pdfkit'
import { createWriteStream } from 'node:fs'

const OUT = 'LAPORAN-PERUBAHAN-2026-06-15.pdf'
const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } })
doc.pipe(createWriteStream(OUT))

const W = doc.page.width - 112
const C = { head: '#1a3a5c', sub: '#2c6e9b', note: '#666666', text: '#1a1a1a' }

function h1(t) { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(16).fillColor(C.head).text(t, { width: W }); doc.moveDown(0.2) }
function h2(t) { doc.moveDown(0.5); doc.font('Helvetica-Bold').fontSize(12.5).fillColor(C.sub).text(t, { width: W }); doc.moveDown(0.15) }
function h3(t) { doc.moveDown(0.3); doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.text).text(t, { width: W }) }
function p(t) { doc.font('Helvetica').fontSize(10).fillColor(C.text).text(t, { width: W, align: 'left' }) }
function note(t) { doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.note).text(t, { width: W }) }
function bullets(items) {
  doc.font('Helvetica').fontSize(10).fillColor(C.text)
  for (const it of items) doc.text('•  ' + it, { width: W, indent: 8, paragraphGap: 2 })
}
function rule() { doc.moveDown(0.4); const y = doc.y; doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(56, y).lineTo(56 + W, y).stroke(); doc.moveDown(0.4) }

// ---- Header ----
doc.font('Helvetica-Bold').fontSize(20).fillColor(C.head).text('Laporan Perubahan Data Silsilah')
doc.font('Helvetica').fontSize(11).fillColor(C.text).text('Keluarga Datuk Maruhun  —  15 Juni 2026')
doc.moveDown(0.3)
doc.font('Helvetica').fontSize(9.5).fillColor(C.note)
doc.text('Database: Manggaleh production (tenant silsilah-maruhun/dev)')
doc.text('Sumber masukan: dokumen M. Iqbal (cabang Rosna) & masukan dari WhatsApp group Family (cabang Asma, Umar, Om Yoen)')
doc.text('Hasil: total anggota 201 -> 232. Disinkronkan ke src/data/seed.js (no. HP di-strip demi privasi).')
rule()

// ---- A ----
h1('A. Cabang Hj. Rosna — dari dokumen Iqbal')
h3('Nama dilengkapi / diperbaiki')
bullets([
  'Rosna -> Hj. Rosna',
  'Allend Kotslanto -> H. Allend Costlanto',
  'Alber -> Albert Carlanto',
  'Anderson Dt Rajo Sulaiman -> Anderson Gazanova',
  'Alfrio Martlanto -> Alfrio Marlanto',
  'Syifa -> Syifa Assrofiyah; Hamim -> Hamim Al-Fariz; Rubben -> Rubiansah Fahbandi',
])
h3('Tahun lahir ditambahkan')
p('Asni (1952), Allend (1971), Fitria (1974), Alfi Maulia (1995), Syifa (1999), Hamim (2001), Rubiansah (2006), Albert (1974), Anderson (1972), Alfrio (1983), Mohammad Iqbal (1978), Nadien (1982), Akhmad Fazri (1987).')
h3('Pasangan baru')
p('Djama Husein (suami Rosna, alm), Bermawi St Radjo (suami Asni, alm), Hanif Muchtar (suami Emawati).')
h3('Anak / cabang baru')
bullets([
  'Anak Asni baru: Elmi Astrabel + Maivendri -> Ardel Aulia Dzikri, Adli Muhammad Alkhairi',
  'Cabang Azwar + Desniwelti -> Delen Novri, Hera Resinia, Ahmad Riva\'i, Virli Novita Sari',
  'Cabang Yon Hendri + Tukiyem -> Elian',
  'Cabang Ardi + Waljiati -> Achmad Faizal, Haryanto Ardi, Fadilah Ardiansyah, Aditya Azka Hilmi',
  'Cabang Rinaldi + Uun -> Rini, Rani, Rena',
])
h3('Perubahan struktur')
bullets([
  'Anak Else diganti sesuai Iqbal: dihapus Dzaky, Riska, Caca, Kayla -> ditambah Elland Dzaki Ramadhan, Farah Salsabilla, Andika Dzikry Gazanova.',
  'Rani & Rena dipisah menjadi dua orang (semula satu node "Rani Rena").',
])
h3('Urutan anak diselaraskan dengan Iqbal')
bullets([
  'Rosna -> Asni, Azwar, Emawati, Yon Hendri, Ardi, Rinaldi (lalu Ujang, Iwan)',
  'Asni -> Allend, Else, Albert, Elmi, Alfrio',
  'Allend -> Alfi, Syifa, Hamim, Rubiansah (lalu Queenara, Alka)',
  'Emawati -> Mohammad Iqbal, Nadien, Achmad Fazri',
])
note('Dipertahankan (ada di data, tak ada di daftar Iqbal): Queenara, Alka, Ujang, Iwan.')
rule()

// ---- B ----
h1('B. Cabang Hj. Asma + Syahrul Zain St Sati')
note('Masukan dari WhatsApp group Family')
bullets([
  'Nama ibu "Rosma" -> "Hj. Asma" (dikonfirmasi bio lama: "dipanggil Tek Soma").',
  'Suami "Syahrul Zain" -> "Syahrul Zain St Sati".',
  'Nama anak dirapikan (Zein -> Zain): Ermi->Army, Erwin, Herman->Erman, Tuti->Astuti, Wati->Ernawati, Tante Ida->Ernida, Tini->Hartini.',
  'Anak baru: Eryunis Zain, Upik Leny Zain (sebelumnya hilang).',
  'Urutan 9 anak: Army, Erwin, Erman, Astuti, Ernawati, Ernida, Eryunis, Upik Leny, Hartini.',
])
rule()

// ---- C ----
h1('C. Cabang Umar')
note('Masukan dari WhatsApp group Family')
bullets([
  'Khairani -> "Khairani Putri Noerza"; Nelly Silviati ditandai almarhumah.',
  '"Iang" -> "Andri" (nama asli Andri, panggilan Iang).',
  'Urutan anak: Nelly Silviati, Desi, Andri.',
])
rule()

// ---- D ----
h1('D. Cabang Om Yoen (di bawah Nurjanah)')
note('Masukan dari WhatsApp group Family')
bullets([
  'Adhi dipindah dari "anak Om Yoen" -> suami Cindy.',
  'Keanu & Kayra dipindah -> anak Cindy (cucu Om Yoen).',
  'Om Yoen ditandai almarhum, Tante Adek almarhumah; kota Cikampek (Om Yoen, Om Deden).',
])
rule()

// ---- E. Audit ----
h1('E. Audit perubahan hari ini — siapa yang mengubah')
p('Total record disentuh hari ini (15 Juni 2026): 81 (35 baru dibuat). Berdasarkan metadata updated_by di production:')
h3('Otomasi (skrip impor — atas dokumen Iqbal & masukan WhatsApp group Family)')
p('~72 record, dijalankan beberapa batch (sekitar 02:56, 03:06, 03:09, 05:49, 06:03 UTC). Inilah seluruh perubahan yang dirinci di bagian A–D.')
h3('Anggota keluarga langsung via aplikasi (2 pengguna)')
bullets([
  'Pengguna C1wcbBN4...  —  8 record (05:20–05:40 UTC): Muhammad Adriansyah, Citra Raditha, Mysha Anum, Aysha Nadira Syifa, Atiya Dyandra Nafisha, Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan. (3 baru hari ini: Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan.)',
  'Pengguna TZVggJGq...  —  1 record (05:12 UTC): Muhammad Budi Wirawan.',
])
note('Nama asli pengguna tidak dapat dipetakan dari ID akun via API (hanya ID yang tersedia). Perubahan dua pengguna di atas dilakukan langsung lewat aplikasi, terpisah dari skrip impor.')
rule()

// ---- Catatan ----
h1('Catatan umum')
bullets([
  'Tante Ita / Hendri / Hendra: dikonfirmasi sudah benar — tidak diubah.',
  'Belum dilengkapi (atas permintaan): tahun lahir & jenis kelamin anak-anak Hj. Asma; urutan saudara Nenek Misah (cabang Nurjanah).',
  'Sumber kebenaran = database production. seed.js adalah cerminannya.',
])

doc.end()
await new Promise((res) => doc.on('end', res))
console.log('WROTE', OUT)
