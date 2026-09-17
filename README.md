# Expense & Budget Visualizer

Aplikasi web pelacak pengeluaran harian dengan visualisasi chart. Data tersimpan di browser menggunakan LocalStorage.

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Responsive Design, Dark/Light Theme)
- JavaScript (Vanilla ES6+)
- [Chart.js](https://www.chartjs.org/) v4.4.1 (via CDN)
- LocalStorage untuk persistensi data

## Fitur

- Tambah transaksi pengeluaran (nama, nominal Rupiah, kategori)
- Kustomisasi kategori (tambah/hapus kategori sendiri)
- Riwayat transaksi dengan 5 mode pengurutan
- Navigasi per bulan untuk melihat total pengeluaran per bulan
- Kartu total pengeluaran keseluruhan
- Pie chart distribusi pengeluaran per kategori (dengan tooltip persentase & nominal)
- Toggle tema terang/gelap (tersimpan di LocalStorage)
- Responsive design (desktop, tablet, mobile)

## Cara Menjalankan

Buka `index.html` di browser modern, atau gunakan local server:

```bash
# Menggunakan Python
python -m http.server

# Menggunakan npx
npx serve .
```

Jika menggunakan Laragon, akses langsung melalui:
```
http://codingcamp-revou.test
```

## Struktur Project

```
├── index.html          # Halaman utama (single-page app)
├── css/
│   └── style.css       # Semua styling & responsive rules
└── js/
    └── app.js          # Semua logika aplikasi
```

## Kategori Default

| Kategori | Keterangan |
|----------|------------|
| Makanan | Pengeluaran untuk makan & minum |
| Transportasi | Pengeluaran untuk transport |
| Hiburan | Pengeluaran untuk hiburan |

> Kategori dapat ditambah dan dihapus sesuai kebutuhan.

## Catatan

- Semua data hanya tersimpan di browser (localStorage). Data akan hilang jika cache browser dihapus.
- Format mata uang menggunakan Rupiah (Rp) dengan locale `id-ID`.
- Aplikasi berjalan tanpa dependency atau build step — cukup buka `index.html`.
