# AGENTS.md
## AI Agent Development & Execution Directives
### Project: SLS Photo Stamping & Geotagging Web Application

File ini adalah pedoman operasional wajib bagi AI coding agent dalam mengimplementasikan, memodifikasi, dan merawat codebase ini. Setiap aturan di bawah bersifat mutlak untuk mencegah halusinasi, degradasi performa, dan regresi logika.

---

## 1. Core Principles (Prinsip Utama)

1. **Client-Side Only (No Backend):**
   - DILARANG memperkenalkan dependensi backend (seperti Express, FastAPI, Django, Flask, Node.js server runtime).
   - Seluruh logika (stamping, komputasi spasial, parsing file Excel/CSV, pembentukan file ZIP, download) WAJIB berjalan 100% di browser pengguna.
2. **Zero-Latency & Reactive (No Submit/Generate Buttons):**
   - Pengguna tidak boleh dipaksa menekan tombol seperti "Generate", "Stamp", "Submit", atau "Terapkan" untuk melihat hasil pratinjau.
   - Setiap mutasi state (upload foto, ubah tanggal/jam, pilih/ketik wilayah, ganti foto aktif) WAJIB memicu re-render canvas secara otomatis dan langsung (< 30ms).
3. **Optimized Spatial Data Handling (Anti 23 MB Load):**
   - DILARANG memuat file `peta_sls_20260202.geojson` mentah (23 MB) langsung ke bundle frontend web!
   - Gunakan skrip data preparation (Python / GeoPandas) untuk memisahkan:
     - `public/data/hierarchy.json` (hanya id & nama wilayah, ringkas).
     - `public/data/boundaries/{kdkec}.json` (data poligon terpisah per kecamatan, lazy loaded).
4. **Clean, Non-AI-Slop UI:**
   - Gunakan layout modular yang rapi (densitas kontrol padat, utilitarian khas aplikasi GIS/lapangan).
   - Hindari ornamen visual generik yang berlebihan (gradient ungu-pink norak, glassmorphism blur berlebihan yang membuat lag di HP). Gunakan palet zinc/slate yang kontras dan bersih.

---

## 2. Geospatial Rules & Invariants

1. **CRS Standard:**
   - Semua koordinat titik dan batas poligon harus dijaga dalam **WGS84 (`EPSG:4326`)** [Longitude, Latitude].
2. **Point-In-Polygon Guarantee:**
   - Titik random tidak boleh sekadar diambil dari bounding box (karena poligon SLS seringkali berlekuk, cekung, atau memiliki pulau/donat).
   - Titik acak WAJIB diverifikasi menggunakan algoritma Point-In-Polygon (misal Turf.js `booleanPointInPolygon`).
   - Sediakan fallback deterministik ke centroid poligon jika pengacakan 100 iterasi gagal menemukan titik di dalam poligon yang sangat sempit.
3. **Coordinate Precision:**
   - Format penulisan koordinat di watermark: 6 desimal (contoh: `-8.672341, 116.321894`). Jangan gunakan lebih dari 6 desimal.
4. **Smart Location Matching Invariant (Fuzzy Text Resolver):**
   - Pada input massal (Bulk Matrix atau Excel/CSV), pengguna diperbolehkan mengisi teks nama wilayah (misal: `"Jurit"`, `"Jurit Bebuaq"`, `"Desa Bebuaq"`) selain kode angka ID SLS/SubSLS.
   - Sistem wajib melakukan normalisasi teks (menghilangkan kata umum seperti *dusun, rt, rw, desa, kelurahan, kecamatan*) dan mencocokkan token teks ke hierarki wilayah secara deterministik di sisi klien.

---

## 3. Image Stamping, Memory Safety, & Bulk Invariants

1. **Resolution Preservation:**
   - Foto hasil unduhan (baik mode satuan maupun mode massal) HARUS mempertahankan resolusi asli dari foto yang diunggah (jangan sampai foto 12MP di-*downscale* menjadi ukuran preview canvas).
   - Pisahkan antara **Offscreen Canvas** (resolusi penuh untuk ekspor) dan **Preview Canvas / Image Element** (tampilan antarmuka yang responsif).
2. **Bulk Memory Safety (Anti Out-Of-Memory Crash):**
   - DILARANG mendekode seluruh foto asli ke dalam memori RAM secara serentak saat pengguna mengunggah banyak foto (10–100 foto).
   - Pada tabel/daftar foto bulk, HANYA simpan referensi objek `File` dan buat thumbnail kecil beresolusi rendah (maks 150px).
   - Saat ekspor ZIP massal, proses rendering wajib dijalankan secara **sekuensial (antrean satu per satu)**: buka foto $\rightarrow$ render kanvas resolusi penuh $\rightarrow$ konversi blob $\rightarrow$ tambahkan ke ZIP $\rightarrow$ tutup/hapus bitmap dari memori $\rightarrow$ lanjutkan ke foto berikutnya.
3. **Dynamic Typography Scaling:**
   - Ukuran font, padding, dan tebal garis watermark harus proporsional terhadap dimensi gambar asli (`canvas.width` dan `canvas.height`).
   - Formula standar: `baseFontSize = Math.max(14, Math.round(canvas.width * 0.02))`.
4. **Readability & Clean Layout:**
   - Teks stempel WAJIB memiliki latar belakang kontras (scrim hitam semi-transparan `rgba(0, 0, 0, 0.68)`).
   - Teks wilayah ditampilkan ringkas tanpa imbuhan berulang (contoh: `[5202050008000501] • DUSUN JURIT, BEBUAQ, KOPANG`).

---

## 4. Laporan Perjalanan Dinas (Perjadin) Generator Invariants

1. **Client-Side Only Document Generation:**
   - DILARANG menggunakan backend server/API untuk generate Word/PDF.
   - Pembuatan dokumen `.docx` WAJIB berjalan 100% di browser klien (menggunakan library `docx` JavaScript/TypeScript).
2. **Standard Document Layout & Typography:**
   - Format kertas: **A4** (*210 mm x 297 mm*).
   - Margin: **1 cm (567 twips)** pada seluruh sisi (top, bottom, left, right).
   - Tipografi: **Times New Roman**, ukuran **12 pt** (24 half-points).
   - Target layout: Tepat 1 halaman per perjalanan/kegiatan.
3. **Surat Tugas (ST) Fallback Rule:**
   - Kolom Nomor Surat Tugas dan Tanggal Surat Tugas bersifat opsional.
   - Jika diisi: gunakan teks `"Berdasarkan surat tugas nomor [No ST] tanggal [Tgl ST] bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:"`.
   - Jika kosong: WAJIB otomatis memakai teks fallback: `"Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:"`.
4. **Embedded Image Optimization:**
   - Gambar foto hasil geostamp yang disematkan ke dalam file `.docx` harus di-resize ke resolusi proporsional (lebar ±9.5 cm / maks 1200 px, kualitas JPEG ~85%) untuk mencegah ukuran file Word membengkak secara berlebihan dan mencegah browser *out-of-memory*.
5. **Local Profile Persistence:**
   - Field profil pengguna (Nama, Jabatan, Asal Satker, No ST terakhir) WAJIB disimpan di `localStorage` peramban agar pengguna tidak perlu mengisi ulang identitas setiap kali menggunakan aplikasi.
6. **Bulk Perjadin Generation:**
   - Mendukung ekspor gabungan menjadi **1 Dokumen Word Bersama** (multi-halaman dengan page break per laporan) serta opsi unduh terpisah (ZIP docx).

---

## 5. Default State Requirements

Saat aplikasi pertama kali dibuka (initial state), agent harus memastikan default value berikut terpenuhi:
- **Tanggal:** Tanggal lokal perangkat hari ini (`new Date()`).
- **Waktu:** Jam antara `09` s.d. `15` dengan menit dan detik acak (contoh: `09:14:38`, bukan `09:00:00`).
- **Mode:** Mode Satuan sebagai default, dengan opsi beralih ke Mode Massal (Bulk Stamp).
- **Watermark Template:** Model "GPS Map Camera Clean" (Tanggal/Jam di atas, Koordinat di tengah, ID SubSLS & Nama Wilayah di bawah).
- **Perjadin Profile:** Diambil dari cache `localStorage` jika ada, dengan default Asal Satker `BPS Kabupaten Lombok Tengah`.

---

## 6. Coding Standards & Conventions

- **Bahasa:** TypeScript / Modern JavaScript (ES2022+).
- **Format State:** Reaktif murni (React hooks terisolasi).
- **Testing Gate:**
  - Pastikan upload foto berukuran besar (> 10 MB) dan banyak file (puluhan foto) tidak menyebabkan browser freeze.
  - Pastikan parser Excel/CSV tahan terhadap baris kosong, header berbeda, atau penulisan tanggal/nama lokasi yang bervariasi.
  - Pastikan unduhan mode bulk menghasilkan file `.zip` valid yang dapat diekstrak tanpa file korup.
  - Pastikan file `.docx` hasil unduhan dapat dibuka dengan sempurna di Microsoft Word dan WPS Office tanpa warning korup atau pergeseran margin.

---

## 7. Prohibited Actions (Hal-Hal yang Dilarang)

- JANGAN menambahkan server-side code atau backend process.
- JANGAN memuat raw `peta_sls_20260202.geojson` 23 MB langsung ke bundle browser.
- JANGAN menyimpan puluhan `ImageBitmap` foto resolusi asli sekaligus di memori state aplikasi.
- JANGAN menyertakan API Key berbayar.
- JANGAN menggunakan library konverter dokumen yang membutuhkan Node.js server runtime atau headless browser backend.
