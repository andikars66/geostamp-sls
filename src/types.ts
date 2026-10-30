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

export interface StampConfig {
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
