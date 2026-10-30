import { buildLocationOptions, resolveLocation } from './locationSearch';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type {
  BoundaryCollection,
  BoundaryFeature,
  HierarchyPayload,
  ResolvedLocationTarget,
  SelectedRegionInfo,
} from './types';

// In-memory cache of loaded Kecamatan boundary files
const boundaryCache = new Map<string, BoundaryCollection>();

/**
 * Lazy-loads the GeoJSON boundary file for a specific Kecamatan (`kdkec`).
 */
export async function loadKecamatanBoundaries(kdkec: string): Promise<BoundaryCollection> {
  const cached = boundaryCache.get(kdkec);
  if (cached) {
    return cached;
  }

  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const response = await fetch(`${cleanBase}data/boundaries/${kdkec}.json`);
  if (!response.ok) {
    throw new Error(`Gagal memuat batas wilayah kecamatan ${kdkec}`);
  }
  const data = (await response.json()) as BoundaryCollection;
  boundaryCache.set(kdkec, data);
  return data;
}

/**
 * Filters features within a Kecamatan boundary collection based on the most specific level chosen.
 */
export function filterCandidateFeatures(
  collection: BoundaryCollection,
  filters: {
    kdkec: string;
    iddesa?: string;
    idsls?: string;
    idsubsls?: string;
  }
): BoundaryFeature[] {
  let candidates = collection.features;

  if (filters.idsubsls) {
    candidates = candidates.filter((f) => f.properties.idsubsls === filters.idsubsls);
  } else if (filters.idsls) {
    candidates = candidates.filter((f) => f.properties.idsls === filters.idsls);
  } else if (filters.iddesa) {
    candidates = candidates.filter((f) => f.properties.iddesa === filters.iddesa);
  }

  return candidates;
}

/**
 * Generates a random coordinate guaranteed to be inside one of the candidate polygon features.
 * Follows AGENTS.md Geospatial Rules:
 * - EPSG:4326 [Longitude, Latitude]
 * - Monte Carlo Bounding Box sampling verified by Turf booleanPointInPolygon (max 100 iterations)
 * - Deterministic fallback to pre-verified interior point / centroid if 100 iterations fail
 * - Coordinate precision: 6 decimal places
 */
export function sampleRandomPointInFeatures(candidates: BoundaryFeature[]): {
  lat: number;
  lng: number;
  feature: BoundaryFeature;
} {
  if (!candidates || candidates.length === 0) {
    throw new Error('Tidak ada poligon wilayah kandidat untuk dipilih.');
  }

  // Pick a random polygon from the matching candidate set
  const chosenFeature = candidates[Math.floor(Math.random() * candidates.length)];
  const [minX, minY, maxX, maxY] = chosenFeature.properties.bbox;

  for (let i = 0; i < 100; i++) {
    const randomLng = minX + Math.random() * (maxX - minX);
    const randomLat = minY + Math.random() * (maxY - minY);
    const pt = point([randomLng, randomLat]);

    if (booleanPointInPolygon(pt, chosenFeature as any)) {
      return {
        lat: Number(randomLat.toFixed(6)),
        lng: Number(randomLng.toFixed(6)),
        feature: chosenFeature,
      };
    }
  }

  // Deterministic fallback to interior point / centroid
  return {
    lat: Number(chosenFeature.properties.fallback_lat.toFixed(6)),
    lng: Number(chosenFeature.properties.fallback_lng.toFixed(6)),
    feature: chosenFeature,
  };
}

const DAYS_INDONESIAN = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Extracts or computes the day name (e.g. "Rabu") from a date string.
 * If user explicitly types the day name (e.g. "Kamis, 29 Okt 2026"), retains it.
 */
export function getIndonesianDayName(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  for (const day of DAYS_INDONESIAN) {
    if (new RegExp(`^${day}\\b`, 'i').test(trimmed)) {
      return day;
    }
  }

  // Parse ISO (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    if (!isNaN(d.getTime())) {
      return DAYS_INDONESIAN[d.getDay()] || '';
    }
  }

  // Parse DMY (DD-MM-YYYY)
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
    if (!isNaN(d.getTime())) {
      return DAYS_INDONESIAN[d.getDay()] || '';
    }
  }

  return '';
}

/**
 * Formats a date string into Indonesian readable format with optional custom Day Name override.
 * Supports YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, or free text.
 */
export function formatIndonesianDate(dateStr: string, customDayStr?: string): string {
  const trimmed = dateStr.trim();
  if (!trimmed) return customDayStr?.trim() || '';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      const dObj = new Date(year, monthIdx, day);
      const computedDay = DAYS_INDONESIAN[dObj.getDay()] || '';
      const dayName = customDayStr !== undefined && customDayStr.trim() !== '' ? customDayStr.trim() : computedDay;
      const dateFormatted = `${String(day).padStart(2, '0')} ${months[monthIdx]} ${year}`;
      return dayName ? `${dayName}, ${dateFormatted}` : dateFormatted;
    }
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      const dObj = new Date(year, monthIdx, day);
      const computedDay = DAYS_INDONESIAN[dObj.getDay()] || '';
      const dayName = customDayStr !== undefined && customDayStr.trim() !== '' ? customDayStr.trim() : computedDay;
      const dateFormatted = `${String(day).padStart(2, '0')} ${months[monthIdx]} ${year}`;
      return dayName ? `${dayName}, ${dateFormatted}` : dateFormatted;
    }
  }

  // If already prefixed with day name or free text
  const computedDay = getIndonesianDayName(trimmed);
  const dayName = customDayStr !== undefined && customDayStr.trim() !== '' ? customDayStr.trim() : computedDay;
  if (dayName && !trimmed.toLowerCase().startsWith(dayName.toLowerCase())) {
    return `${dayName}, ${trimmed}`;
  }

  return trimmed;
}

/**
 * Returns a series of N working day dates (Senin-Jumat only), stepping backwards starting from today.
 * If today is Saturday or Sunday, moves back to Friday first.
 */
export function getDescendingWorkdayDates(count: number, startDate = new Date()): string[] {
  const result: string[] = [];
  const curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  // Adjust starting day to previous Friday if weekend
  if (curr.getDay() === 0) {
    // Sunday -> Friday
    curr.setDate(curr.getDate() - 2);
  } else if (curr.getDay() === 6) {
    // Saturday -> Friday
    curr.setDate(curr.getDate() - 1);
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  for (let i = 0; i < count; i++) {
    const y = curr.getFullYear();
    const m = pad(curr.getMonth() + 1);
    const d = pad(curr.getDate());
    result.push(`${y}-${m}-${d}`);

    // Step back 1 day
    curr.setDate(curr.getDate() - 1);
    // Skip weekend days going backwards
    if (curr.getDay() === 0) {
      // Sunday -> step back to Friday
      curr.setDate(curr.getDate() - 2);
    } else if (curr.getDay() === 6) {
      // Saturday -> step back to Friday
      curr.setDate(curr.getDate() - 1);
    }
  }

  return result;
}

/**
 * Converts a user-typed date string to YYYY-MM-DD for syncing with native <input type="date"> picker.
 */
export function toIsoDateValue(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  return '';
}

/**
 * Converts a user-typed time string to HH:MM:SS or HH:MM for syncing with native <input type="time"> picker.
 */
export function toIsoTimeValue(timeStr: string): string {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    const s = match[3] !== undefined ? Math.min(59, Math.max(0, parseInt(match[3], 10))) : 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return '';
}

/**
 * Generates today's local date in YYYY-MM-DD format.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates a random working-hour time between 09:00:00 and 15:59:59
 * with non-round minutes and seconds (per PRD & AGENTS.md).
 */
export function getRandomWorkingTime(): string {
  const hour = Math.floor(Math.random() * (16 - 9)) + 9; // 9..15
  // Ensure non-zero / non-round minutes & seconds so it looks completely natural
  let minute = Math.floor(Math.random() * 59) + 1;
  if (minute % 10 === 0) minute = (minute + 3) % 59 || 1;
  let second = Math.floor(Math.random() * 59) + 1;
  if (second % 10 === 0) second = (second + 7) % 59 || 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

const LOCATION_STOPWORDS = new Set([
  'dusun',
  'dsn',
  'rt',
  'rw',
  'desa',
  'ds',
  'kelurahan',
  'kel',
  'kecamatan',
  'kec',
  'sls',
  'subsls',
  'sub',
  'lingkungan',
  'lingk',
  'kabupaten',
  'kab',
  'lombok',
  'tengah',
]);

/**
 * Normalizes a free-text location string by stripping punctuation and common regional stopwords.
 */
export function normalizeLocationTokens(raw: string): string[] {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  if (!cleaned) return [];
  const allTokens = cleaned.split(/\s+/).filter(Boolean);
  const filtered = allTokens.filter((t) => !LOCATION_STOPWORDS.has(t));
  return filtered.length > 0 ? filtered : allTokens;
}

/**
 * Resolves any user-entered location string (ID SubSLS, ID SLS, ID Desa, or free text like
 * "Jurit", "Jurit Bebuaq", "Desa Bebuaq", "Kopang") to the best matching hierarchy target.
 * Follows AGENTS.md Rule 2.4 (Smart Location Matching Invariant).
 */
export function resolveSmartLocationText(
  rawText: string,
  hierarchy: HierarchyPayload | null
): ResolvedLocationTarget {
  return resolveLocation(rawText, buildLocationOptions(hierarchy));
}

/**
 * Given a ResolvedLocationTarget, loads its Kecamatan boundary and samples a valid random coordinate inside it.
 */
export async function samplePointFromResolvedTarget(
  target: ResolvedLocationTarget
): Promise<{
  regionInfo: SelectedRegionInfo;
  activeFeature: BoundaryFeature;
  coordStr: string;
  tagStr: string;
} | null> {
  if (!target.kdkec || target.status === 'unmatched' || target.status === 'empty') {
    return null;
  }

  const collection = await loadKecamatanBoundaries(target.kdkec);
  const candidates = filterCandidateFeatures(collection, {
    kdkec: target.kdkec,
    iddesa: target.iddesa,
    idsls: target.idsls,
    idsubsls: target.level === 'subsls' ? target.idsubsls : undefined,
  });

  if (candidates.length === 0) return null;

  const { lat, lng, feature } = sampleRandomPointInFeatures(candidates);
  const props = feature.properties;

  const regionInfo: SelectedRegionInfo = {
    level:
      target.level === 'none'
        ? 'kecamatan'
        : target.level,
    kdkec: props.kdkec,
    nmkec: props.nmkec,
    iddesa: props.iddesa,
    kddesa: props.kddesa,
    nmdesa: props.nmdesa,
    idsls: props.idsls,
    kdsls: props.kdsls,
    nmsls: props.nmsls,
    idsubsls: props.idsubsls,
    kdsubsls: props.kdsubsls,
    sampledFeatureId: props.idsubsls,
    lat,
    lng,
  };

  const idTag = props.idsubsls || props.idsls || props.iddesa || props.kdkec;
  const locParts = [props.nmsls, props.nmdesa, props.nmkec].filter(Boolean);
  const tagStr = `${idTag} • ${locParts.join(', ')}`;
  const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  return {
    regionInfo,
    activeFeature: feature,
    coordStr,
    tagStr,
  };
}
