# PRD — Laper (Laporan Perjadin)

Status: spesifikasi produk aktif · Diperbarui: 31 Oktober 2026.

## 1. Objektif dan pengguna

Laper membantu pengguna menyelesaikan banyak laporan perjalanan dinas dari foto dokumentasi atau data Excel/CSV dalam satu workspace. Pengguna terutama bekerja melalui laptop/PC dan sesekali HP; bahan awal umumnya foto saja. Seluruh pengolahan berjalan lokal di browser.

**Unit kerja: 1 laporan = 1 kunjungan = 1 hari = 1 foto dokumentasi.** Dua foto dengan tanggal sama tetap dua kunjungan. Sebuah laporan boleh memiliki beberapa halaman A4 bila kontennya panjang. Draf dari Excel boleh belum memiliki foto, tetapi belum siap diekspor atau dicetak.

Identitas produk: **Laper — Laporan Perjadin**, favicon dokumen hitam-putih. Halaman awal langsung workspace Laporan Perjadin, tanpa navbar/header merek maupun pilihan Geostamp Satuan/Massal.

## 2. Batas produk dan acuan

- Aplikasi statis client-side: React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react; docx, JSZip, XLSX dan Turf untuk pengolahan lokal.
- Foto, spreadsheet, stamping, pencarian wilayah, pembuatan Word/ZIP, dan persiapan cetak tidak dikirim ke backend. Tidak memerlukan API key berbayar.
- [DESIGN.md](DESIGN.md) mengatur desain dan interaksi; [AGENTS.md](AGENTS.md) mengatur pelaksanaan teknis serta verifikasi.
- Rencana di `docs/redesign-uiux-plan.md` adalah riwayat audit, bukan spesifikasi yang mengalahkan tiga dokumen aktif ini.
- Kode alat stamping lama bukan destinasi produk saat ini. Ekspor JPEG mandiri bukan alasan untuk mengembalikan navbar Geostamp.

## 3. Alur utama

1. Pengguna membuka workspace; profil tersimpan digunakan bila tersedia.
2. Pengguna memilih atau menyeret gambar maupun Excel/CSV pada area kosong Daftar Kunjungan. Jenis file dikenali otomatis.
3. Gambar membentuk atau melengkapi kunjungan. Spreadsheet dapat membentuk draf terlebih dahulu tanpa foto.
4. Pengguna mengisi profil/kegiatan/ST bersama dan melengkapi metadata per kunjungan pada panel Detail.
5. Tab Foto dan Laporan A4 memperlihatkan hasil reaktif; tidak ada Generate/Terapkan untuk menyegarkan preview.
6. Pengguna memilih kunjungan bila perlu, lalu membuka Ekspor & cetak untuk Word gabungan, ZIP Word terpisah, atau cetak pilihan.

## 4. Workspace dan daftar kunjungan

Urutan layar: judul dan deskripsi singkat, ringkasan pegawai/kegiatan/ST, notifikasi/progres bila ada, toolbar, toolbar seleksi bila ada, daftar serta panel detail/preview.

Toolbar hanya **Tambah foto**, **Impor & template**, **Ekspor & cetak**, berdekatan. Tidak ada kolom pencarian kunjungan atau checkbox Perlu dilengkapi. Semua kunjungan tampil. Menu impor/ekspor mengambang di atas konten tanpa menggeser layout.

Daftar memuat kolom seleksi, **Dokumentasi** (thumbnail, nama file, nama preset uraian atau Uraian kustom/Uraian belum diisi), **Tanggal / hari** (input tanggal type-able beserta nama hari), **Lokasi** (input combobox lokasi type-able dengan autocomplete), dan **Kelengkapan**. Informasi jam tidak ditampilkan pada baris daftar kunjungan (tetap diatur di panel Detail). Pengguna dapat langsung mengubah tanggal dan lokasi di tabel dengan alur keyboard `Tab` berurutan (`Tanggal baris 1` → `Lokasi baris 1` → `Tanggal baris 2` → `Lokasi baris 2`). Total berasal dari data, bukan angka terpisah.

- Klik baris atau Enter/Space membuka detail/preview. Checkbox hanya mengatur seleksi.
- **Hanya thumbnail kecil** membuka pemilih foto untuk baris itu. Thumbnail kosong bertuliskan **Klik untuk menambah foto**. Nama file dan narasi tetap membuka detail.
- Hover abu muda berlaku pada seluruh baris; baris aktif dibedakan dengan aksen biru.
- Hapus kunjungan ada rata kanan pada header panel detail. Hapus N terpilih ada pada toolbar seleksi; kolom Kelengkapan tidak memiliki tombol Hapus.
- Di HP, daftar dan detail bergantian. Nama file dan status lengkap/perlu dilengkapi ditempatkan tepat di bawah thumbnail foto, sedangkan input tanggal/hari dan lokasi tersusun di sisi kanan baris agar tetap nyaman diketik tanpa membuka panel Detail.

## 5. Impor, draf, dan pemasangan foto

Format input: gambar yang didukung browser (utama JPG, PNG, WebP), XLSX, XLS, CSV. Area kosong menerima pilih file serta drag-and-drop. Satu proses gabungan menerima satu spreadsheet dan beberapa gambar: metadata diproses dahulu, lalu foto dipasangkan. Beberapa spreadsheet sekaligus ditolak dengan pesan jelas.

Impor ke daftar kosong membentuk satu draf per baris yang dikenali. Baris kosong diabaikan; variasi header/tanggal/nama wilayah ditangani. Draf tanpa foto dapat diedit dan dipratinjau A4 dengan placeholder, tidak didecode sebagai gambar.

| Kolom | Makna |
| --- | --- |
| nama_foto | Nama file untuk pencocokan, opsional |
| tanggal, jam | Tanggal kunjungan dan waktu foto |
| lokasi | Nama/konteks wilayah atau ID |
| koordinat, catatan | Koordinat khusus dan catatan foto, opsional |
| uraian / uraian_kegiatan, tujuan, nama_kegiatan | Narasi, tujuan khusus, kegiatan |
| nomor_st, tanggal_st, nama_pelaksana, jabatan | Nilai khusus per kunjungan |

Pemasangan foto berikutnya:

1. Reservasi kecocokan nama aktual atau nama yang diharapkan dari Excel, case-insensitive, dengan/tanpa ekstensi.
2. Foto tanpa kecocokan dipasang ke kunjungan aktif di preview. Fallback aktif dipakai maksimal sekali per batch agar tidak menimpa berulang.
3. Foto sisanya menjadi kunjungan baru. Bila belum ada kunjungan aktif sebelumnya, gunakan kunjungan pertama yang tersedia sebagai fallback.
4. Penggantian dari thumbnail/panel Foto selalu menargetkan ID yang ditangkap sebelum pemilih file dibuka.

Pertahankan ID, metadata, narasi, tujuan kustom dan switch photostamp saat foto diganti. Perbarui file, nama, dimensi, thumbnail, status foto; lepaskan resource lama.

Pemetaan baris spreadsheet ke kunjungan yang sudah ada perlu tetap dapat diperiksa. Target keamanan pemetaan: nama tidak cocok/ambigu tidak boleh diam-diam menimpa foto lain; pemetaan urutan harus eksplisit. Ini perlu dibuktikan terpisah dari uji impor ke daftar kosong.

## 6. Detail kunjungan dan perlakuan foto

- Tanggal, waktu dan hari dapat diketik atau dipilih dari ikon di dalam input. Susun sebaris bila muat; bungkus bila sempit. Popup kalender/jam mengikuti sisi kiri box terkait.
- Hari otomatis mengikuti perubahan tanggal, tetapi dapat dioverride manual. Nilai efektif digunakan konsisten di daftar, stempel, A4 dan Word. Dropdown Hari menutup saat memilih, klik/fokus keluar atau Escape.
- Switch **Tambah photostamp** hanya di Detail. On adalah default; off menggunakan foto asli tanpa overlay tambahan. Tidak ada pengaturan unggahan baru atau switch massal pada toolbar seleksi.
- Mode foto asli menyembunyikan jam/koordinat, tidak mewajibkannya, dan tidak melakukan sampling batas wilayah. Resize/JPEG untuk dokumen tetap diperbolehkan; stempel yang sudah ada tidak dihapus.
- Preview Foto juga merupakan kontrol untuk mengganti dokumentasi, dapat diakses lewat keyboard.
- Preset uraian menyediakan berbagai variasi narasi per skenario (petugas sesuai SOP, responden ramah, responden kurang ramah/sibuk, pembinaan petugas, kunjungan ulang) serta grup preset dengan variasi otomatis (`dengan variasi`) yang mengisi seluruh kunjungan terpilih secara bergiliran dengan konteks yang sama. Label baris menyebut preset hanya selama narasinya sesuai; perubahan bebas menjadi Uraian kustom. Pengisian preset untuk seleksi menyatakan cakupannya.

## 7. Lokasi dan tujuan perjalanan

Sumber hierarki `public/data/hierarchy.json`; batas `public/data/boundaries/{kdkec}.json` dimuat saat diperlukan. Data persiapan berasal dari `peta_sls_20260202.geojson`; file mentah tidak masuk bundle frontend. Koordinat WGS84 [longitude, latitude], format stempel latitude, longitude enam desimal.

- Kata kecamatan/desa/kelurahan/dusun/SLS/SubSLS menjadi petunjuk tingkat wilayah. Jangan membuang konteks sehingga Desa Kopang berubah menjadi pencarian SLS bernama Kopang.
- ID tepat diprioritaskan, lalu nama tepat pada tingkat/konteks yang diminta, awalan/token, kemudian saran typo yang perlu dipilih. Nama ambigu tidak diputuskan dari kandidat pertama.
- Dropdown menyediakan kecamatan, desa, SLS, SubSLS. SLS ditampilkan sekali dengan jumlah SubSLS; tersedia penelusuran dalam induk dan Lihat hasil lainnya.
- ID internal dipisahkan dari label manusia serta tujuan laporan. Saat lokasi baru diproses, metadata wilayah lama tidak boleh tetap dianggap valid.
- Tujuan otomatis berasal dari nama/hierarki **wilayah terpilih**, bukan ID maupun SLS kebetulan tempat titik acak jatuh. Tujuan kustom, termasuk kosong, dipertahankan sampai Gunakan tujuan dari lokasi dipilih. Kosong tetap gagal validasi.
- Koordinat acak diverifikasi point-in-polygon. Pilihan desa/kecamatan memiliki catatan bahwa koordinat diacak dalam cakupan desa/kelurahan atau kecamatan dan bukan GPS asli foto.
- Mode foto asli tetap dapat memilih lokasi untuk tujuan otomatis tanpa sampling koordinat. Tujuan juga dapat diketik langsung tanpa lokasi spasial.

## 8. Profil, dokumen, dan keluaran

Profil Nama, Jabatan, Asal Satker dan ST terakhir disimpan lokal; default satker BPS Kabupaten Lombok Tengah. Jangan mengisi identitas/kegiatan contoh seolah data pengguna. Default tanggal adalah tanggal lokal perangkat; jam default 09–15 dengan menit/detik acak. Default tidak menimpa nilai manual/impor.

Dokumen: A4 210 × 297mm, margin 10mm/567 twips seluruh sisi, Times New Roman 12pt. Laporan ringkas satu halaman; konten panjang mengalir ke halaman berikutnya tanpa pemotongan atau pengecilan font di bawah standar. Setiap laporan baru mulai pada halaman baru.

Struktur: judul LAPORAN PERJALANAN DINAS; perihal dan Praya/tanggal; tujuan surat kepada Kepala BPS Kabupaten Lombok Tengah; pembuka ST; rincian Nama, Jabatan, Asal Satker, Tujuan, Hari/Tanggal, Uraian, Dokumentasi; tanda tangan pelaksana.

ST opsional. Jika nomor tersedia, pembuka menyebut nomor dan tanggal bila tersedia. Jika nomor kosong, gunakan: “Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:”.

Gambar dokumen proporsional, lebar sekitar 9,5cm sesuai layout, maksimal 1200px dan JPEG sekitar 85%. Ini terpisah dari ekspor foto mandiri yang harus mempertahankan resolusi asli bila fitur itu digunakan.

Menu **Ekspor & cetak**:

- Word gabungan dan ZIP Word terpisah: gunakan seleksi bila ada; jika tidak, semua laporan. Nyatakan cakupan.
- Cetak laporan terpilih: hanya yang dicentang; tidak aktif tanpa seleksi. Siapkan dokumen terisolasi dari UI/zoom preview, A4 tanpa margin ganda, lalu buka dialog cetak browser. Bersihkan setelah selesai. Jangan memicu printer langsung.
- Validasi foto, identitas, kegiatan, tanggal, tujuan dan uraian. Mode stempel juga memerlukan waktu serta lokasi/koordinat valid. Jangan melewati laporan bermasalah tanpa penjelasan.

Preview A4 menggunakan tinggi konten terukur untuk pagination, jumlah halaman, persentase zoom, zoom masuk/keluar dan default fit-to-box seluruh halaman. Kesetaraan halaman browser dengan Word/WPS tidak boleh diasumsikan tanpa uji.

## 9. Notifikasi dan performa

Notifikasi bertipe eksplisit: hijau berhasil, kuning peringatan/berhasil dengan catatan, merah gagal/validasi. Hilang setelah 3 detik tanpa klik; klik memulai ulang timer, tombol tutup menutup langsung. Pesan identik yang muncul kembali mendapat timer baru. Progres proses dan status kelengkapan tetap mengikuti keadaan, bukan timer notifikasi.

Daftar menyimpan File dan thumbnail maksimal 150px. Hanya foto aktif didecode untuk preview; eksport/print menyiapkan foto sekuensial dan melepaskan bitmap/canvas tiap giliran. Payload terkompresi boleh ditahan untuk dokumen gabungan. Jangan menyimpan puluhan canvas resolusi penuh.

Target update metadata preview aktif <30ms setelah foto/data siap. Upload/decode/fetch/ekspor asinkron dengan progres. Ukur batch 10/50/100 foto termasuk >10MB; catat perangkat, waktu dan memori. Target bukan bukti hasil pengukuran.

## 10. Kriteria penerimaan

- Foto-first, spreadsheet-first, input gabungan, draf tanpa foto dan pemasangan foto kemudian bekerja tanpa duplikasi yang tidak dimaksud.
- Nama cocok diprioritaskan; fallback aktif, klik thumbnail vs baris, seleksi dan penghapusan mempertahankan metadata kunjungan lain.
- Pencarian bertingkat/berkonteks, tujuan otomatis/kustom/kosong dan catatan cakupan koordinat bekerja.
- Photostamp on/off konsisten pada Foto, A4, Word gabungan, ZIP dan cetak; foto asli tidak diwajibkan mempunyai jam/koordinat.
- Menu tidak menggeser layout; dropdown Hari menutup sesuai aturan; notifikasi berwarna benar dan hilang/reset dalam 3 detik.
- Preview pendek/panjang tidak kehilangan teks/foto/tanda tangan; print hanya pilihan dan tidak memuat UI.
- Layout 1440/768/390px, keyboard, fokus, status HP, empty/loading/error diperiksa pada build produksi.
- ZIP valid, DOCX terbuka di Word/WPS, pagination dan hasil print/driver, serta uji beban dicatat sebagai verifikasi terpisah. Dokumen ini tidak menyatakan semuanya sudah diuji.
