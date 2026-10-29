# Product Requirements Document (PRD)
## Web Photo Stamping & SLS Geotagging Tool (Client-Side)

---

## 1. Executive Summary & Objective

Aplikasi web berbasis klien (*100% Client-Side Static Web App*) untuk memberikan overlay stempel foto (timestamp dan geotagging koordinat presisi) secara otomatis dan reaktif pada foto yang diunggah. Koordinat yang dihasilkan diacak secara valid (*point-in-polygon*) di dalam batas wilayah Satuan Lingkungan Setempat (SLS / SubSLS) berdasarkan data spasial resmi (`peta_sls_20260202.geojson`).

Mendukung mode operasi:
1. **Mode Satuan (Single Stamp):** Interaksi cepat untuk 1 foto dengan pratinjau instan (*live reactive*).
2. **Mode Massal (Bulk Stamp):** Pemrosesan banyak foto sekaligus (10–100+ foto) dengan variasi tanggal, jam, dan lokasi per foto secara efisien melalui **Quick Data Matrix (tabel inline)** maupun **Upload File Excel/CSV** serta pencocokan teks wilayah cerdas (*smart text/fuzzy resolver*).
3. **Pembuat Laporan Perjalanan Dinas (Perjadin Generator):** Konversi instan foto bertanda tangan spasial menjadi dokumen resmi Laporan Perjalanan Dinas format baku BPS (Microsoft Word `.docx` dan siap cetak A4/PDF) secara satuan maupun massal (*multi-page document*).

### Core Value Proposition
- **0 Rupiah (Gratis):** Dihosting di static provider (GitHub Pages / Cloudflare Pages / Vercel), tanpa backend server runtime.
- **Instan & Zero Latency:** Tidak ada tombol "Generate" atau "Submit" untuk pratinjau. Perubahan parameter langsung memicu re-render canvas secara seketika.
- **100% Privacy-Preserving:** Foto pengguna tidak pernah diunggah ke server; seluruh kompresi, rendering kanvas, dan pembentukan arsip ZIP berjalan lokal di browser.
- **Human-Centric & Lapangan-Ready:** Pengguna tidak dipaksa menghafal kode 16 digit ID SubSLS; sistem dapat mengenali teks nama dusun/desa/kecamatan secara cerdas.
- **Clean UI & Functional:** Desain modern, fungsional, responsif di HP/desktop, bebas *AI-slop*.

---

## 2. Source Data Specifications

Sumber data wilayah: [`peta_sls_20260202.geojson`](file:///e:/@ANDIKA/2026/1.%20Peta%20Digital/Peta/Batas%20SLS%202026/peta_sls_20260202.geojson)

| Atribut | Nilai / Spesifikasi |
| :--- | :--- |
| **Total Fitur** | 4.630 poligon SubSLS |
| **Cakupan Wilayah** | 12 Kecamatan, 169 Desa, 2.702 SLS, 4.630 SubSLS (Kab. Lombok Tengah, NTB) |
| **Sistem Koordinat (CRS)** | WGS84 (`EPSG:4326`) |
| **Format Geometri** | `MultiPolygon` (100% validitas topologi GEOS/Shapely) |
| **Kolom Utama** | `kdkec`, `nmkec`, `iddesa`, `nmdesa`, `idsls`, `nmsls`, `kdsubsls`, `idsubsls` |

---

## 3. Core Features & User Journey

### 3.1. Mode Satuan (Single Photo Mode)
1. **Upload / Seret Foto:** Pengguna mengklik atau menyeret foto langsung ke viewport Live Preview.
2. **Pengaturan Waktu Fleksibel:** Tanggal dan jam dapat diketik bebas maupun dipilih visual dari kalender / clock picker. Default jam antara 09:00 s.d. 15:59 dengan menit/detik acak natural.
3. **Pemilihan Wilayah & Geotagging:**
   - Dropdown berjenjang (Kecamatan → Desa → SLS → SubSLS) atau pencarian cepat autocomplete.
   - Sampling koordinat acak (*Point-in-Polygon*) presisi 6 desimal dengan tombol acak ulang titik (Shuffle 🔀).
   - Koordinat dapat diedit/diketik manual jika diperlukan.
4. **Stamping Kanvas Bersih:** Teks stempel langsung menampilkan `[idsubsls] • [NAMA SLS], [NAMA DESA], [NAMA KEC]` tanpa imbuhan kata "Desa" atau "Kecamatan".
5. **Unduh Instan:** Menghasilkan file JPEG resolusi penuh asli.

---

### 3.2. Mode Massal (Bulk Stamp Mode)

Fitur untuk memproses puluhan foto lapangan yang memiliki variasi hari, jam, dan lokasi berbeda-beda dengan alur kerja yang sangat cepat.

```mermaid
flowchart TD
    A[Upload Banyak Foto / Folder] --> B[Daftar Foto Muncul di Quick Data Matrix]
    B --> C{Pilih Cara Input Parameter}
    C -->|Cara 1: Upload Excel/CSV| D[Sistem Parse & Match Nama/Urutan File]
    C -->|Cara 2: Edit Cepat di Tabel| E[Ketik Tanggal & Nama Lokasi di Quick Table]
    D --> F[Smart Text / Fuzzy Location Resolver Cocokkan ke SLS Terdekat]
    E --> F
    F --> G[Verifikasi Status: Hijau/Kuning/Merah & Pratinjau Foto Aktif]
    G --> H[Klik 'Unduh Semua (.ZIP)']
    H --> I[Sequential Background Worker Render Kanvas & Masukkan ke ZIP]
```

#### A. Quick Data Matrix (Tabel Inline Cepat)
- Menampilkan daftar semua foto yang diunggah dalam tabel ringkas:
  - **No & Thumbnail Mini (60x60 px):** Ringan di memori RAM browser.
  - **Nama File Asli.**
  - **Tanggal:** Input tanggal yang bisa diketik bebas atau dipilih via mini datepicker.
  - **Jam:** Jam acak default (dapat diketik manual per baris).
  - **Input Lokasi (Smart Autocomplete & Free Text):** Pengguna dapat mengetik nama dusun/desa (misal `"Jurit"`, `"Bebuaq"`) atau kode ID SLS/SubSLS.
  - **Status & Feedback Visual:**
    - 🟢 *Hijau:* Cocok akurat ke SubSLS/SLS tertentu.
    - 🟡 *Kuning:* Cocok parsial (tingkat desa/kecamatan, koordinat diacak di dalam batas desa/kecamatan).
    - 🔴 *Merah:* Wilayah tidak ditemukan (pengguna dapat memilih dari daftar).
- Mengklik salah satu baris di tabel langsung menampilkan foto tersebut pada jendela Live Preview di sebelah kanan.

#### B. Dukungan Upload File Excel / CSV
- Pengguna dapat mengunduh **Template Spreadsheet (`template_bulk_stamp.xlsx` / `.csv`)**.
- Struktur kolom sederhana & fleksibel:
  - `nama_foto` *(opsional)*: Nama file foto (misal `IMG_001.jpg`).
  - `tanggal`: Tanggal survei (format `YYYY-MM-DD`, `DD/MM/YYYY`, atau teks `25 Okt 2026`).
  - `lokasi`: Teks bebas nama dusun/desa/kecamatan atau kode ID SLS/SubSLS.
  - `jam` *(opsional)*: Jam foto. Jika kosong, sistem otomatis membuat jam kerja acak natural (09:00 - 15:59).
  - `koordinat` *(opsional)*: Koordinat spesifik. Jika kosong, sistem otomatis melakukan random sampling *point-in-polygon* di dalam batas poligon wilayah terkait.
  - `catatan` *(opsional)*: Catatan tambahan per foto.
- **Pencocokan Otomatis:**
  - Jika ada kolom `nama_foto`, dicocokkan berdasarkan kesamaan nama file foto.
  - Jika tidak ada kolom `nama_foto`, dicocokkan berdasarkan **urutan file (baris 1 = foto 1, baris 2 = foto 2)**.

#### C. Smart Location Resolver (Fuzzy & Multi-token Matcher)
- Algoritma pencocokan teks lokal di browser:
  1. Membersihkan kata stopword lapangan (`dusun`, `rt`, `rw`, `desa`, `kelurahan`, `kecamatan`, `subsls`).
  2. Mencocokkan multi-token (contoh: `"Jurit Bebuaq"` langsung mengidentifikasi Dusun Jurit di Desa Bebuaq).
  3. Mengambil titik koordinat valid di dalam poligon hasil pencocokan.

#### D. Pipeline Unduh Massal (.ZIP) Anti-Freeze
- Menghindari kehabisan memori (*Out-of-Memory Crash*) pada puluhan foto berukuran besar:
  - Foto resolusi asli **hanya dimuat ke kanvas saat gilirannya dirender**.
  - Menggunakan loop sekuensial dengan generator/requestAnimationFrame:
    `Load File -> Render Offscreen Canvas -> Ekstrak Blob JPEG -> Tambah ke JSZip -> Hapus ImageBitmap -> Update Progress Bar -> Lanjut Foto Berikutnya`.
  - Mengemas semua hasil ke dalam file arsip: `STAMP_BULK_[YYYYMMDD_HHMMSS].zip`.

---

### 3.3. Pembuatan Laporan Perjalanan Dinas (Perjadin Generator)

Fitur untuk mengonversi foto hasil geotagging menjadi dokumen resmi Laporan Perjalanan Dinas sesuai format baku BPS (Kabupaten Lombok Tengah) secara langsung tanpa perlu menyalin manual ke Microsoft Word.

#### A. Format & Tata Letak Dokumen Baku
- **Dimensi Kertas:** A4 (*210 × 297 mm*).
- **Margin:** *Narrow* 1 cm (567 twips) pada seluruh sisi.
- **Tipografi:** Times New Roman 12 pt, spasi proporsional (target tepat 1 halaman per perjalanan/laporan).
- **Struktur Dokumen:**
  1. **Judul:** `LAPORAN PERJALANAN DINAS` (Center, Bold).
  2. **Header Sub-Tabel:**
     - Kiri: `Perihal : Laporan Perjalanan Dinas [Perihal/Kegiatan]`
     - Kanan: `Praya, [Tanggal Perjadin]` (Tanggal surat identik dengan tanggal pelaksanaan kegiatan/stamp).
  3. **Tujuan Surat:**
     ```text
     Kepada Yang Terhormat:
         Kepala BPS Kabupaten Lombok Tengah
     di
         Tempat
     ```
  4. **Kalimat Pembuka & Logika Surat Tugas (ST):**
     - Jika Nomor dan Tanggal ST diisi:
       `"Berdasarkan surat tugas nomor [No ST] tanggal [Tgl ST] bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:"`
     - Jika Nomor/Tanggal ST dikosongkan (opsional):
       `"Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan [Nama Kegiatan] sebagai berikut:"`
  5. **Tabel 7 Rincian Informasi:**
     - 1. Nama: `[Nama Pelaksana]` (wajib, tersimpan di `localStorage`).
     - 2. Jabatan: Pilihan dropdown {`Statistisi Ahli Pertama`, `Statistisi Ahli Muda`, `Statistisi Ahli Madya`, `Pranata Komputer Ahli Pertama`, `Pranata Komputer Ahli Muda`, `Pranata Komputer Ahli Madya`, `Staff`, `Lainnya (ketik bebas)`}.
     - 3. Asal Satker: `BPS Kabupaten Lombok Tengah` (tersimpan di `localStorage`).
     - 4. Tujuan perjalanan: Otomatis default dari wilayah/SLS terpilih pada photo stamp (misal `Desa Pandan Indah, Kecamatan Praya Barat Daya` atau `Dusun Jurit, Bebuaq, Kopang`), dapat diedit bebas oleh pengguna.
     - 5. Hari, Tanggal: Otomatis mengikuti tanggal pada photo stamp dalam bahasa Indonesia formal (contoh: `Rabu, 29 Juli 2026`).
     - 6. Uraian kegiatan perjalanan dinas: Dilengkapi preset narasi lapangan BPS siap pakai + editor teks bebas.
     - 7. Dokumentasi: Gambar foto hasil stamp resolusi teroptimasi (lebar ±9.5 cm).
  6. **Blok Tanda Tangan:** Sisi kanan bawah dengan format `Pelaksana perjalanan dinas` diikuti spasi tanda tangan dan `[Nama Pelaksana]`.

#### B. Pilihan Template Uraian Kegiatan BPS
1. **Pendataan Berhasil & Lengkap:** Responden kooperatif, kuesioner terisi lengkap sesuai SOP.
2. **Pendataan Berhasil tapi Data Belum Lengkap:** Memerlukan konfirmasi lanjutan atau dokumen pendukung.
3. **Pengawasan - Petugas Baik & Sesuai SOP:** Observasi PPL, probing berjalan baik, tahapan tertib SOP.
4. **Pengawasan - Pembinaan Konsep / Kurang Paham SOP:** Ditemukan keraguan konsep, diberikan penjelasan dan pembinaan langsung.
5. **Pengawasan - Koreksi Ketelitian / Inkonsistensi:** Ditemukan pertanyaan terlewat/inkonsisten, dilakukan perbaikan bersama.
6. **Pengawasan - Tempo Wawancara Lambat / Optimalisasi Waktu:** Probing baik namun tempo lambat, evaluasi percepatan alur wawancara.
7. **Kustom (Ketik Bebas):** Textarea bebas untuk narasi spesifik lainnya.

#### C. Integrasi Alur Kerja (Single & Bulk)
- **Mode Satuan:**
  - Tombol `[ 📄 Buat Laporan Perjadin ]` membuka drawer/modal dengan *Live WYSIWYG A4 Preview*.
  - Tombol aksi: `[ 📥 Unduh Dokumen Word (.docx) ]` dan `[ 🖨️ Cetak / Simpan PDF ]`.
- **Mode Massal (Bulk Matrix):**
  - Tombol `[ 📄 Ekspor Laporan Perjadin (.docx) ]` di header tabel bulk.
  - Opsi 1: **Gabung 1 Dokumen Word (.docx)** (multi-halaman berurutan dengan Page Break per laporan, persis contoh laporan perjalanan dinas BPS).
  - Opsi 2: **Dokumen Terpisah (.zip)** berisi file docx individual per foto.

---

## 4. Technical Architecture

### 4.1. Tech Stack
- **Framework:** React 19 + TypeScript + Vite.
- **Styling:** Tailwind CSS (Clean slate, high contrast, mobile-friendly).
- **Spatial Processing:** `@turf/boolean-point-in-polygon`, `@turf/bbox`, `@turf/helpers`.
- **Archive & File Parsing:**
  - `jszip` (Client-side zip archiving tanpa backend).
  - `xlsx` / CSV parser lokal ringan untuk membaca spreadsheet.
- **Document Generation:**
  - `docx` (Client-side Microsoft Word DOCX generator tanpa ketergantungan server).
- **Data Optimization:** `hierarchy.json` (~50 KB) + `boundaries/[kdkec].json` (Lazy loaded).

---

## 5. Non-Functional Requirements
1. **Zero Backend:** Seluruh logika pengolahan foto, parsing excel, zip packaging, dan pembuatan dokumen Word (.docx) wajib berjalan 100% di browser pengguna.
2. **Memory Safety:** Membuka 50+ foto berukuran 12MP tidak boleh menyebabkan tab browser crash (wajib menggunakan thumbnail ringan di tabel, melepaskan memori kanvas setelah dimasukkan ke zip/word, dan me-resize gambar dokumen ke lebar maks 1200 px).
3. **Respon Cepat:** Pencocokan teks wilayah massal harus selesai dalam waktu < 200ms untuk 50 baris data; pembuatan dokumen `.docx` instan (< 100ms per halaman).
4. **Format Fidelity:** Dokumen `.docx` hasil unduhan wajib membuka sempurna di Microsoft Word dan WPS Office tanpa peringatan berkas korup atau pergeseran margin.
