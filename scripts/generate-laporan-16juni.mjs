// Render laporan perubahan 16 Juni 2026 ke PDF (pdfkit, ASCII-safe).
//   node scripts/generate-laporan-16juni.mjs
import PDFDocument from 'pdfkit'
import { createWriteStream } from 'node:fs'

const OUT = 'LAPORAN-PERUBAHAN-2026-06-16.pdf'
const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } })
doc.pipe(createWriteStream(OUT))

const W = doc.page.width - 112
const C = { head: '#1a3a5c', sub: '#2c6e9b', note: '#666666', text: '#1a1a1a' }

function h1(t) { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(16).fillColor(C.head).text(t, { width: W }); doc.moveDown(0.2) }
function h3(t) { doc.moveDown(0.3); doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.text).text(t, { width: W }) }
function p(t) { doc.font('Helvetica').fontSize(10).fillColor(C.text).text(t, { width: W, align: 'left' }) }
function note(t) { doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.note).text(t, { width: W }) }
function bullets(items) {
  doc.font('Helvetica').fontSize(10).fillColor(C.text)
  for (const it of items) doc.text('-  ' + it, { width: W, indent: 8, paragraphGap: 2 })
}
function rule() { doc.moveDown(0.4); const y = doc.y; doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(56, y).lineTo(56 + W, y).stroke(); doc.moveDown(0.4) }

// Simple two-column table renderer (label | value).
function table(rows, opts = {}) {
  const labelW = opts.labelW ?? W * 0.62
  const valW = W - labelW
  doc.fontSize(10)
  for (const [label, val, bold] of rows) {
    const y0 = doc.y
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(C.text)
    doc.text(label, 56, y0, { width: labelW })
    const y1 = doc.y
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(C.text)
    doc.text(String(val), 56 + labelW, y0, { width: valW, align: 'right' })
    doc.y = Math.max(y1, doc.y)
    doc.moveDown(0.12)
  }
}

// ---- Header ----
doc.font('Helvetica-Bold').fontSize(20).fillColor(C.head).text('Laporan Perubahan Data Silsilah')
doc.font('Helvetica').fontSize(11).fillColor(C.text).text('Keluarga Datuk Maruhun  —  16 Juni 2026')
doc.moveDown(0.3)
doc.font('Helvetica').fontSize(9.5).fillColor(C.note)
doc.text('Database: Manggaleh production (tenant silsilah-maruhun/dev)')
doc.text('Sifat laporan: rekap konsolidasi sesi data terakhir (14-15 Juni) + keadaan data terkini per 16 Juni 2026.')
doc.text('Sumber kebenaran: database production; src/data/seed.js adalah cerminannya (no. HP di-strip).')
rule()

// ---- 1. Ringkasan data ----
h1('1. Ringkasan data yang kita punya (per 16 Juni 2026)')
table([
  ['Total anggota', '233', true],
  ['Laki-laki', '94'],
  ['Perempuan', '93'],
  ['Belum diisi jenis kelaminnya', '46'],
  ['Punya tahun lahir', '70  (30%)'],
  ['Ditandai almarhum/almarhumah', '4'],
  ['Punya pasangan tercatat', '90'],
  ['Node akar (kepala cabang / menantu tanpa induk)', '48'],
  ['Referensi menggantung (dangling)', '0'],
])
h3('Sebaran per generasi (kedalaman dari Datuk Maruhun)')
table([
  ['Gen 1 (Datuk Maruhun & pasangan + kepala cabang menikah-masuk)', '48'],
  ['Gen 2', '10'],
  ['Gen 3', '43'],
  ['Gen 4', '74'],
  ['Gen 5', '58'],
])
note('Integritas: 0 referensi menggantung. seed.js tersinkron dengan production.')
rule()

// ---- 2. Apa yang berubah ----
h1('2. Apa saja yang berubah (sesi 14-15 Juni 2026)')
p('Total anggota bertumbuh 201 -> 233 (+32). Ringkas per cabang:')
h3('A. Cabang Hj. Rosna - dari dokumen M. Iqbal')
bullets([
  'Nama dilengkapi: Rosna->Hj. Rosna, Allend Kotslanto->H. Allend Costlanto, Alber->Albert Carlanto, Anderson Dt Rajo Sulaiman->Anderson Gazanova, Alfrio Martlanto->Alfrio Marlanto, Syifa->Syifa Assrofiyah, Hamim->Hamim Al-Fariz, Rubben->Rubiansah Fahbandi.',
  'Tahun lahir ditambahkan untuk 13 orang (Asni 1952 ... Akhmad Fazri 1987).',
  'Pasangan baru: Djama Husein (suami Rosna, alm), Bermawi St Radjo (suami Asni, alm), Hanif Muchtar (suami Emawati).',
  'Cabang/anak baru: keturunan Elmi Astrabel, Azwar, Yon Hendri, Ardi, Rinaldi (belasan nama).',
  'Struktur: anak Else diganti sesuai Iqbal; Rani & Rena dipisah jadi dua orang.',
  'Urutan anak diselaraskan dengan dokumen Iqbal.',
])
h3('B. Cabang Hj. Asma + Syahrul Zain St Sati - WhatsApp group Family')
bullets([
  'Ibu "Rosma"->Hj. Asma; suami->Syahrul Zain St Sati.',
  '7 nama anak dirapikan (Zein->Zain + nama formal); 2 anak baru: Eryunis Zain, Upik Leny Zain.',
  'Urutan 9 anak ditetapkan.',
])
h3('C. Cabang Umar - WhatsApp group Family')
bullets([
  'Khairani->Khairani Putri Noerza; Nelly Silviati ditandai almarhumah; "Iang"->"Andri"; urutan: Nelly, Desi, Andri.',
])
h3('D. Cabang Om Yoen (di bawah Nurjanah) - WhatsApp group Family')
bullets([
  'Adhi dipindah jadi suami Cindy; Keanu & Kayra jadi anak Cindy; Om Yoen & Tante Adek almarhum; kota Cikampek.',
])
h3('E. Perbaikan jodoh Karangan (15 Juni, 09:25)')
bullets([
  'Syamsinar dibuat sebagai istri ke-2 Karangan; bio Karangan dipulihkan; Ellyzar ditautkan ke ibu yang benar (Syamsinar). Ini menambah total 232 -> 233.',
])
rule()

// ---- 3. Audit ----
h1('3. Siapa yang mengubah (audit)')
p('Berdasarkan metadata updated_by/created_at di production untuk sesi 15 Juni 2026 - 81 record disentuh, 35 baru dibuat:')
h3('Otomasi (skrip impor, atas dokumen Iqbal & masukan WhatsApp group Family)')
p('~72 record, beberapa batch (kira-kira 02:56, 03:06, 03:09, 05:49, 06:03, 09:25 UTC). Mencakup seluruh bagian A-E.')
h3('Anggota keluarga langsung via aplikasi (2 pengguna)')
bullets([
  'Pengguna C1wcbBN4...  -  8 record (05:20-05:40 UTC): Muhammad Adriansyah, Citra Raditha, Mysha Anum, Aysha Nadira Syifa, Atiya Dyandra Nafisha, Lynatiu Poe, Muhammad Randy Alfakhri, Tito Arkhan.',
  'Pengguna TZVggJGq...  -  1 record (05:12 UTC): Muhammad Budi Wirawan.',
])
note('Nama asli pengguna tak bisa dipetakan dari ID akun lewat publishable key. Lihat catatan terpisah soal akun pengguna anonim yang dibuat otomatis (di luar laporan ini).')
rule()

// ---- 4. Sisa pekerjaan ----
h1('4. Sisa pekerjaan / belum dilengkapi')
bullets([
  'Tahun lahir & jenis kelamin anak-anak Hj. Asma (46 anggota masih kosong jenis kelaminnya; 70% belum punya tahun lahir).',
  'Urutan saudara Nenek Misah (cabang Nurjanah).',
  'Indryani Barnas (cabang Ellyzar) sengaja dibiarkan tanpa urutan atas keputusan terakhir.',
])
note('Sumber kebenaran = database production. seed.js adalah cerminannya. Disusun 16 Juni 2026.')

doc.end()
await new Promise((res) => doc.on('end', res))
console.log('WROTE', OUT)
