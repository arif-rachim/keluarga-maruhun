# Silsilah Keluarga Datuk Maruhun

Aplikasi web (mobile-first) untuk merekam dan menjelajahi pohon keluarga
keturunan **Datuk Maruhun** — agar tali persaudaraan tetap tersambung
walau kita tersebar di belahan dunia yang berbeda.

Dibuat dengan React + Vite, desain bernuansa songket Minangkabau
(charcoal hangat, emas tua, gading).

## Fitur

- 🌳 **Pohon silsilah interaktif** — bisa di-geser (drag) dan di-zoom
  (cubit di HP / roda mouse di desktop), dengan auto-fit ke layar.
- ➕ **Daftarkan keluarga sendiri** — siapa saja bisa menambah anggota
  sebagai *anak dari* atau *pasangan dari* anggota yang sudah ada.
  Tambahan langsung tampil (mode terbuka).
- 👤 **Kartu detail** — foto, tahun lahir/wafat, domisili, cerita singkat,
  serta relasi (orang tua, pasangan, anak, saudara) yang bisa diklik.
- 🔎 **Pencarian** anggota berdasarkan nama atau kota, langsung memfokuskan
  pandangan ke orang tersebut.
- 🌐 **Tiga bahasa** — Bahasa Indonesia, **Baso Minang**, dan English.
  Pilihan tersimpan otomatis. ("Ranji" = silsilah, "Dunsanak" = saudara,
  "Padusi" = perempuan, "Niniak" = tetua.)
- 🖼️ **Hero restorasi foto** di landing page — memutar transisi foto
  keluarga asli → dipulihkan (AI) → diwarnai (AI), lengkap dengan garis
  pemindai emas dan pesan "Foto direstorasi menggunakan AI". Sumber foto
  ada di `public/photo/` (`icon.jpg`, `icon-restored.png`,
  `icon-restored-colored.png`).
- 🏛️ **Ornamen Minangkabau** — silhouette Rumah Gadang bergonjong dan
  motif songket sebagai aksen, nuansa Sumatra Barat.
- ✨ **Micro-animation** (framer-motion) — kartu muncul ber-stagger, garis
  keturunan "tergambar" perlahan, angka statistik menghitung naik, panel
  meluncur, dan transisi reflow yang halus saat anggota baru ditambahkan.
- 📱 **Mobile-first** — gestur sentuh, aman terhadap notch (safe-area).
- 💾 **Tersimpan otomatis** di perangkat (localStorage).
- 🧬 **Data silsilah asli** — 55 anggota (5 generasi) di-import dari berkas
  keluarga `public/Format_Asli_Silsilah_Keluarga.xlsx` menjadi data awal di
  `src/data/seed.js`. Tanda "+" pada berkas asli = pasangan, "alm/almh" =
  almarhum/ah. Tahun, domisili, dan foto dilengkapi langsung dari aplikasi.

## Menjalankan

```bash
npm install
npm run dev        # mode pengembangan (buka URL yang muncul, mis. http://localhost:5173)
```

Untuk versi produksi:

```bash
npm run build      # hasil ada di folder dist/
npm run preview    # mencoba hasil build secara lokal
```

Buka di HP: jalankan `npm run dev`, lalu buka alamat **Network** yang
ditampilkan (mis. `http://192.168.x.x:5173`) dari HP yang berada di Wi-Fi
yang sama.

## Struktur

```
src/
├── App.jsx                 # perakitan utama + alur (intro, detail, tambah, toast)
├── data/
│   ├── seed.js             # data awal contoh keluarga Maruhun (bisa diganti)
│   └── store.js            # lapisan penyimpanan (localStorage) — mudah diganti cloud
├── i18n/
│   ├── translations.js     # kamus 3 bahasa (id / min / en)
│   └── i18n.jsx            # provider + hook useI18n + fungsi t()
├── hooks/
│   ├── useFamily.js        # state + aksi (tambah/ubah/hapus anggota, statistik)
│   ├── usePanZoom.js        # gestur geser & zoom untuk pohon
│   └── useCountUp.js        # animasi angka statistik
├── lib/
│   ├── layout.js           # algoritma tata letak pohon keturunan
│   └── format.js           # util tampilan (inisial, rentang hidup, dll.)
├── components/             # Intro, TreeView, PersonCard, PersonDetail,
│                           # AddMemberSheet, SearchBar, LanguageSwitcher, icons
│                           # (icons.jsx memuat RumahGadang & SongketBand)
└── styles/index.css        # sistem desain
```

## Model data satu anggota

```js
{
  id, name, gender: 'L' | 'P',
  birthYear, deathYear,
  city, country, bio, photo,
  parentId,   // penghubung ke garis keturunan
  spouseId,   // pasangan (ditautkan dua arah)
}
```

## Catatan: menuju cloud (langkah berikutnya)

Saat ini data tersimpan **per perangkat** (localStorage), sehingga belum
tersinkron antar anggota keluarga. Seluruh akses data sudah dipusatkan di
`src/data/store.js`, jadi untuk menjadikannya bersama (semua orang melihat
data yang sama, real-time) tinggal mengganti isi fungsi `loadPeople` /
`savePeople` di file itu dengan backend seperti **Supabase** atau Firebase —
tanpa mengubah komponen UI.
