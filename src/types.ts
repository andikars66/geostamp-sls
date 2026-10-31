export interface SubSLSItem {
  idsubsls: string;
  kdsubsls: string;
}

export interface SLSItem {
  idsls: string;
  kdsls: string;
  nmsls: string;
  subsls: SubSLSItem[];
}

export interface DesaItem {
  iddesa: string;
  kddesa: string;
  nmdesa: string;
  sls: SLSItem[];
}

export interface KecamatanItem {
  kdkec: string;
  nmkec: string;
  desa: DesaItem[];
}

export interface HierarchyPayload {
  kabupaten: string;
  provinsi: string;
  kdprov: string;
  kdkab: string;
  total_kec: number;
  total_subsls: number;
  kecamatan: KecamatanItem[];
}

export interface BoundaryFeatureProperties {
  idsubsls: string;
  kdsubsls: string;
  idsls: string;
  kdsls: string;
  nmsls: string;
  iddesa: string;
  kddesa: string;
  nmdesa: string;
  kdkec: string;
  nmkec: string;
  bbox: [number, number, number, number];
  fallback_lng: number;
  fallback_lat: number;
}

export interface BoundaryFeature {
  type: 'Feature';
  properties: BoundaryFeatureProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface BoundaryCollection {
  type: 'FeatureCollection';
  kdkec: string;
  features: BoundaryFeature[];
}

export interface SelectedRegionInfo {
  level: 'kecamatan' | 'desa' | 'sls' | 'subsls';
  kdkec: string;
  nmkec: string;
  iddesa?: string;
  kddesa?: string;
  nmdesa?: string;
  idsls?: string;
  kdsls?: string;
  nmsls?: string;
  idsubsls?: string;
  kdsubsls?: string;
  sampledFeatureId?: string;
  lat: number;
  lng: number;
}

export type StampPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export type StampStyleId =
  | 'modern-card'
  | 'bottom-banner'
  | 'formal-survey'
  | 'minimal-text'
  | 'compact-pill';

export interface StampStyleDefinition {
  id: StampStyleId;
  name: string;
  description: string;
  tag: string;
}

export const STAMP_STYLES: StampStyleDefinition[] = [
  {
    id: 'modern-card',
    name: 'Kartu Modern',
    description: 'Kartu sudut membulat dengan peta mini di sisi kiri.',
    tag: 'Default',
  },
  {
    id: 'bottom-banner',
    name: 'Banner Bawah',
    description: 'Pita penuh di tepi foto.',
    tag: 'Penuh',
  },
  {
    id: 'formal-survey',
    name: 'Formal Kedinasan',
    description: 'Kartu terstruktur dengan label dokumentasi.',
    tag: 'SPPD',
  },
  {
    id: 'minimal-text',
    name: 'Teks Minimalis',
    description: 'Teks langsung di atas gradasi gelap tanpa kotak.',
    tag: 'Tanpa Kotak',
  },
  {
    id: 'compact-pill',
    name: 'Kapsul Ringkas',
    description: 'Kotak membulat ringkas hemat ruang.',
    tag: 'Ringkas',
  },
];

export type StampColorThemeId =
  | 'onyx'        // Hitam Putih (Default)
  | 'emerald'     // Hijau Emerald
  | 'sapphire'    // Biru Safir
  | 'khaki'       // Emas Khaki
  | 'amber'       // Amber
  | 'cyber';      // Hijau Terminal

export type StampFontFamilyId =
  | 'jakarta'     // Plus Jakarta Sans
  | 'serif'       // Times New Roman
  | 'mono'        // JetBrains Mono
  | 'system';     // System UI

export type StampIconModeId =
  | 'clean-poly'   // Poligon Bersih (Default)
  | 'radar-pulse'  // Lingkaran Radar
  | 'crosshair'    // Garis Bidik
  | 'pin-badge';   // Pin Lokasi

export interface StampThemePreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  colorTheme: StampColorThemeId;
  fontFamily: StampFontFamilyId;
  iconMode: StampIconModeId;
  bgHex: string;
  accentHex: string;
}

export const STAMP_THEME_PRESETS: StampThemePreset[] = [
  {
    id: 'hitam-putih',
    name: 'Hitam Putih · Poligon',
    tag: 'Default',
    description: 'Monokrom bersih dengan batas poligon wilayah.',
    colorTheme: 'onyx',
    fontFamily: 'jakarta',
    iconMode: 'clean-poly',
    bgHex: '#18181b',
    accentHex: '#ffffff',
  },
  {
    id: 'hitam-putih-serif',
    name: 'Hitam Putih · Serif',
    tag: 'Formal',
    description: 'Monokrom dengan huruf Times New Roman selaras Word.',
    colorTheme: 'onyx',
    fontFamily: 'serif',
    iconMode: 'clean-poly',
    bgHex: '#18181b',
    accentHex: '#d4d4d8',
  },
  {
    id: 'bps-emerald',
    name: 'Hijau Emerald',
    tag: 'Radar',
    description: 'Aksen hijau dengan lingkaran radar wilayah.',
    colorTheme: 'emerald',
    fontFamily: 'jakarta',
    iconMode: 'radar-pulse',
    bgHex: '#0f172a',
    accentHex: '#10b981',
  },
  {
    id: 'navy-sapphire',
    name: 'Biru Safir',
    tag: 'Poligon',
    description: 'Latar biru tua dengan garis poligon biru muda.',
    colorTheme: 'sapphire',
    fontFamily: 'jakarta',
    iconMode: 'clean-poly',
    bgHex: '#0c1a30',
    accentHex: '#38bdf8',
  },
  {
    id: 'formal-sppd',
    name: 'Emas Kedinasan',
    tag: 'Pin Lokasi',
    description: 'Huruf Times New Roman dengan aksen emas dan ikon pin.',
    colorTheme: 'khaki',
    fontFamily: 'serif',
    iconMode: 'pin-badge',
    bgHex: '#1c1917',
    accentHex: '#d97706',
  },
  {
    id: 'mono-teknis',
    name: 'Monospace Teknis',
    tag: 'Crosshair',
    description: 'Huruf monospace dengan penanda garis bidik.',
    colorTheme: 'onyx',
    fontFamily: 'mono',
    iconMode: 'crosshair',
    bgHex: '#09090b',
    accentHex: '#a1a1aa',
  },
];

export interface SavedStampSettings {
  stampStyle: StampStyleId;
  colorTheme: StampColorThemeId;
  fontFamily: StampFontFamilyId;
  iconMode: StampIconModeId;
  themePreset?: string;
  position: StampPosition;
  fontScale: number;
  scrimOpacity: number;
  showMiniMap: boolean;
}

const STAMP_CONFIG_STORAGE_KEY = 'laper_stamp_config_v2';

export const DEFAULT_STAMP_SETTINGS: SavedStampSettings = {
  stampStyle: 'modern-card',
  colorTheme: 'onyx',
  fontFamily: 'jakarta',
  iconMode: 'clean-poly',
  themePreset: 'hitam-putih',
  position: 'bottom-left',
  fontScale: 1.0,
  scrimOpacity: 0.68,
  showMiniMap: true,
};

export function loadSavedStampSettings(): SavedStampSettings {
  try {
    const raw = localStorage.getItem(STAMP_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_STAMP_SETTINGS;
    const parsed = JSON.parse(raw);
    const validStyles: StampStyleId[] = ['modern-card', 'bottom-banner', 'formal-survey', 'minimal-text', 'compact-pill'];
    const validPositions: StampPosition[] = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
    const validColors: StampColorThemeId[] = ['onyx', 'emerald', 'sapphire', 'khaki', 'amber', 'cyber'];
    const validFonts: StampFontFamilyId[] = ['jakarta', 'mono', 'serif', 'system'];
    const validIcons: StampIconModeId[] = ['clean-poly', 'radar-pulse', 'crosshair', 'pin-badge'];

    return {
      stampStyle: validStyles.includes(parsed.stampStyle) ? parsed.stampStyle : DEFAULT_STAMP_SETTINGS.stampStyle,
      colorTheme: validColors.includes(parsed.colorTheme) ? parsed.colorTheme : DEFAULT_STAMP_SETTINGS.colorTheme,
      fontFamily: validFonts.includes(parsed.fontFamily) ? parsed.fontFamily : DEFAULT_STAMP_SETTINGS.fontFamily,
      iconMode: validIcons.includes(parsed.iconMode) ? parsed.iconMode : DEFAULT_STAMP_SETTINGS.iconMode,
      themePreset: typeof parsed.themePreset === 'string' ? parsed.themePreset : DEFAULT_STAMP_SETTINGS.themePreset,
      position: validPositions.includes(parsed.position) ? parsed.position : DEFAULT_STAMP_SETTINGS.position,
      fontScale: typeof parsed.fontScale === 'number' && parsed.fontScale >= 0.7 && parsed.fontScale <= 1.5 ? parsed.fontScale : DEFAULT_STAMP_SETTINGS.fontScale,
      scrimOpacity: typeof parsed.scrimOpacity === 'number' && parsed.scrimOpacity >= 0.3 && parsed.scrimOpacity <= 1.0 ? parsed.scrimOpacity : DEFAULT_STAMP_SETTINGS.scrimOpacity,
      showMiniMap: typeof parsed.showMiniMap === 'boolean' ? parsed.showMiniMap : DEFAULT_STAMP_SETTINGS.showMiniMap,
    };
  } catch {
    return DEFAULT_STAMP_SETTINGS;
  }
}

export function saveSavedStampSettings(settings: Partial<SavedStampSettings>): void {
  try {
    const current = loadSavedStampSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STAMP_CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save stamp settings to localStorage:', err);
  }
}

export interface StampConfig {
  stampStyle?: StampStyleId;
  colorTheme?: StampColorThemeId;
  fontFamily?: StampFontFamilyId;
  iconMode?: StampIconModeId;
  themePreset?: string;
  dateStr: string;       // YYYY-MM-DD or free typed date
  dayStr: string;        // Free-typed or auto day name (e.g. "Rabu")
  timeStr: string;       // HH:MM:SS (freely typable)
  timezoneLabel: string; // e.g. WITA
  coordStr: string;      // e.g. "-8.672341, 116.321894" (freely typable)
  tagStr: string;        // e.g. "5202050008000501 • DUSUN JURIT, BEBUAQ, KOPANG"
  fontScale: number;     // 0.7 to 1.6 (multiplier on baseFontSize)
  scrimOpacity: number;  // 0.45 to 0.90
  position: StampPosition;
  showMiniMap: boolean;
  customNote: string;
}

export type LocationMatchStatus = 'matched' | 'partial' | 'unmatched' | 'empty';

export interface ResolvedLocationTarget {
  status: LocationMatchStatus;
  level: 'subsls' | 'sls' | 'desa' | 'kecamatan' | 'none';
  kdkec: string;
  nmkec: string;
  iddesa?: string;
  nmdesa?: string;
  idsls?: string;
  nmsls?: string;
  idsubsls?: string;
  kdsubsls?: string;
  displayLabel: string;
}

export interface BulkPhotoItem {
  /** Spreadsheet draft: file is an empty placeholder, never decode before a photo is attached. */
  photoMissing?: boolean;
  expectedFileName?: string;
  /** Undefined preserves legacy default: add a stamp. */
  stampEnabled?: boolean;
  stampStyle?: StampStyleId;
  id: string;
  file: File;
  fileName: string;
  thumbUrl: string;
  width: number;
  height: number;
  dateStr: string;
  dayStr?: string;
  timeStr: string;
  locationInput: string;
  matchStatus: LocationMatchStatus;
  resolvedTarget: ResolvedLocationTarget | null;
  regionInfo: SelectedRegionInfo | null;
  activeFeature: BoundaryFeature | null;
  coordStr: string;
  tagStr: string;
  customNote: string;
  // Optional Perjadin Report parameters (via Excel/CSV or manual entry)
  uraianKegiatan?: string;
  tujuanPerjadin?: string;
  namaKegiatanPerjadin?: string;
  nomorSTPerjadin?: string;
  tanggalSTPerjadin?: string;
  namaPelaksanaPerjadin?: string;
  jabatanPelaksanaPerjadin?: string;
}
