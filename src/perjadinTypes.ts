/**
 * Type definitions, presets, and storage helpers for Laporan Perjalanan Dinas (Perjadin)
 */

export interface PerjadinProfile {
  nama: string;
  jabatan: string;
  customJabatan?: string;
  asalSatker: string;
  nomorST?: string;
  tanggalST?: string;
  namaKegiatan?: string;
}

export interface PerjadinReportItem {
  id: string;
  nama: string;
  jabatan: string;
  asalSatker: string;
  namaKegiatan: string;
  nomorST?: string;
  tanggalST?: string;
  tujuan: string;
  dateStr: string;
  hariTanggal: string;
  tanggalSurat: string;
  uraian: string;
  photoBlob?: Blob | null;
  photoDataUrl?: string | null;
  photoWidth?: number;
  photoHeight?: number;
  photoTargetHeight?: number; // Target height in points/pixels with preserved aspect ratio
}

export const JABATAN_OPTIONS = [
  'Statistisi Ahli Pertama',
  'Statistisi Ahli Muda',
  'Statistisi Ahli Madya',
  'Pranata Komputer Ahli Pertama',
  'Pranata Komputer Ahli Muda',
  'Pranata Komputer Ahli Madya',
  'Staff',
  'Lainnya',
] as const;

export interface UraianPreset {
  id: string;
  label: string;
  category: 'pendataan' | 'pengawasan' | 'custom';
  text: string;
}

export const URAIAN_PRESETS: UraianPreset[] = [
  {
    id: 'pendataan-lengkap',
    label: 'Pendataan Berhasil & Lengkap',
    category: 'pendataan',
    text: 'Pendataan lapangan dilakukan terhadap responden di unit sampel yang telah ditentukan. Responden bersikap kooperatif dan menerima kedatangan petugas dengan baik. Seluruh rincian kuesioner berhasil terisi secara lengkap dan konsisten sesuai dengan standar operasional prosedur (SOP) yang berlaku. Secara umum pelaksanaan pendataan berjalan lancar.',
  },
  {
    id: 'pendataan-belum-lengkap',
    label: 'Pendataan Berhasil tapi Belum Lengkap',
    category: 'pendataan',
    text: 'Pendataan lapangan telah dilaksanakan pada unit sampel target. Namun, beberapa rincian informasi belum dapat dilengkapi secara menyeluruh dikarenakan responden/dokumen pendukung sedang tidak berada di tempat. Kuesioner telah dititipkan kepada penanggung jawab dan dijadwalkan konfirmasi lanjutan agar data terisi lengkap.',
  },
  {
    id: 'pengawasan-baik',
    label: 'Pengawasan - Petugas Baik & Sesuai SOP',
    category: 'pengawasan',
    text: 'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Berdasarkan hasil pengawasan, petugas telah menjalankan tugas pendataan dengan baik dan mengikuti tahapan kegiatan sesuai prosedur yang ditetapkan. Petugas juga mampu melakukan probing kepada responden untuk memperoleh informasi yang lengkap dan akurat, serta melaksanakan setiap tahapan pendataan sesuai dengan standar operasional prosedur (SOP). Secara umum, pelaksanaan kegiatan berjalan dengan baik.',
  },
  {
    id: 'pengawasan-susah-paham',
    label: 'Pengawasan - Petugas Kurang Paham SOP',
    category: 'pengawasan',
    text: 'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Ditemukan adanya keraguan dan pemahaman konsep definisi operasional yang belum sepenuhnya tepat pada beberapa rincian pertanyaan. Supervisor telah memberikan penjelasan ulang, pembinaan teknis, serta simulasi probing agar pelaksanaan pendataan selanjutnya sesuai dengan pedoman standar operasional prosedur (SOP).',
  },
  {
    id: 'pengawasan-kurang-teliti',
    label: 'Pengawasan - Petugas Kurang Teliti',
    category: 'pengawasan',
    text: 'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Ditemukan beberapa kekeliruan kecil dan inkonsistensi antar rincian pertanyaan kuesioner. Telah dilakukan evaluasi serta koreksi bersama di lapangan, dan ditekankan kepada petugas agar selalu melakukan pengecekan ulang (re-checking) kelengkapan data sebelum berpamitan dengan responden.',
  },
  {
    id: 'pengawasan-lambat',
    label: 'Pengawasan - Tempo Wawancara Lambat',
    category: 'pengawasan',
    text: 'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Petugas mampu berkomunikasi dan menggali informasi dari responden dengan cukup baik. Namun, tempo pelaksanaan wawancara masih relatif lambat sehingga perlu ditingkatkan efisiensinya secara bertahap pada kunjungan berikutnya agar proses pendataan lebih optimal tanpa mengurangi ketelitian kualitas data.',
  },
];

const LOCAL_STORAGE_KEY = 'geostamp_perjadin_profile_v1';

export function loadSavedPerjadinProfile(): PerjadinProfile {
  const fallback: PerjadinProfile = {
    nama: '',
    jabatan: 'Pranata Komputer Ahli Pertama',
    customJabatan: '',
    asalSatker: 'BPS Kabupaten Lombok Tengah',
    nomorST: '',
    tanggalST: '',
    namaKegiatan: '',
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      nama: typeof parsed.nama === 'string' ? parsed.nama : fallback.nama,
      jabatan: typeof parsed.jabatan === 'string' ? parsed.jabatan : fallback.jabatan,
      customJabatan: typeof parsed.customJabatan === 'string' ? parsed.customJabatan : '',
      asalSatker: typeof parsed.asalSatker === 'string' && parsed.asalSatker.trim() ? parsed.asalSatker : fallback.asalSatker,
      nomorST: typeof parsed.nomorST === 'string' ? parsed.nomorST : '',
      tanggalST: typeof parsed.tanggalST === 'string' ? parsed.tanggalST : '',
      namaKegiatan: typeof parsed.namaKegiatan === 'string' ? parsed.namaKegiatan : '',
    };
  } catch {
    return fallback;
  }
}

export function savePerjadinProfile(profile: Partial<PerjadinProfile>): void {
  try {
    const current = loadSavedPerjadinProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save perjadin profile to localStorage:', err);
  }
}

const INDONESIAN_MONTHS_FORMAL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDONESIAN_DAYS_FORMAL = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Formats date into formal Indonesian date for Perjadin report.
 * E.g. "2026-07-29" -> {
 *   hariTanggal: "Rabu, 29 Juli 2026",
 *   tanggalSurat: "Praya, 29 Juli 2026",
 *   tanggalOnly: "29 Juli 2026"
 * }
 */
export function formatFormalIndonesianDate(dateStr: string): {
  hariTanggal: string;
  tanggalSurat: string;
  tanggalOnly: string;
} {
  const trimmed = (dateStr || '').trim();

  let dObj: Date | null = null;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    dObj = new Date(y, m, d);
  } else {
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1;
      const y = parseInt(dmyMatch[3], 10);
      dObj = new Date(y, m, d);
    }
  }

  if (!dObj || isNaN(dObj.getTime())) {
    dObj = new Date();
  }

  const dayName = INDONESIAN_DAYS_FORMAL[dObj.getDay()] || 'Senin';
  const day = dObj.getDate();
  const monthName = INDONESIAN_MONTHS_FORMAL[dObj.getMonth()] || 'Januari';
  const year = dObj.getFullYear();

  const tanggalOnly = `${day} ${monthName} ${year}`;
  const hariTanggal = `${dayName}, ${tanggalOnly}`;
  const tanggalSurat = `Praya, ${tanggalOnly}`;

  return { hariTanggal, tanggalSurat, tanggalOnly };
}
