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

export interface UraianVariationGroup {
  id: string;
  label: string;
  category: 'pengawasan' | 'pendataan';
  variations: string[];
}

export const URAIAN_VARIATION_GROUPS: UraianVariationGroup[] = [
  {
    id: 'pengawasan-sop-variasi',
    label: 'Pengawasan - Petugas Sesuai SOP (dengan variasi)',
    category: 'pengawasan',
    variations: [
      'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Berdasarkan hasil pengawasan, petugas telah menjalankan tugas pendataan dengan baik dan mengikuti tahapan kegiatan sesuai prosedur yang ditetapkan. Petugas juga mampu melakukan probing kepada responden untuk memperoleh informasi yang lengkap dan akurat, serta melaksanakan setiap tahapan pendataan sesuai dengan standar operasional prosedur (SOP). Secara umum, pelaksanaan kegiatan berjalan dengan baik.',
      'Pengawasan lapangan dilaksanakan terhadap Petugas Pendataan Lapangan (PPL). Petugas terpantau menguasai konsep dan definisi operasional kuesioner dengan matang, bersikap ramah serta sopan kepada responden, dan cermat dalam pengisian instrumen data. Prosedur wawancara dijalankan secara berurutan sesuai SOP tanpa ada tahapan yang terlewat, sehingga validitas data hasil pendataan terjaga dengan baik.',
      'Melakukan supervisi dan pengawalan kualitas terhadap Petugas Pendataan Lapangan (PPL). Petugas menunjukkan kedisiplinan kerja yang tinggi serta teknik komunikasi yang efektif dan komunikatif saat mewawancarai responden. Konsep operasional dipahami secara tepat dan seluruh blok pertanyaan berhasil dilengkapi sesuai tata tertib serta standar operasional prosedur (SOP) yang berlaku.',
      'Supervisi lapangan dilakukan untuk mendampingi Petugas Pendataan Lapangan (PPL). Petugas bekerja secara sistematis, teliti dalam menggali keterangan responden, serta melakukan pemeriksaan ulang kelengkapan isian sebelum berpamitan. Kinerja petugas di lapangan secara konsisten telah memenuhi standar operasional prosedur (SOP) dan target kualitas yang ditetapkan.',
    ],
  },
  {
    id: 'pengawasan-ramah-variasi',
    label: 'Pengawasan - Responden Ramah & Kooperatif (dengan variasi)',
    category: 'pengawasan',
    variations: [
      'Pengawasan mendampingi Petugas Pendataan Lapangan (PPL) pada unit sampel sasaran. Responden menyambut kedatangan petugas dengan sangat ramah dan terbuka, serta meluangkan waktu secara penuh untuk memberikan keterangan. Petugas memanfaatkan suasana yang kondusif ini untuk menggali data secara mendalam sesuai SOP, sehingga seluruh butir pertanyaan terisi lengkap.',
      'Supervisi lapangan dilaksanakan saat petugas mewawancarai responden yang sangat kooperatif dan responsif. Responden bersedia menunjukkan berkas dan dokumen pendukung yang diperlukan secara sukarela. Wawancara berjalan lancar, tertib, dan memudahkan petugas memverifikasi konsistensi isian kuesioner secara akurat.',
      'Mendampingi wawancara lapangan bersama PPL. Sikap responden yang ramah dan bersahabat sangat mendukung efisiensi waktu pelaksanaan wawancara. Petugas melakukan probing dengan lancar tanpa hambatan, dan setiap rincian informasi berhasil dicatat dengan baik sesuai pedoman.',
      'Pengawasan wawancara tatap muka antara petugas dan responden di lokasi tugas. Responden menunjukkan antusiasme tinggi dan memahami urgensi pendataan yang dilaksanakan. Dialog berlangsung interaktif dan seluruh butir instrumen selesai diverifikasi dengan lengkap dan konsisten.',
    ],
  },
  {
    id: 'pengawasan-kurang-ramah-variasi',
    label: 'Pengawasan - Responden Kurang Ramah / Sibuk (dengan variasi)',
    category: 'pengawasan',
    variations: [
      'Pengawasan mendampingi petugas menghadapi responden yang awalnya bersikap kurang ramah dan enggan diwawancarai karena kesibukan pekerjaan. Petugas bersama supervisor melakukan pendekatan persuasif secara santun, menjelaskan tujuan kegiatan serta jaminan kerahasiaan data, hingga responden akhirnya bersedia menerima petugas dan memberikan informasi secara lengkap.',
      'Supervisi lapangan dilaksanakan pada responden yang sempat ragu dan menolak menerima kedatangan petugas. Bersama tim pengawas, petugas menunjukkan surat tugas resmi serta berkoordinasi dengan pengurus lingkungan setempat (RT/Kadus). Melalui koordinasi yang baik, responden akhirnya melunak dan bersedia menyelesaikan wawancara.',
      'Pengawasan dilakukan pada unit sampel dengan responden yang memiliki kesibukan tinggi dan waktu luang sangat terbatas. Pengawas membimbing petugas menerapkan strategi wawancara terfokus dan efisien tanpa mengurangi ketelitian, sehingga seluruh data inti berhasil dihimpun dengan baik di sela kesibukan responden.',
      'Pendampingan pengawasan pada kunjungan dengan dinamika responden yang sempat tertutup terhadap pertanyaan data tertentu. Petugas diarahkan melakukan probing secara bertahap dan menumbuhkan rasa percaya responden, sehingga keraguan dapat diatasi dan seluruh rincian kuesioner berhasil dilengkapi sesuai SOP.',
    ],
  },
  {
    id: 'pengawasan-pembinaan-variasi',
    label: 'Pengawasan - Pembinaan Petugas Lapangan (dengan variasi)',
    category: 'pengawasan',
    variations: [
      'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Ditemukan adanya keraguan dan pemahaman konsep definisi operasional yang belum sepenuhnya tepat pada beberapa rincian pertanyaan. Supervisor telah memberikan penjelasan ulang, pembinaan teknis, serta simulasi probing agar pelaksanaan pendataan selanjutnya sesuai dengan pedoman standar operasional prosedur (SOP).',
      'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Ditemukan beberapa kekeliruan kecil dan inkonsistensi antar rincian pertanyaan kuesioner. Telah dilakukan evaluasi serta koreksi bersama di lapangan, dan ditekankan kepada petugas agar selalu melakukan pengecekan ulang (re-checking) kelengkapan data sebelum berpamitan dengan responden.',
      'Pengawasan dilakukan terhadap Petugas Pendataan Lapangan (PPL). Petugas mampu berkomunikasi dan menggali informasi dari responden dengan cukup baik. Namun, tempo pelaksanaan wawancara masih relatif lambat sehingga perlu ditingkatkan efisiensinya secara bertahap pada kunjungan berikutnya agar proses pendataan lebih optimal tanpa mengurangi ketelitian kualitas data.',
      'Supervisi lapangan mencatat adanya ketergesa-gesaan petugas saat pengisian kuesioner sehingga melewatkan beberapa catatan lapangan penting. Pengawas memberikan arahan langsung mengenai pentingnya kerapian dan ketelitian data, serta mendampingi penyelesaian revisi isian bersama petugas.',
    ],
  },
  {
    id: 'pendataan-lengkap-variasi',
    label: 'Pendataan - Responden Ramah & Lengkap (dengan variasi)',
    category: 'pendataan',
    variations: [
      'Pendataan lapangan dilakukan terhadap responden di unit sampel yang telah ditentukan. Responden bersikap kooperatif dan menerima kedatangan petugas dengan baik. Seluruh rincian kuesioner berhasil terisi secara lengkap dan konsisten sesuai dengan standar operasional prosedur (SOP) yang berlaku. Secara umum pelaksanaan pendataan berjalan lancar.',
      'Melaksanakan kunjungan dan wawancara tatap muka dengan responden di lokasi sasaran. Responden menyambut hangat kedatangan petugas dan menyediakan waktu luang untuk menjawab setiap pertanyaan. Informasi yang diberikan lengkap, konsisten, dan didukung bukti identitas/dokumen yang valid sesuai SOP.',
      'Pendataan sampel lapangan berjalan tertib dan efektif. Responden sangat ramah dan kooperatif dalam memberikan data yang dibutuhkan tanpa rasa ragu. Seluruh blok isian kuesioner berhasil dilengkapi secara akurat sesuai tata cara dan pedoman teknis yang berlaku.',
      'Kunjungan pendataan langsung ke tempat tinggal responden terlaksana dengan baik. Responden bersikap terbuka dan komunikatif selama jalannya wawancara. Pemeriksaan kelengkapan isian dilakukan langsung di tempat dan seluruh data berhasil tercatat secara tuntas.',
    ],
  },
  {
    id: 'pendataan-kurang-ramah-variasi',
    label: 'Pendataan - Responden Kurang Ramah / Sibuk (dengan variasi)',
    category: 'pendataan',
    variations: [
      'Pendataan lapangan menghadapi kendala responden yang awalnya kurang kooperatif dan enggan diwawancarai karena rasa khawatir mengenai kerahasiaan data. Petugas menjelaskan maksud dan tujuan pendataan secara santun dengan menunjukkan surat tugas resmi, sehingga responden akhirnya berkenan diwawancarai dan memberikan data yang diperlukan.',
      'Melakukan kunjungan lapangan pada responden yang memiliki jadwal kerja sangat padat. Petugas menyesuaikan waktu wawancara secara fleksibel dan menyampaikan pertanyaan secara ringkas serta lugas, sehingga data utama berhasil dihimpun secara lengkap di sela kesibukan responden.',
      'Responden sempat menolak kehadiran petugas pada awal kunjungan karena sedang menghadapi urusan pribadi yang mendesak. Setelah petugas menunggu dengan sabar dan menyampaikan permohonan waktu secara sopan, responden bersedia meluangkan waktu dan wawancara dapat dituntaskan.',
      'Pendataan dilakukan terhadap responden yang sempat enggan memberikan informasi pada rincian tertentu. Petugas melakukan pendekatan persuasif secara kekeluargaan dan menegaskan kerahasiaan informasi sesuai ketentuan perundang-undangan, sehingga seluruh rincian kuesioner berhasil dilengkapi.',
    ],
  },
  {
    id: 'pendataan-belum-lengkap-variasi',
    label: 'Pendataan - Belum Lengkap / Janji Temu Ulang (dengan variasi)',
    category: 'pendataan',
    variations: [
      'Pendataan lapangan telah dilaksanakan pada unit sampel target. Namun, beberapa rincian informasi belum dapat dilengkapi secara menyeluruh dikarenakan responden/dokumen pendukung sedang tidak berada di tempat. Kuesioner telah dititipkan kepada penanggung jawab dan dijadwalkan konfirmasi lanjutan agar data terisi lengkap.',
      'Petugas mendatangi lokasi sampel yang ditentukan, namun responden utama sedang bekerja di luar daerah dan anggota keluarga yang ada belum dapat memberikan informasi yang pasti. Telah disepakati jadwal kunjungan ulang saat responden utama kembali ke rumah.',
      'Wawancara telah dimulai namun terpaksa dihentikan sementara karena responden harus menghadiri keperluan mendadak. Isian yang belum lengkap telah ditandai dan dijadwalkan wawancara lanjutan untuk merampungkan kuesioner.',
    ],
  },
];

export const URAIAN_PRESETS: UraianPreset[] = [
  // 1. Pengawasan - Sesuai SOP
  {
    id: 'pengawasan-baik',
    label: 'Pengawasan - Petugas Sesuai SOP (Variasi 1)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[0].variations[0],
  },
  {
    id: 'pengawasan-sop-2',
    label: 'Pengawasan - Petugas Sesuai SOP (Variasi 2)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[0].variations[1],
  },
  {
    id: 'pengawasan-sop-3',
    label: 'Pengawasan - Petugas Sesuai SOP (Variasi 3)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[0].variations[2],
  },
  {
    id: 'pengawasan-sop-4',
    label: 'Pengawasan - Petugas Sesuai SOP (Variasi 4)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[0].variations[3],
  },

  // 2. Pengawasan - Responden Ramah & Kooperatif
  {
    id: 'pengawasan-ramah-1',
    label: 'Pengawasan - Responden Ramah (Variasi 1)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[1].variations[0],
  },
  {
    id: 'pengawasan-ramah-2',
    label: 'Pengawasan - Responden Ramah (Variasi 2)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[1].variations[1],
  },
  {
    id: 'pengawasan-ramah-3',
    label: 'Pengawasan - Responden Ramah (Variasi 3)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[1].variations[2],
  },
  {
    id: 'pengawasan-ramah-4',
    label: 'Pengawasan - Responden Ramah (Variasi 4)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[1].variations[3],
  },

  // 3. Pengawasan - Responden Kurang Ramah / Sibuk
  {
    id: 'pengawasan-kurang-ramah-1',
    label: 'Pengawasan - Responden Kurang Ramah / Sibuk (Variasi 1)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[2].variations[0],
  },
  {
    id: 'pengawasan-kurang-ramah-2',
    label: 'Pengawasan - Responden Kurang Ramah / Sibuk (Variasi 2)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[2].variations[1],
  },
  {
    id: 'pengawasan-kurang-ramah-3',
    label: 'Pengawasan - Responden Kurang Ramah / Sibuk (Variasi 3)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[2].variations[2],
  },
  {
    id: 'pengawasan-kurang-ramah-4',
    label: 'Pengawasan - Responden Kurang Ramah / Sibuk (Variasi 4)',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[2].variations[3],
  },

  // 4. Pengawasan - Pembinaan Petugas
  {
    id: 'pengawasan-susah-paham',
    label: 'Pengawasan - Pembinaan Konsep SOP',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[3].variations[0],
  },
  {
    id: 'pengawasan-kurang-teliti',
    label: 'Pengawasan - Pembinaan Ketelitian Data',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[3].variations[1],
  },
  {
    id: 'pengawasan-lambat',
    label: 'Pengawasan - Evaluasi Tempo Wawancara',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[3].variations[2],
  },
  {
    id: 'pengawasan-bina-catatan',
    label: 'Pengawasan - Pembinaan Catatan Lapangan',
    category: 'pengawasan',
    text: URAIAN_VARIATION_GROUPS[3].variations[3],
  },

  // 5. Pendataan - Responden Ramah & Lengkap
  {
    id: 'pendataan-lengkap',
    label: 'Pendataan - Responden Ramah & Lengkap (Variasi 1)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[4].variations[0],
  },
  {
    id: 'pendataan-ramah-2',
    label: 'Pendataan - Responden Ramah & Lengkap (Variasi 2)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[4].variations[1],
  },
  {
    id: 'pendataan-ramah-3',
    label: 'Pendataan - Responden Ramah & Lengkap (Variasi 3)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[4].variations[2],
  },
  {
    id: 'pendataan-ramah-4',
    label: 'Pendataan - Responden Ramah & Lengkap (Variasi 4)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[4].variations[3],
  },

  // 6. Pendataan - Responden Kurang Ramah / Sibuk
  {
    id: 'pendataan-kurang-ramah-1',
    label: 'Pendataan - Responden Kurang Ramah / Sibuk (Variasi 1)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[5].variations[0],
  },
  {
    id: 'pendataan-kurang-ramah-2',
    label: 'Pendataan - Responden Kurang Ramah / Sibuk (Variasi 2)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[5].variations[1],
  },
  {
    id: 'pendataan-kurang-ramah-3',
    label: 'Pendataan - Responden Kurang Ramah / Sibuk (Variasi 3)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[5].variations[2],
  },
  {
    id: 'pendataan-kurang-ramah-4',
    label: 'Pendataan - Responden Kurang Ramah / Sibuk (Variasi 4)',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[5].variations[3],
  },

  // 7. Pendataan - Belum Lengkap / Kunjungan Ulang
  {
    id: 'pendataan-belum-lengkap',
    label: 'Pendataan - Belum Lengkap / Dokumen Menyusul',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[6].variations[0],
  },
  {
    id: 'pendataan-ulang-luarkota',
    label: 'Pendataan - Belum Lengkap / Responden Luar Kota',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[6].variations[1],
  },
  {
    id: 'pendataan-ulang-terjeda',
    label: 'Pendataan - Belum Lengkap / Wawancara Terjeda',
    category: 'pendataan',
    text: URAIAN_VARIATION_GROUPS[6].variations[2],
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
