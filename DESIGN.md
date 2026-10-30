# DESIGN.md — Laper

Acuan desain aktif · Diperbarui 30 Oktober 2026.

Dokumen ini mengatur tampilan dan interaksi Laper. [PRD.md](PRD.md) menentukan perilaku produk, [AGENTS.md](AGENTS.md) menentukan pelaksanaan dan verifikasi teknis. Keputusan pengguna terbaru mengalahkan ketiganya. Dokumen audit lama bukan alasan mengembalikan desain yang sudah ditolak.

## 1. Arah desain

Aplikasi kerja untuk menyusun banyak laporan, bukan landing page. Arah **Framed sheet**: bidang kerja putih dalam bingkai zinc terang, informasi padat tetapi dikelompokkan, dengan daftar kunjungan sebagai objek utama dan detail/hasil di sampingnya.

- Nama produk pada judul tab: Laper — Laporan Perjadin. Favicon dokumen hitam-putih dari `public/favicon.svg`.
- Tidak ada navbar, header merek, sidebar permanen atau navigasi Geostamp Satuan/Massal.
- Tidak ada KPI dekoratif, ilustrasi sambutan, gradient, glass/blur, glow, emoji dekoratif atau entrance animation.
- Border tipis boleh untuk kontrol, tabel dan pemisahan panel. Shadow hanya untuk elemen mengambang seperti menu; bukan panel permanen.
- Kontrol harus jelas melalui label dan posisi, bukan petunjuk panjang. Teks UI dalam bahasa Indonesia, sentence case.

## 2. Palet dan peran warna

| Peran | Warna |
| --- | --- |
| Latar aplikasi | #f4f4f5 |
| Bidang kerja/kertas/input | #ffffff |
| Permukaan sekunder | #fafafa |
| Teks utama | #18181b |
| Teks kontrol | #27272a |
| Teks sekunder | #52525b |
| Placeholder | #71717a |
| Border panel | #e4e4e7 |
| Border tombol | #d4d4d8 |
| Border input | #a1a1aa |
| Aksi utama | #18181b dengan teks putih |
| Hover aksi utama | #27272a dengan teks putih |
| Fokus/aksen aktif | #1d4ed8 / #1e40af |
| Baris aktif | #eff6ff dengan tepi kiri #1d4ed8 |
| Hover baris | #f4f4f5; baris aktif hover #dbeafe |
| Seleksi teks | #1e40af dengan teks putih |
| Destruktif | #b91c1c dengan border #fecaca |

Warna membawa makna konsisten: biru untuk fokus/pilihan, hijau untuk sukses, kuning untuk peringatan, merah untuk gagal/destruktif. Tidak memakai cyan/hijau muda untuk seleksi teks. Status harus mempunyai kata/penanda, bukan warna saja. Target kontras teks biasa minimal 4,5:1; ikon/fokus kontrol minimal 3:1 terhadap sekitarnya.

## 3. Tipografi dan ukuran

- UI: **Plus Jakarta Sans**, fallback system-ui/sans-serif. Dokumen: **Times New Roman**, fallback Times/serif.
- Judul layar 24px/600 desktop, 22px mobile; tracking sekitar −0,025em.
- Judul panel 16px/600; isi/tombol utama 14px dengan line-height sekitar 1,5; label/meta 12–13px.
- Teks utama yang dipakai untuk bekerja target 14px. Label tanggal/waktu/hari saat ringkas boleh 13px; placeholder thumbnail kosong adalah pengecualian 10px dalam box kecil, selalu didampingi accessible name.
- Dokumen tetap 12pt, tidak dikecilkan agar muat satu halaman.
- Angka jam/tanggal dan jumlah yang berubah memakai tabular figures. ID adalah metadata sekunder, bukan pengganti nama wilayah.
- Nama panjang boleh membungkus; jangan menyembunyikan identitas kunjungan demi ruang kolom tambahan.

## 4. Geometri dan layout responsif

| Bagian | Patokan |
| --- | --- |
| Workspace desktop | Margin atas 8px, samping/bawah 24px; padding 28px; radius 16px |
| Panel | Radius 8px, border 1px; tanpa shadow permanen |
| Kontrol | Radius 6px, padding sekitar 8 × 12px; input tinggi 40px |
| Jarak | Basis 4px; 10–16px antarkontrol, 20–24px antarblok |
| Grid utama | minmax(0,3fr) minmax(340px,2fr), gap 24px |
| Thumbnail tindakan | 56 × 56px, radius 4px; gambar object-fit cover |
| Kontrol sentuh | Area target minimal 44px jika memungkinkan; ikon kecil tidak berarti target klik kecil |

**Lebar >1100px:** daftar dan inspector berdampingan sekitar 60/40. Daftar dapat menggulir dalam frame dengan header tabel sticky; min-height kerja awal sekitar 540px. Jangan membuat halaman ikut scroll horizontal.

**641–1100px:** satu area aktif; daftar dan detail bergantian. Tombol kembali mengembalikan pengguna ke daftar. Profil dua kolom jika muat.

**≤640px:** workspace tanpa border/radius luar dan margin, padding 20px vertikal/16px horizontal. Profil satu kolom; toolbar membungkus dengan gap 10px; tombol umumnya minimal 44px. Kolom Kelengkapan disembunyikan, tetapi penanda status pindah ke isi dokumentasi. Identitas, hari/tanggal dan lokasi tetap terbaca.

Tanggal/waktu/hari disusun satu baris bila lebar inspector cukup. Pada inspector sempit (termasuk viewport 1101–1350px) dan mobile, gunakan dua kolom dengan Hari pada baris berikutnya. Jangan memaksa tiga input menjadi sulit diketik.

## 5. Struktur layar dan toolbar

Urutan tetap:

1. Judul Laporan Perjadin dan kalimat penjelas singkat.
2. Ringkasan pegawai, kegiatan, ST; tombol Ubah profil & kegiatan.
3. Notifikasi dan progres bila ada.
4. Toolbar **Tambah foto · Impor & template · Ekspor & cetak**.
5. Toolbar seleksi bila ada.
6. Daftar kunjungan dan panel detail/preview.

Tidak ada search kunjungan, filter Perlu dilengkapi atau opsi perlakuan foto unggahan. Jangan memakai margin-left:auto untuk memisahkan jauh tombol impor/ekspor. Toolbar selection menyatakan jumlah dipilih, preset uraian bersama, Hapus N terpilih, dan Batal pilih.

Menu Ekspor & cetak memuat Word gabungan, ZIP Word terpisah, Cetak laporan terpilih, lalu ringkasan cakupan. Print nonaktif tanpa seleksi; Word/ZIP menggunakan seleksi atau semua bila tidak ada.

## 6. Menu dan lapisan

- Panel menu memakai position absolute/overlay, tidak menambah tinggi toolbar. Jarak sekitar 8px di bawah pemicu, radius 8px, border kontrol, padding 12–16px dan shadow ringan.
- Urutan lapisan saat ini: tabel sticky di bawah overlay; saran lokasi sekitar z-index 15, pilihan hari 20, konteks toolbar 30, details aktif 1000, panel menu 1001. Yang wajib adalah urutan efektif antar-stacking-context, bukan angka tinggi semata.
- Lebar panel impor sekitar 320px; ekspor 240px. Batas lebar calc(100vw − 32px). Mobile boleh di-anchor ke toolbar agar tidak keluar sisi layar.
- Buka/tutup menu tidak mengubah posisi daftar. Menu tidak boleh terpotong overflow panel atau menghalangi pemicu lain secara permanen.
- Panel impor memuat tombol template, penjelasan singkat, Pilih file Excel / CSV, serta format .xlsx/.xls/.csv.

## 7. Daftar kunjungan dan area kosong

Kolom desktop: checkbox, Dokumentasi, Hari/tanggal/jam/lokasi, Kelengkapan.

- Dokumentasi terdiri dari thumbnail tindakan dan teks nama file, label preset/kustom, serta penanda HP.
- Klik thumbnail membuka pilih/ganti foto untuk ID baris itu. Thumbnail kosong bertuliskan **Klik untuk menambah foto**. Klik nama file/narasi/bagian baris lain membuka detail; keyboard Enter/Space pada baris setara klik baris. Jangan menjadikan seluruh kolom Dokumentasi sebagai tombol ganti foto.
- Checkbox tidak membuka baris dan harus memiliki label yang menyebut kunjungan. Klik thumbnail tidak ikut membubbling ke aksi buka detail yang berbeda.
- Hover abu muda meliputi seluruh baris; dokumentasi tidak punya hover sendiri. Thumbnail sebagai affordance kontrol boleh mempunyai feedback ringan. Baris aktif tetap berbeda dari hover dan dari checkbox terpilih.
- Subteks uraian menyebut nama preset yang sesuai isi. Narasi bebas: **Uraian kustom**; kosong: **Uraian belum diisi**.
- Mode stamp menampilkan jam WITA; mode tanpa stamp boleh menampilkan **Foto asli**. Hari/tanggal tetap ada.
- Status desktop: Siap atau Lengkapi, dengan detail kekurangan di inspector. Tidak ada tombol Hapus pada kolom status.
- Mobile: **✓ Lengkap** atau **Perlu dilengkapi** tetap terbaca dalam baris, tanpa memerlukan kolom tambahan.

Area kosong mempunyai heading **Mulai dari foto atau Excel**, penjelasan draf, tombol **Pilih gambar atau Excel**, dan daftar format. Border dashed yang tenang menandakan drop area. Drag-and-drop menerima gambar/Excel/CSV; jangan memakai ilustrasi dekoratif untuk menggantikan aksi.

## 8. Inspector dan kontrol metadata

Header inspector menampilkan nama foto/draf, hari/tanggal, status, dan **Hapus kunjungan** rata kanan. Tab **Detail · Foto · Laporan A4** memakai underline 2px dan teks aktif biru. Footer menyediakan Sebelumnya/Berikutnya dengan disabled pada ujung daftar.

Detail:

- Switch **Tambah photostamp** berupa track 44 × 24px, thumb putih 18px; on biru, off abu, di kanan label. Gunakan area klik label/target sentuh yang memadai, role switch, aria-checked dan fokus. Tidak ada dropdown perlakuan foto.
- Off menampilkan penjelasan singkat foto asli, menyembunyikan jam/koordinat; tanggal, hari, tujuan dan uraian tetap bisa diisi.
- Input tanggal/waktu/hari berupa teks dengan ikon di dalam sisi kanan box; bukan tombol berteks Kalender/Jam di luar input. Input mempunyai ruang kanan untuk ikon.
- Popup kalender/jam mengikuti anchor kiri box. Pilihan Hari memiliki opsi Senin–Minggu dan menutup pada pilihan, klik di luar, fokus keluar atau Escape.
- Hari otomatis berubah ketika tanggal berubah; mengetik hari manual tetap mungkin.
- Draf tanpa foto menampilkan tombol Tambahkan foto dokumentasi, bukan error decode atau loading tanpa akhir.
- Label berada di atas input; placeholder tidak menggantikan label. Teks disabled tetap terbaca dan alasan disable harus dapat dipahami.

## 9. Pencarian lokasi dan tujuan

Autocomplete di bawah input, permukaan putih, border dan shadow overlay, max-height sekitar 280px, scroll lokal. Header kecil menjelaskan jumlah hasil atau bahwa hasil adalah saran typo.

Opsi menampilkan nama, konteks desa/kecamatan, ID, jenis wilayah dan jumlah SubSLS untuk SLS. Satu SLS tidak diulang untuk setiap SubSLS. Tersedia **Lihat SLS / Lihat desa/SLS / Lihat SubSLS**, ringkasan lingkup dengan Hapus filter, dan **Lihat hasil lainnya** bila hasil dibatasi.

Kata tingkat wilayah merupakan petunjuk: `desa Bebuaq kecamatan Kopang` mencari desa dalam konteks kecamatan; `dusun Jurit desa Bebuaq` mencari SLS dalam desa. Hasil kosong/ambigu memiliki pesan tindakan; tidak otomatis memilih hasil pertama. ID internal tidak menggantikan label manusia setelah pilihan.

Dropdown mendukung keyboard panah, Enter, Escape, accessible combobox/listbox/option dan status pilihan yang terbaca. Fokus dan klik opsi tidak boleh memicu penyimpanan teks lama yang menimpa pilihan baru.

Tujuan menunjukkan status **Otomatis dari lokasi** atau **Tujuan kustom; tidak mengikuti perubahan lokasi**. Setelah diubah manual, sediakan **Gunakan tujuan dari lokasi**. Nilai kosong bukan izin memasukkan ID atau nilai lama ke dokumen.

Catatan koordinat untuk desa/kecamatan memakai permukaan kuning tenang dan menjelaskan cakupan sampling. Jangan menyebut SLS hasil titik acak sebagai lokasi pasti kunjungan. Pada mode foto asli tidak ada sampling/boundaries hanya demi tujuan otomatis.

## 10. Preview Foto, A4 dan print

Foto: gambar contain, proporsi asli, tidak meregang; latar sekunder, padding sekitar 20px. Seluruh area preview adalah kontrol ganti foto dengan label **Klik untuk mengganti foto**. Jika belum ada, ajak memilih foto. Mode asli tidak menambahkan overlay, mode stamp memperlihatkan overlay reaktif.

A4:

- Kertas 210 × 297mm putih, konten 190 × 277mm setelah padding 10mm; Times New Roman 12pt, line-height awal 1,25 untuk preview browser.
- Latar viewer #e4e4e7, padding 16px, gap antarkertas 24px. Tinggi viewer sekitar 580px, max 75vh dan min 350px sesuai ruang.
- Toolbar viewer: jumlah halaman, minus, persen zoom, plus, Fit to box. Default fit menghitung seluruh halaman dan ukuran viewport; jangan meniru rasio dengan zoom tetap per breakpoint.
- Pagination mengukur konten yang benar-benar dirender pada ukuran penuh sebelum skala. Narasi dapat dilanjutkan; foto/tanda tangan tidak dipotong. Judul, tabel, foto dan tanda tangan tetap mempunyai hierarki dokumen.
- Satu laporan tidak wajib satu halaman. Ukuran font tidak diperkecil untuk menyembunyikan konten panjang.

Print memakai data yang sama di dokumen terisolasi. Jangan mencetak toolbar, panel, latar aplikasi atau skala zoom preview. Margin kertas dan padding tidak boleh menjadi margin ganda. Antarhalaman tanpa gap viewer, setiap laporan baru mulai halaman baru; dialog print pengguna menentukan printer/PDF. Pagination browser bukan jaminan sama dengan Word/WPS atau driver printer.

## 11. Notifikasi dan state

| Tipe | Latar | Border | Teks |
| --- | --- | --- | --- |
| Berhasil | #f0fdf4 | #86efac | #166534 |
| Peringatan/berhasil dengan catatan | #fffbeb | #fcd34d | #92400e |
| Gagal/error validasi | #fef2f2 | #fca5a5 | #991b1b |

Tipe eksplisit dari kejadian, bukan ditebak dari kata pesan. Error memakai role alert, lainnya role status. Tombol tutup mewarisi warna semantik dan accessible name.

Auto-dismiss **3000ms** sejak pesan atau interaksi terakhir: klik notifikasi reset, tutup langsung. Pesan identik yang muncul lagi tetap memakai timer baru. Progres aktif tidak memakai timeout; label fase/jumlah tetap ada sampai proses selesai. Status kelengkapan baris juga tidak hilang setelah 3 detik.

State yang wajib dirancang: daftar kosong, draf Excel tanpa foto, foto sedang dibaca, wilayah sedang dicocokkan, hasil lokasi kosong/ambigu, siap, belum lengkap, seleksi, ekspor/print berjalan, gagal dan sukses. Jangan tampilkan laporan contoh seolah data pengguna.

## 12. Aksesibilitas, gerak dan pemeriksaan

- Semua aksi punya accessible name; fokus terlihat sekitar outline 2px dengan offset 3px. Kontrol native dipertahankan bila membantu keyboard dan perangkat sentuh.
- Klik row, thumbnail dan checkbox harus mempunyai scope berbeda yang konsisten. Pilihan aktif tidak hanya ditunjukkan lewat warna.
- Gerak hanya feedback ringan, misalnya perpindahan thumb switch 150ms; hormati prefers-reduced-motion. Tidak ada animasi masuk yang menahan isi.
- Uji 1440/768/390px pada build produksi, termasuk data terisi, nama panjang, menu terbuka, dropdown lokasi, draf, status HP dan viewer multi-halaman. Periksa screenshot, bukan hasil meter saja.
- Uji menu tanpa layout shift; kalender/jam sejajar input; Hari dismiss; thumbnail vs row; notifikasi timeout/reset; print seleksi; switch on/off. Jangan mencatat lulus berdasarkan build saja.

## 13. Peta implementasi dan status acuan

| Bagian | Sumber utama |
| --- | --- |
| Workspace/daftar/detail | src/components/PerjadinWorkspace.tsx |
| Tanggal, hari, autocomplete | src/components/ReportFields.tsx |
| Pencarian/tujuan | src/locationSearch.ts |
| Pemasangan foto | src/photoAssignment.ts |
| Viewer/pagination | src/components/PerjadinA4Preview.tsx, src/components/PerjadinSheetView.tsx |
| Notifikasi | src/useNotice.ts |
| Cetak | src/printReports.tsx |
| Styling | src/index.css |

Nilai di atas mendokumentasikan arah aktif dan patokan implementasi. CSS lama yang tidak lagi dipakai (header merek, input pencarian lama, dropdown perlakuan foto, skala preview statis) bukan ketentuan desain. Perbedaan aksesibilitas, pemetaan impor, pagination Word/WPS dan uji beban harus dicatat serta diperbaiki sesuai lingkup pekerjaan; dokumen ini bukan klaim seluruh gate sudah lolos.
