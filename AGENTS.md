# AGENTS.md — Laper

Pedoman implementasi, modifikasi dan perawatan Laper — Laporan Perjadin. Diperbarui 31 Oktober 2026.

## 1. Acuan dan cara kerja

- Baca [PRD.md](PRD.md) untuk objektif/perilaku produk dan [DESIGN.md](DESIGN.md) untuk spesifikasi visual/interaksi. Instruksi pengguna terbaru mengalahkan dokumen ini.
- Perbarui ketiga acuan secara konsisten saat keputusan produk berubah; jangan menumpuk catatan revisi yang saling bertentangan. `docs/redesign-uiux-plan.md` bersifat historis.
- Pertahankan stack React 19, TypeScript/ES2022+, Vite dan Tailwind 4. Gunakan state React terisolasi, identitas kunjungan stabil, dan satu sumber metadata bagi semua keluaran.
- Kerjakan perubahan dalam lingkup permintaan. Jangan mengembalikan UI lama hanya karena kodenya masih ada. Jangan mengklaim pengujian yang belum dijalankan.

## 2. Arsitektur wajib

- Semua parsing, pencarian, stamping, Word/ZIP dan persiapan print berjalan di browser. Dilarang menambahkan backend Express/FastAPI/Django/Flask atau layanan generate dokumen/headless browser server.
- Node/Vite untuk build dan pengembangan lokal diperbolehkan; bukan backend aplikasi yang dikirim ke pengguna.
- Jangan mengirim foto/spreadsheet ke server atau menambahkan API key berbayar.
- Jangan memuat raw `peta_sls_20260202.geojson` (~23MB) ke bundle/frontend. Data preparation boleh memakai Python/GeoPandas; keluarkan hierarki ringkas serta batas per kecamatan yang lazy-loaded.

## 3. Kontrak produk yang harus dijaga

- Satu laporan = satu kunjungan = satu hari = satu foto; satu laporan dapat berlanjut ke beberapa halaman A4. Draf boleh belum punya foto.
- Halaman awal workspace Laporan Perjadin. Nama tab Laper — Laporan Perjadin, favicon hitam-putih. Tidak ada navbar/header merek atau mode Geostamp Satuan/Massal.
- Toolbar hanya Tambah foto, Impor & template, Ekspor & cetak. Jangan kembalikan pencarian kunjungan, checkbox Perlu dilengkapi, dropdown perlakuan unggahan, atau switch photostamp massal.
- Hanya thumbnail dokumentasi membuka pemilih foto baris itu. Klik bagian baris lainnya membuka detail; checkbox khusus seleksi. Target penggantian dicatat sebelum pemilih terbuka.
- Pencocokan foto: reservasi nama aktual/harapan Excel dahulu; fallback ke kunjungan aktif maksimal sekali per batch; sisanya baris baru. Jangan menimpa berulang atau menghapus metadata saat ganti foto. Bersihkan resource lama.
- Penghapusan satu pada header detail rata kanan; hapus seleksi pada toolbar seleksi. Tidak ada Hapus di kolom Kelengkapan.
- Semua preview reaktif tanpa Generate/Terapkan. Aksi unggah, seleksi massal, ekspor dan cetak tetap eksplisit.

## 4. Impor dan integritas state

- Terima gambar atau Excel/CSV sebelum maupun sesudah foto, lewat pemilih dan drop area daftar. Input gabungan: maksimal satu spreadsheet, proses metadata dahulu lalu foto.
- Parser toleran baris kosong, variasi header/tanggal/nama lokasi. Draf tanpa foto menyimpan penanda eksplisit; jangan decode File placeholder atau menganggapnya dokumentasi valid.
- Draf dapat diedit/preview, tetapi ekspor dan cetak memerlukan foto. Pemasangan foto mempertahankan ID, hari/tanggal/jam, lokasi, tujuan, uraian, profil/ST dan switch.
- Pemetaan metadata spreadsheet ke baris yang sudah ada perlu dapat diperiksa. Jangan diam-diam memakai urutan saat nama tidak cocok/ambigu; pemetaan urutan harus eksplisit. Jangan mengklaim alur ini sudah aman hanya karena impor awal berhasil.
- Hasil async tidak boleh menimpa pilihan lokasi atau edit yang lebih baru. Nonaktifkan hasil spasial lama selama resolusi lokasi baru berlangsung.
- Profil dan ST terakhir disimpan localStorage. Jangan mengklaim file foto/draf akan bertahan setelah reload tanpa penyimpanan yang benar. Tanggal default lokal hari ini, waktu 09–15 dengan menit/detik acak; jangan menimpa nilai manual/impor.

## 5. Lokasi dan koordinat

- CRS WGS84 EPSG:4326, geometri [longitude, latitude]; stempel menulis latitude, longitude tepat enam desimal.
- Parse tingkat wilayah dari kecamatan/desa/kelurahan/dusun/SLS/SubSLS, pertahankan konteks. Jangan membuang kata tingkat sehingga makna query berubah.
- ID tepat, nama tepat/konteks, awalan/token, lalu saran typo. Ambiguitas perlu pilihan, bukan kandidat pertama. SLS ditampilkan sekali, SubSLS dapat ditelusuri; daftar hasil memiliki jumlah dan perluasan.
- Pisahkan ID internal, label manusia dan tujuan. Tujuan otomatis berasal dari wilayah terpilih, bukan anak wilayah kebetulan hasil sampling. Tujuan kustom termasuk kosong tetap dipertahankan; kosong gagal validasi. Sediakan reset ke otomatis.
- Verifikasi setiap titik acak dengan point-in-polygon, bukan bbox saja. Setelah maksimal 100 percobaan, gunakan fallback deterministik yang diverifikasi berada dalam poligon; centroid yang jatuh di luar/di lubang bukan fallback valid.
- Desa/kecamatan menampilkan catatan cakupan koordinat acak; jangan mengklaim GPS asli foto.

## 6. Photostamp dan memori

- Switch **Tambah photostamp** hanya di Detail, on secara default; gunakan role switch, aria-checked, keyboard dan fokus terlihat.
- Off memakai isi foto asli pada preview/A4/Word/ZIP/cetak, tanpa overlay baru. Jam/koordinat disembunyikan dan tidak wajib; pencarian lokasi untuk tujuan tidak melakukan sampling atau memuat boundaries.
- Resize/JPEG untuk dokumen diperbolehkan, jangan menghapus stempel bawaan foto. Ganti mode tidak menghapus metadata laporan lain.
- Daftar hanya File dan thumbnail maksimal 150px. Decode preview hanya foto aktif; tutup bitmap saat berganti/unmount. Jangan decode semua foto besar sekaligus.
- Ekspor/print: decode satu → render/optimasi → blob/payload terkompresi → tutup bitmap dan kosongkan canvas → berikutnya. Jangan menampung puluhan bitmap/canvas penuh. Bersihkan object URL saat ganti/hapus dan setelah download tidak lagi dipakai.
- Ekspor foto mandiri bila digunakan harus mempertahankan resolusi asli, terpisah dari preview dan foto dokumen.
- Typography stempel proporsional: `Math.max(14, Math.round(canvas.width * 0.02))`. Scrim default rgba(0,0,0,0.68), GPS Map Camera Clean: tanggal/jam, koordinat, lalu ID/wilayah ringkas.

## 7. Dokumen, preview dan print

- Gunakan docx client-side. A4 210 × 297mm, margin seluruh sisi 10mm/567 twips, Times New Roman 12pt/24 half-points.
- Konten panjang berlanjut secara natural. Jangan memotong teks, memaksa satu halaman, memakai heuristik jumlah karakter saja, atau mengecilkan font untuk menyembunyikan overflow.
- Gambar proporsional, sekitar 9,5cm sesuai layout, maksimal 1200px, JPEG ~85%. Foto asli mengikuti optimasi yang sama tanpa stempel tambahan.
- Nomor/tanggal ST opsional. Jika nomor ada, sebut nomor dan tanggal bila ada; jika kosong gunakan pembuka “Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:”.
- Word gabungan/ZIP memakai seleksi bila ada, semua bila tidak; jelaskan cakupan. Setiap laporan mulai halaman baru, nama file tidak saling menimpa.
- Cetak hanya seleksi; nonaktif tanpa seleksi. Siapkan dokumen terisolasi, margin 10mm tanpa margin ganda, tanpa UI aplikasi/zoom; tunggu foto/font/layout siap, buka dialog browser dan bersihkan sesudahnya. Jangan langsung mencetak fisik.
- Validasi foto, identitas, kegiatan, tanggal, tujuan, uraian; mode stempel juga waktu serta hasil lokasi/koordinat. Jangan melewati laporan gagal diam-diam.
- Preview fit-to-box seluruh halaman secara default, zoom +/−, persentase dan jumlah halaman. Bedakan bukti pagination browser dari Word/WPS/driver printer.

## 8. Interaksi, aksesibilitas dan notifikasi

- Ikuti rincian [DESIGN.md](DESIGN.md), termasuk layout responsif, menu mengambang, penanda HP, input waktu/hari dan autocomplete.
- Hari mengikuti tanggal dan bisa dioverride; nilai efektif konsisten di seluruh keluaran. Kalender/jam di-anchor ke box input. Hari menutup pada pilihan, klik/fokus keluar dan Escape.
- Status kosong/loading/error tidak menghilangkan struktur pekerjaan. Progres berjalan tidak boleh hilang oleh timer notifikasi.
- Notifikasi bertipe eksplisit: success hijau, warning kuning, error/validasi merah; role alert untuk error. Auto-dismiss 3000ms, klik reset timer, tutup langsung, pesan baru/identik timer baru. Bersihkan timer pada perubahan/unmount; jangan klasifikasi lewat regex pesan.
- Status kelengkapan per baris bukan notifikasi; tetap ada termasuk di HP. Gunakan label, bukan warna saja.

## 9. Gate verifikasi

- Jalankan `npm run build` dan `git diff --check` untuk perubahan implementasi yang relevan. Dokumentasi saja cukup diperiksa konsistensi/diff/link; jangan mengklaim runtime sudah diuji.
- Periksa produksi pada 1440/768/390px, keyboard/fokus, menu tanpa pergeseran, Hari dismiss, thumbnail vs baris vs checkbox, hapus dan ganti foto tanpa kehilangan metadata.
- Uji foto-first, spreadsheet-first, input gabungan, nama cocok/fallback aktif/batch, draf belum foto, parser bervariasi, lokasi ambigu/berkonteks, tujuan otomatis/kustom/kosong.
- Uji switch on/off pada Foto/A4/Word/ZIP/cetak, validasi, notifikasi timer/reset, pagination pendek/panjang dan pilihan cetak.
- Uji 10/50/100 foto termasuk >10MB untuk memori/respons. Target update preview aktif <30ms setelah data siap; ukur terpisah dari decode/fetch/ekspor.
- Verifikasi ZIP dapat diekstrak, DOCX tidak korup dan terbuka di Word/WPS. Struktur XML/ZIP valid bukan bukti pagination Word/WPS benar. Catat keterbatasan dan pengujian yang belum dilakukan.
