import type { BulkPhotoItem, HierarchyPayload, StampConfig } from './types';
import {
  getRandomWorkingTime,
  getTodayDateString,
  resolveSmartLocationText,
  samplePointFromResolvedTarget,
} from './spatial';
import { renderStampedCanvas } from './canvasStamper';

export interface ParsedSpreadsheetRow {
  nama_foto?: string;
  tanggal?: string;
  jam?: string;
  lokasi?: string;
  koordinat?: string;
  catatan?: string;
}

/**
 * Generates a lightweight <=120px thumbnail ObjectURL from a File without retaining full ImageBitmap in RAM.
 * Follows AGENTS.md Rule 3.2 (Bulk Memory Safety).
 */
export async function createThumbnailFromFile(file: File): Promise<{
  thumbUrl: string;
  width: number;
  height: number;
}> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const origW = bitmap.width;
  const origH = bitmap.height;

  const maxThumb = 120;
  const scale = Math.min(1, maxThumb / Math.max(origW, origH));
  const tw = Math.max(1, Math.round(origW * scale));
  const th = Math.max(1, Math.round(origH * scale));

  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, tw, th);
  }
  // Immediately release full-res bitmap from memory
  bitmap.close();

  return new Promise((resolve) => {
    c.toBlob(
      (blob) => {
        const thumbUrl = blob ? URL.createObjectURL(blob) : '';
        resolve({ thumbUrl, width: origW, height: origH });
      },
      'image/jpeg',
      0.75
    );
  });
}

/**
 * Normalizes spreadsheet cell values (including Excel serial dates if present).
 */
function normalizeExcelDateValue(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number' && val > 25000 && val < 80000) {
    // Excel serial date number
    const utcDays = Math.floor(val - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV (.csv) file into normalized rows.
 */
export async function parseBulkSpreadsheetFile(file: File): Promise<ParsedSpreadsheetRow[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  const parsed: ParsedSpreadsheetRow[] = [];

  for (const row of rawRows) {
    const entry: ParsedSpreadsheetRow = {};
    for (const [k, v] of Object.entries(row)) {
      const key = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const strVal = String(v ?? '').trim();
      if (!strVal && !(v instanceof Date)) continue;

      if (
        key.includes('nama') ||
        key.includes('file') ||
        key.includes('foto') ||
        key === 'image'
      ) {
        entry.nama_foto = strVal;
      } else if (key.includes('tanggal') || key.includes('tgl') || key.includes('date')) {
        entry.tanggal = normalizeExcelDateValue(v);
      } else if (key.includes('jam') || key.includes('waktu') || key.includes('time')) {
        entry.jam = strVal;
      } else if (
        key.includes('lokasi') ||
        key.includes('wilayah') ||
        key.includes('sls') ||
        key.includes('dusun') ||
        key.includes('desa') ||
        key.includes('kec')
      ) {
        entry.lokasi = entry.lokasi ? `${entry.lokasi} ${strVal}` : strVal;
      } else if (key.includes('koord') || key.includes('lat') || key.includes('coord')) {
        entry.koordinat = strVal;
      } else if (key.includes('catat') || key.includes('ket') || key.includes('note')) {
        entry.catatan = strVal;
      }
    }

    // Only keep non-empty rows
    if (
      entry.nama_foto ||
      entry.tanggal ||
      entry.jam ||
      entry.lokasi ||
      entry.koordinat ||
      entry.catatan
    ) {
      parsed.push(entry);
    }
  }

  return parsed;
}

/**
 * Generates and downloads a ready-to-use Excel (.xlsx) template for Bulk Stamping.
 */
export async function downloadBulkExcelTemplate(existingItems: BulkPhotoItem[]) {
  const XLSX = await import('xlsx');
  const sampleRows =
    existingItems.length > 0
      ? existingItems.map((item, idx) => ({
          nama_foto: item.fileName,
          tanggal: item.dateStr || getTodayDateString(),
          lokasi:
            item.locationInput ||
            (idx % 2 === 0 ? 'Jurit Bebuaq' : '5202050008000501'),
          jam: item.timeStr || '',
          koordinat: '',
          catatan: item.customNote || '',
        }))
      : [
          {
            nama_foto: 'IMG_001.jpg',
            tanggal: getTodayDateString(),
            lokasi: 'Jurit Bebuaq',
            jam: '09:24:18',
            koordinat: '',
            catatan: '',
          },
          {
            nama_foto: 'IMG_002.jpg',
            tanggal: getTodayDateString(),
            lokasi: 'Dusun Montong Gamang, Kopang',
            jam: '',
            koordinat: '',
            catatan: '',
          },
          {
            nama_foto: 'IMG_003.jpg',
            tanggal: getTodayDateString(),
            lokasi: '5202050008000501',
            jam: '',
            koordinat: '',
            catatan: '',
          },
        ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 24 }, // nama_foto
    { wch: 15 }, // tanggal
    { wch: 32 }, // lokasi
    { wch: 14 }, // jam
    { wch: 24 }, // koordinat
    { wch: 28 }, // catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bulk_GeoStamp');
  XLSX.writeFile(wb, 'Template_Bulk_GeoStamp_SLS.xlsx');
}

/**
 * Resolves a single BulkPhotoItem's locationInput into coordinates & region tags.
 */
export async function resolveAndSampleBulkItem(
  item: BulkPhotoItem,
  hierarchy: HierarchyPayload | null,
  keepExistingCoords = false
): Promise<BulkPhotoItem> {
  const target = resolveSmartLocationText(item.locationInput, hierarchy);

  if (target.status === 'empty' || target.status === 'unmatched') {
    return {
      ...item,
      matchStatus: target.status,
      resolvedTarget: target,
      regionInfo: null,
      activeFeature: null,
      coordStr: keepExistingCoords ? item.coordStr : '',
      tagStr: '',
    };
  }

  try {
    const sampled = await samplePointFromResolvedTarget(target);
    if (!sampled) {
      return {
        ...item,
        matchStatus: 'unmatched',
        resolvedTarget: target,
        regionInfo: null,
        activeFeature: null,
      };
    }

    return {
      ...item,
      matchStatus: target.status,
      resolvedTarget: target,
      regionInfo: sampled.regionInfo,
      activeFeature: sampled.activeFeature,
      coordStr: keepExistingCoords && item.coordStr.trim() ? item.coordStr : sampled.coordStr,
      tagStr: sampled.tagStr,
    };
  } catch {
    return {
      ...item,
      matchStatus: 'unmatched',
      resolvedTarget: target,
    };
  }
}

/**
 * Sequentially renders each photo in the bulk queue at 100% original resolution,
 * packs into a ZIP archive, and immediately disposes each ImageBitmap to prevent RAM spikes.
 * Follows AGENTS.md Rule 3.2 (Bulk Memory Safety).
 */
export async function exportBulkPhotosToZip(
  items: BulkPhotoItem[],
  globalStyleConfig: StampConfig,
  onProgress: (current: number, total: number, fileName: string) => void
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress(i + 1, items.length, item.fileName);

    // Yield to browser UI thread so progress bar updates smoothly
    await new Promise((r) => setTimeout(r, 15));

    // Decode full-resolution photo just-in-time
    const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
    const offscreen = document.createElement('canvas');
    offscreen.width = bitmap.width;
    offscreen.height = bitmap.height;

    const itemStampConfig: StampConfig = {
      ...globalStyleConfig,
      dateStr: item.dateStr,
      timeStr: item.timeStr,
      coordStr: item.coordStr,
      tagStr: item.tagStr,
      customNote: item.customNote || globalStyleConfig.customNote,
    };

    renderStampedCanvas(
      offscreen,
      bitmap,
      itemStampConfig,
      item.regionInfo,
      item.activeFeature,
      bitmap.width,
      bitmap.height
    );

    // Immediately free decoded bitmap from RAM
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      offscreen.toBlob((b) => resolve(b), 'image/jpeg', 0.93)
    );

    // Clear canvas memory
    offscreen.width = 1;
    offscreen.height = 1;

    if (blob) {
      const baseName = item.fileName.replace(/\.[^/.]+$/, '');
      const idTag = item.regionInfo?.idsubsls || 'SLS';
      let outName = `STAMP_${idTag}_${baseName}.jpg`;
      let counter = 1;
      while (usedNames.has(outName)) {
        outName = `STAMP_${idTag}_${baseName}_${counter}.jpg`;
        counter++;
      }
      usedNames.add(outName);
      zip.file(outName, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  const stampDate = getTodayDateString().replace(/-/g, '');
  link.href = url;
  link.download = `GeoStamp_Bulk_${items.length}Foto_${stampDate}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
