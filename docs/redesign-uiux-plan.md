# Rencana redesign GeoStamp SLS

Tanggal audit: 30 Oktober 2026. Cakupan: analisis dan perencanaan, belum implementasi.

## Dasar keputusan

- Pengguna paling sering membuat banyak laporan perjadin dalam satu sesi.
- Konfirmasi pengguna: **1 laporan = 1 kunjungan = 1 hari = 1 foto**.
- Perangkat utama laptop/PC; HP dipakai sesekali.
- Bahan awal biasanya **foto saja**, bukan spreadsheet. Unggah foto adalah pintu masuk utama; Excel fitur tambahan.
- Sasaran: foto masuk, metadata dilengkapi, hasil stempel dan laporan langsung terlihat, laporan siap diunduh tanpa berpindah alat.
- Pertanyaan utama layar: **Laporan mana yang sudah siap diunduh, dan mana yang masih perlu dilengkapi?**

## Inventaris produk

1. Foto lapangan asli adalah bahan kerja sekaligus bukti dokumentasi laporan.
2. Satu foto membentuk satu laporan; mengganti foto mempertahankan identitas laporan dan metadata yang telah diedit.
3. Setiap laporan memiliki tanggal kunjungan, jam foto, lokasi, koordinat, tujuan, dan uraian.
4. Hierarki Kecamatan → Desa → SLS → SubSLS menjadi sumber pencarian lokasi.
5. Profil pegawai dipakai berulang dan disimpan lokal.
6. Kegiatan dan surat tugas dapat sama untuk satu kelompok laporan, dengan pengecualian per laporan.
7. Preset uraian telah tersedia; pengguna tetap perlu memeriksa kesesuaiannya dengan kunjungan.
8. Hasil utama adalah Word A4 dengan foto berstempel, satu halaman per laporan.
9. Ekspor yang tersedia harus dipertahankan: Word gabungan, ZIP Word terpisah, dan foto berstempel.
10. Semua pekerjaan berjalan di browser; batas wilayah dimuat per kecamatan.

## Audit kondisi saat ini

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react, docx, JSZip, XLSX, Turf. Pertahankan stack dan utilitas yang masih tepat.

| Temuan | Bukti | Dampak | Prioritas |
| --- | --- | --- | --- |
| Alur dimulai dari foto/stamping, laporan berada di mode lain | `App.tsx` memisahkan single/bulk/perjadin; PerjadinWorkspace memiliki submode lagi | Pengguna harus memahami dua lapis mode untuk satu pekerjaan | P0 |
| Laporan massal tidak menerima unggah foto langsung | Keadaan kosong Perjadin Massal mengarahkan ke Geostamp Massal | Pekerjaan utama tidak bisa dimulai di tempat hasilnya dibuat | P0 |
| Impor Excel menolak ketika belum ada foto | `handleProcessSpreadsheetFile` memeriksa bulkItems.length | Fitur terlihat tersedia tetapi urutan penggunaannya tersembunyi | P1 |
| Pencocokan spreadsheet punya fallback urutan baris | `applyParsedRowsToBulkItems` mencari nama, lalu rows[i] | Metadata berpotensi terpasang ke foto yang tidak dimaksud; hasil pemetaan perlu ditinjau | P1 |
| Banyak aksi serupa berulang | Header, bawah preview, toolbar perjadin, daftar foto | Hierarki tindakan lemah dan ruang terpakai untuk tombol | P0 |
| Profil dan ST mendahului daftar pekerjaan | Panel kiri perjadin berisi identitas dan ST sebelum daftar foto | Antrean laporan utama jatuh ke bawah layar | P0 |
| Setiap foto menjadi kartu dengan editor uraian sendiri | Daftar massal di PerjadinWorkspace | Membandingkan banyak tanggal/lokasi memerlukan gulir panjang | P0 |
| Header tidak beradaptasi baik pada layar kecil | Screenshot 390px memperlihatkan navigasi terpotong; inspector mencatat overflow 6px pada 768px | Akses mode dan tindakan menjadi sulit | P0 |
| Form mendahului preview pada tablet/HP | Screenshot before tablet/mobile | Respons visual dari perubahan tidak terlihat dalam konteks yang sama | P1 |
| Ukuran teks dominan kecil | Inspector layar awal: 91% teks di bawah 13px | Membaca dan mengedit lama terasa berat | P0 |
| Beberapa tombol kurang kontras | Inspector: teks Unduh Foto 3,7:1 | Tindakan penting kurang terbaca | P1 |
| Preview dokumen belum sepenuhnya mengikuti kontrak output | SheetView memakai padding horizontal 12mm dan beberapa teks 11,5pt; preview memiliki Bagi 2 Halaman dan heuristik panjang karakter | Preview dan target satu halaman, margin 1cm, 12pt dapat berbeda | P1 |
| Antrean ekspor Word menyimpan canvas seluruh foto | Kedua handler bulk menambahkan sourceImage: canvas ke itemsToBuild sebelum generator dijalankan | Risiko memori pada puluhan foto besar; perlu perbaikan bersama redesign | P0 |

### Pemeriksaan yang dijalankan

- Aplikasi dijalankan lokal dan mode Perjadin Satuan/Massal ditelusuri lewat browser.
- Inspector app dijalankan untuk **layar awal stamping** pada 1440, 768, dan 390px; semua enam gambar fold/page dibuka.
- Hasil inspector: 3 kategori FAIL (tanpa h1, overflow tablet, teks dekat tepi tablet), 4 kategori WARN (kontras, dev server, teks kecil, selisih tinggi panel).
- Lint app: 1 FAIL penggunaan ungu, 57 WARN. Hasil lint bukan 57 masalah UX terkonfirmasi: koordinat/ID monospace dan padStart waktu dapat valid; perlu penilaian per konteks.
- Angka inspector tidak mewakili seluruh mode perjadin. Mode perjadin diperiksa visual dan melalui kode, belum diukur otomatis di semua lebar.
- Ini baseline review di dev server; tidak ada klaim gate produksi atau uji ekspor Word/WPS selesai.

### Kritik baseline

ROUND 1

Seen in one second: formulir stamping gelap dan preview foto contoh; daftar laporan belum tampak sebagai tujuan utama.

Idea (one sentence): foto berkoordinat menjadi dokumentasi laporan perjadin, tetapi hubungan itu terpisah ke beberapa mode.

Live thing: preview stempel dan A4 sudah reaktif; ini fondasi yang perlu dipertahankan.

Layout words by section: shell=toolbar / stamping=form-preview / perjadin=form-preview / bulk=stacked-editors.

Scores: design 5 · usability 4,5 · creativity 5 · content 7 → overall 5,0.

Caps applied: baseline inspector memiliki FAIL; tidak menerapkan aturan landing page tentang jumlah gambar atau animasi pada aplikasi.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. Mobile-fold.jpg: header terpotong dan form memenuhi layar. Ganti menjadi topbar ringkas serta daftar-detail bergantian.
2. Perjadin Massal di browser: profil dan ST mendominasi sebelum daftar pekerjaan. Ringkas menjadi satu bar konteks, pindahkan editor ke panel sesuai kebutuhan.
3. Desktop-fold.jpg dan mode perjadin: aksi berulang, teks kecil, banyak panel bersarang. Pusatkan satu aksi unduh, gunakan skala 12/14/16/24px dan satu permukaan kerja.

## Konsep dan arah visual

Skill: design-taste-frontend, cabang app screens.

Pilihan hasil draw: Achromatic ledger dan Framed sheet. Dipilih **Framed sheet**, seed **1616452078**, karena sesi penyusunan dokumen membutuhkan bidang putih yang stabil, antrean jelas, dan preview kertas yang terasa bagian dari pekerjaan.

Tidak ada redraw. `--keep palette,type` menjaga keluarga zinc/hijau dan Plus Jakarta Sans yang sudah ada; distribusi warnanya diubah menjadi terang. Token terang mengikuti constraint zinc/slate AGENTS.md. Blueprint builder berbentuk graph tidak digunakan karena objek aplikasi adalah laporan, bukan node; komposisi list/detail memakai aturan app screens.

**Ide:** Pada aplikasi ini, daftar kunjungan harian BPS Lombok Tengah menjadi meja kerja laporan; setiap foto memiliki pasangan tanggal, lokasi SLS, dan hasil A4 yang bisa diperiksa langsung.

Elemen khas: baris kunjungan dengan thumbnail foto dan status kelengkapan; memilih baris memperlihatkan pasangan Foto berstempel / Laporan A4 yang berasal dari data sama.

Usulan token:

| Peran | Nilai |
| --- | --- |
| Bingkai | Zinc #f4f4f5 |
| Area kerja | Putih #ffffff |
| Teks utama | #18181b |
| Teks sekunder | #52525b |
| Garis panel / kontrol | #e4e4e7 / #a1a1aa |
| Aksi utama | #18181b dengan teks putih |
| Aksen terbatas | Hijau #047857 |
| Kesalahan | #b91c1c dengan pesan tertulis |
| Tipografi UI | Plus Jakarta Sans, angka tabular untuk tanggal/jam |
| Ukuran | Judul 24px; bagian 16px; kontrol/isi 14px; metadata 12px |
| Geometri | Bingkai luar 16px; kontrol 6px; gap 16/24px; tanpa shadow permanen |

Times New Roman tetap khusus dokumen. Tidak menambah foto dekorasi, grafik KPI, animasi masuk, atau sidebar gelap. Gerak cukup untuk feedback kontrol dan buka/tutup panel.

## Arsitektur informasi

- **Laporan Perjadin**: ruang kerja utama untuk satu maupun banyak laporan. Jumlah baris menentukan skala pekerjaan; tidak perlu toggle Perjadin Satuan/Massal lagi.
- **Stempel Foto**: alat mandiri untuk pengguna yang hanya ingin JPG/ZIP foto. Tetap menyediakan mode Satuan dan Massal.
- **Profil**: panel pengaturan identitas yang disimpan lokal; ringkasannya selalu terlihat dari workspace.

Pengguna telah mengizinkan pembaruan aturan yang menghambat UX. AGENTS.md dan PRD.md kini menetapkan **Laporan Perjadin sebagai halaman awal**. Mode Satuan hanya menjadi default saat alat Stempel Foto mandiri pertama dibuka. Ini target implementasi; aplikasi belum diubah pada tahap perencanaan ini.

## Alur yang direkomendasikan

1. Buka Laporan Perjadin; saat kosong, area daftar menawarkan **Tambah foto** sebagai aksi utama.
2. Pilih banyak foto sekaligus. Satu foto langsung membentuk satu baris laporan; thumbnail kecil muncul bertahap tanpa menunggu semua foto selesai.
3. Profil tersimpan dipakai otomatis. Ringkasan Nama · Kegiatan · Surat tugas opsional tampil di atas daftar, dengan tombol Ubah.
4. Pengguna melengkapi tanggal, jam, lokasi, dan uraian langsung di tabel atau detail baris.
5. Pilih beberapa baris untuk mengisi kegiatan, lokasi, ST, atau preset uraian bersama. Tindakan diberi scope eksplisit, misalnya **Isi lokasi untuk 8 laporan**. Perubahan diterapkan langsung; tidak ada tombol untuk menghasilkan preview.
6. Pilih baris untuk melihat foto berstempel dan A4. Perubahan metadata langsung memperbarui keduanya.
7. Filter **Perlu dilengkapi** memusatkan koreksi. Klik status mengarah ke field yang kurang.
8. **Unduh laporan** membuka pilihan Word gabungan atau ZIP Word terpisah, dengan jumlah dan cakupan jelas. Mengunduh foto berstempel ada sebagai aksi sekunder.

Excel/CSV berada di menu impor tambahan. Tidak mengganggu alur utama berbasis foto. Jika nantinya didukung impor sebelum foto, buat draft laporan dan tampilkan status Foto belum ditambahkan; jangan membuang baris impor.

## Susunan desktop

```text
GeoStamp SLS       Laporan Perjadin | Stempel Foto             Profil

Laporan Perjadin                                  Unduh laporan ▾
Nama pegawai · Nama kegiatan · ST opsional             Ubah

Tambah foto   Cari kunjungan   Semua | Perlu dilengkapi
┌──────────────────────────────────┬────────────────────────────┐
│ Daftar laporan                   │ Kunjungan terpilih         │
│ Pilih Foto Tanggal Lokasi Status │ Detail | Foto | Laporan A4 │
│  □    ▣    …       …      …      │                            │
│  □    ▣    …       …      …      │ Editor atau preview        │
│  □    ▣    …       …      …      │ sesuai tab aktif           │
│                                  │ Sebelumnya / Berikutnya    │
└──────────────────────────────────┴────────────────────────────┘
```

Jumlah/status pada wireframe bukan data penggunaan nyata; semua angka pada implementasi dihitung dari baris.

- Dua panel, bukan tiga kolom sempit. Pada 1440px, ruang kerja kira-kira 60% daftar dan 40% inspector; tidak ada sidebar permanen yang menghabiskan lebar.
- Tabel utama menampilkan thumbnail, tanggal/jam, lokasi/tujuan, ringkasan uraian, dan status; nama file sebagai subline. Kode lengkap dan detail ST berada di inspector.
- Editor uraian panjang hanya untuk laporan aktif, bukan textarea di setiap kartu.
- Header tabel tetap terlihat saat daftar digulir. Area preview mempunyai scroll saat zoom, tetapi hindari banyak scroll vertikal bersarang.
- Mode **Perbesar preview** memberi bidang A4 lebih lebar; fit-to-width sebagai awal yang dapat dibaca, fit-page opsional. Preview bukan sekadar gambar kecil untuk formalitas.
- Saat tidak ada laporan, jangan tampilkan kertas berisi pegawai/kegiatan contoh seolah laporan siap.

## Tablet dan HP

- Tablet: dua panel hanya jika masing-masing masih layak; jika sempit, inspector menjadi layar detail.
- HP: daftar kunjungan menjadi baris dua tingkat: thumbnail, tanggal, tujuan, dan status. Pilih baris membuka detail dengan tombol kembali yang mempertahankan posisi gulir.
- Foto, detail, dan A4 dipisah tab di layar kunjungan; preview tidak dipaksa setelah formulir panjang.
- Tombol sentuh minimal 44px, teks kontrol 14px, margin 16px. Navigasi ringkas tanpa header desktop yang diperas.
- Bulk selection menampilkan toolbar kontekstual dengan jumlah terpilih; toolbar tidak menutupi baris terakhir.

## Model data dan interaksi

- Satu sumber data laporan: reportId, file reference, thumbnail, tanggal, waktu, region, koordinat, tujuan, uraian, dan override profil/kegiatan/ST.
- StampConfig dibagi menjadi gaya bersama dan metadata laporan. Tanggal/koordinat pada foto dan A4 membaca data laporan yang sama.
- Profil dan kegiatan bersama menggunakan inheritance yang jelas; field override diberi penanda dan aksi Kembali ke nilai bersama. Mengganti preset bersama tidak boleh diam-diam menghapus narasi khusus.
- Jangan menggabungkan dua foto hanya karena tanggalnya sama; satu foto tetap satu laporan. Tanggal kembar boleh ditandai sebagai informasi untuk ditinjau.
- Nilai tanggal/jam awal tetap mengikuti AGENTS.md. Tampilkan asal nilai default dan cara mengoreksinya; tanggal impor/manual tidak boleh ditimpa oleh default baru.
- Pencarian lokasi menerima nama maupun ID. Tampilkan hierarki hasil dan tandai hasil ambigu; jangan menyatakan Siap sebelum lokasi dan koordinat yang dibutuhkan telah terverifikasi.
- Koordinat acak harus diberi asal **Acak dalam wilayah**, dibedakan dari input manual; jangan menamakannya GPS asli foto.
- Readiness memakai pesan seperti Foto belum ada, Lokasi belum dipilih, Nama pegawai belum diisi. Validasi muncul di baris/field, bukan baru lewat alert saat unduh.
- Definisikan Siap sebagai data wajib lengkap dan valid; bukan jaminan dokumen sudah lolos Microsoft Word/WPS.
- Status dan total dihitung dari data yang sama, termasuk ketika filter atau seleksi berubah.
- Tombol unduh menyatakan cakupan: semua laporan siap atau laporan terpilih. Jika ada baris bermasalah, tampilkan daftar masalah dan opsi eksplisit; jangan melewati baris diam-diam.
- Profil disimpan localStorage; draft metadata dapat ditambah kemudian. Jangan mengklaim file foto tersimpan setelah reload tanpa mekanisme penyimpanan lokal yang benar.

## Rencana implementasi

### Tahap A — Data bersama dan komponen shell

- Pisahkan App.tsx yang besar menjadi shell, workspace laporan, dan alat stamping.
- Naikkan metadata laporan ke state bersama agar perpindahan layar tidak menghapus edit lokal.
- Bentuk komponen ReportTable, ReportInspector, BatchContext, ProfilePanel, dan ExportMenu.
- Gunakan utilitas spatial, stamping, parsing, dan docx yang sudah ada setelah memeriksa kontraknya. Tidak migrasi framework atau menambah backend.

### Tahap B — Alur utama foto ke banyak laporan

- Unggah foto langsung di workspace, satu foto satu baris.
- Tabel/edit inline, pencarian lokasi, bulk selection, override, status kelengkapan, dan preview reaktif.
- Jadikan Excel fitur sekunder; pemetaan nama file harus terlihat, fallback urutan harus dinyatakan dan ditinjau.

### Tahap C — Dokumen dan ekspor

- Samakan spesifikasi preview dengan exporter: A4, margin seluruh sisi 10mm/567 twips, Times New Roman 12pt, satu halaman per kunjungan.
- Hilangkan Bagi 2 Halaman dari alur standar. Tampilkan masalah overflow dan pilihan memperpendek narasi/menyesuaikan dokumentasi dalam batas keterbacaan; jangan menyembunyikan teks atau mengecilkan font dari standar.
- Jangan menganggap jumlah karakter cukup untuk membuktikan tepat satu halaman; verifikasi hasil Word/WPS dengan narasi panjang dan foto portrait/landscape.
- Antrean ekspor harus: decode satu file → stamp → resize JPEG untuk docx maksimal 1200px → lepaskan bitmap/canvas → simpan payload terkompresi → lanjut. Word gabungan tetap menyimpan payload yang diperlukan, tetapi bukan seluruh canvas resolusi asli.
- Ekspor JPG tetap memakai resolusi asli, terpisah dari preview dan foto dokumen yang dioptimalkan.
- Progress menyatakan fase, jumlah selesai, dan file yang gagal; hasil berhasil tidak hilang bila satu file gagal. Retry hanya file gagal bila format ekspor memungkinkan.

### Tahap D — Responsif, aksesibilitas, dan pembuktian

- Terapkan list-detail HP, keyboard navigation, label form, fokus terlihat, loading/error/empty states.
- Inspector app sebelum/sesudah pada 1440, 768, 390px untuk stamping dan workspace laporan dengan data kosong serta terisi.
- Gate terakhir pada production build; buka semua screenshot dan catat kritik dengan format yang sama.

## Kriteria penerimaan

1. Pengguna dapat memulai laporan massal dengan foto saja dari workspace laporan.
2. Tidak perlu berpindah ke alat stamping untuk memperbaiki tanggal, waktu, lokasi, atau mengganti foto dokumentasi.
3. Satu edit metadata memperbarui foto dan laporan yang sama secara reaktif tanpa Generate/Terapkan; target <30ms untuk mutasi metadata pada preview yang sudah siap, diukur terpisah dari decode/upload awal.
4. Banyak foto >10MB dapat ditambahkan tanpa mendecode semua foto penuh sekaligus. Daftar menyimpan File dan thumbnail maksimal 150px.
5. Tidak ada antrean berisi puluhan canvas resolusi penuh. Profiling ekspor memakai 10, 50, dan 100 foto dengan campuran portrait/landscape.
6. Koordinat WGS84, teks enam desimal, point-in-polygon, dan lazy boundaries tetap terjaga.
7. Data umum dapat diisi untuk seleksi tanpa menghapus override khusus secara diam-diam.
8. Foto/lokasi/tanggal/uraian bermasalah dapat ditemukan dan diperbaiki dari status baris.
9. ZIP valid dan semua entry bisa diekstrak; nama file kembar tidak saling menimpa.
10. Word gabungan dan Word terpisah terbuka di Microsoft Word dan WPS tanpa warning; satu halaman per laporan sesuai spesifikasi.
11. Header dan konten tidak terpotong pada 390 dan 768px; penggunaan keyboard dan fokus terverifikasi.
12. Parser tetap diuji dengan header bervariasi, baris kosong, format tanggal bervariasi, nama lokasi ambigu, dan foto tidak cocok.

## Keputusan yang belum perlu menghambat prototipe

- Jumlah laporan tipikal per sesi belum diketahui; gunakan 30 baris sebagai skenario desain, bukan statistik pengguna, dan 100 sebagai uji teknis.
- Format unduh yang paling sering dipakai belum diketahui; pertahankan Word gabungan dan ZIP terpisah dengan bobot setara di menu.
- Default halaman sudah diputuskan menjadi Laporan Perjadin melalui pembaruan AGENTS.md dan PRD.md yang diizinkan pengguna.
- Prototype berikutnya sebaiknya memakai contoh kunjungan yang jelas ditandai sebagai data desain, lalu diuji dengan bahan pengguna sebelum implementasi menyeluruh.
