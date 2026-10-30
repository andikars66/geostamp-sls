import type { BulkPhotoItem, HierarchyPayload, StampConfig } from './types';
import {
  getIndonesianDayName,
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
  // Parameter Opsional Laporan Perjalanan Dinas (Perjadin)
  uraian?: string;
  tujuan?: string;
  nama_kegiatan?: string;
  nomor_st?: string;
  tanggal_st?: string;
  nama_pelaksana?: string;
  jabatan?: string;
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
 * Supports both GeoStamp parameters and optional Perjadin report parameters.
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

      // 1. Surat Tugas (Nomor & Tanggal ST)
      if (
        key.includes('no_st') ||
        key.includes('nomor_st') ||
        key.includes('nost') ||
        key.includes('surat_tugas') ||
        key.includes('no_surat') ||
        key.includes('nomor_surat')
      ) {
        entry.nomor_st = strVal;
      } else if (
        key.includes('tanggal_st') ||
        key.includes('tgl_st') ||
        key.includes('tanggal_surat') ||
        key.includes('tgl_surat')
      ) {
        entry.tanggal_st = normalizeExcelDateValue(v);
      }
      // 2. Tujuan Perjadin
      else if (key.includes('tujuan') || key.includes('destinasi')) {
        entry.tujuan = strVal;
      }
      // 3. Nama Kegiatan vs Uraian Kegiatan
      else if (
        key.includes('nama_kegiatan') ||
        key.includes('nm_kegiatan') ||
        key.includes('perihal') ||
        key.includes('judul_kegiatan') ||
        key === 'kegiatan'
      ) {
        entry.nama_kegiatan = strVal;
      } else if (
        key.includes('uraian') ||
        key.includes('narasi') ||
        key.includes('deskripsi') ||
        key.includes('hasil')
      ) {
        entry.uraian = strVal;
      }
      // 4. Nama Pelaksana & Jabatan
      else if (
        key.includes('nama_pelaksana') ||
        key.includes('nama_petugas') ||
        key.includes('pelaksana') ||
        key.includes('petugas') ||
        key.includes('pegawai')
      ) {
        entry.nama_pelaksana = strVal;
      } else if (
        key.includes('jabatan') ||
        key.includes('posisi') ||
        key.includes('peran')
      ) {
        entry.jabatan = strVal;
      }
      // 5. Nama Foto / File
      else if (
        key.includes('nama_foto') ||
        key.includes('file') ||
        key.includes('foto') ||
        key === 'image' ||
        key === 'gambar'
      ) {
        entry.nama_foto = strVal;
      } else if (key === 'nama') {
        if (/\.(jpe?g|png|webp|heic|bmp)$/i.test(strVal)) {
          entry.nama_foto = strVal;
        } else {
          entry.nama_pelaksana = strVal;
        }
      }
      // 6. Tanggal Kegiatan Utama
      else if (key.includes('tanggal') || key.includes('tgl') || key.includes('date')) {
        entry.tanggal = normalizeExcelDateValue(v);
      }
      // 7. Jam / Waktu
      else if (
        key.includes('jam') ||
        key.includes('waktu') ||
        key.includes('time') ||
        key.includes('pukul')
      ) {
        entry.jam = strVal;
      }
      // 8. Lokasi / SLS / Desa / Kec
      else if (
        key.includes('lokasi') ||
        key.includes('wilayah') ||
        key.includes('sls') ||
        key.includes('dusun') ||
        key.includes('desa') ||
        key.includes('kec')
      ) {
        entry.lokasi = entry.lokasi ? `${entry.lokasi} ${strVal}` : strVal;
      }
      // 9. Koordinat
      else if (
        key.includes('koord') ||
        key.includes('lat') ||
        key.includes('coord') ||
        key.includes('gps')
      ) {
        entry.koordinat = strVal;
      }
      // 10. Catatan Watermark
      else if (
        key.includes('catat') ||
        key.includes('ket') ||
        key.includes('note')
      ) {
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
      entry.catatan ||
      entry.uraian ||
      entry.tujuan ||
      entry.nama_kegiatan ||
      entry.nomor_st ||
      entry.tanggal_st ||
      entry.nama_pelaksana ||
      entry.jabatan
    ) {
      parsed.push(entry);
    }
  }

  return parsed;
}

/**
 * Generates and downloads a ready-to-use unified Excel (.xlsx) template for Bulk Stamping & Laporan Perjadin.
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
          koordinat: item.coordStr || '',
          catatan: item.customNote || '',
          uraian_kegiatan: item.uraianKegiatan || '',
          tujuan: item.tujuanPerjadin || '',
          nama_kegiatan: item.namaKegiatanPerjadin || '',
          nomor_st: item.nomorSTPerjadin || '',
          tanggal_st: item.tanggalSTPerjadin || '',
          nama_pelaksana: item.namaPelaksanaPerjadin || '',
          jabatan: item.jabatanPelaksanaPerjadin || '',
        }))
      : [
          {
            nama_foto: 'IMG_001.jpg',
            tanggal: getTodayDateString(),
            lokasi: 'Jurit Bebuaq',
            jam: '09:24:18',
            koordinat: '',
            catatan: '',
            uraian_kegiatan:
              'Pendataan lapangan terhadap responden di unit sampel berjalan lancar dan seluruh rincian kuesioner terisi lengkap sesuai SOP.',
            tujuan: 'Dusun Jurit, Desa Bebuaq',
            nama_kegiatan: 'Pengawasan Pemutakhiran SAKERNAS Agustus 2026',
            nomor_st: 'B-123/52020/KP.100/2026',
            tanggal_st: getTodayDateString(),
            nama_pelaksana: '',
            jabatan: '',
          },
          {
            nama_foto: 'IMG_002.jpg',
            tanggal: getTodayDateString(),
            lokasi: 'Dusun Montong Gamang, Kopang',
            jam: '10:15:00',
            koordinat: '',
            catatan: '',
            uraian_kegiatan:
              'Pemeriksaan kelengkapan dokumen dan pencocokan batas satuan lingkungan setempat bersama pengurus RT/RW.',
            tujuan: 'Desa Montong Gamang',
            nama_kegiatan: '',
            nomor_st: '',
            tanggal_st: '',
            nama_pelaksana: '',
            jabatan: '',
          },
          {
            nama_foto: 'IMG_003.jpg',
            tanggal: getTodayDateString(),
            lokasi: '5202050008000501',
            jam: '',
            koordinat: '',
            catatan: '',
            uraian_kegiatan: '',
            tujuan: '',
            nama_kegiatan: '',
            nomor_st: '',
            tanggal_st: '',
            nama_pelaksana: '',
            jabatan: '',
          },
        ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 22 }, // nama_foto
    { wch: 14 }, // tanggal
    { wch: 30 }, // lokasi
    { wch: 12 }, // jam
    { wch: 24 }, // koordinat
    { wch: 20 }, // catatan
    { wch: 50 }, // uraian_kegiatan
    { wch: 28 }, // tujuan
    { wch: 38 }, // nama_kegiatan
    { wch: 24 }, // nomor_st
    { wch: 16 }, // tanggal_st
    { wch: 22 }, // nama_pelaksana
    { wch: 24 }, // jabatan
  ];

  // Petunjuk Kolom Sheet
  const guideRows = [
    {
      Nama_Kolom: 'nama_foto',
      Kategori: 'Stempel (Wajib / Kunci)',
      Keterangan: 'Nama file foto persis seperti yang diunggah',
      Contoh_Isian: 'IMG_001.jpg',
    },
    {
      Nama_Kolom: 'tanggal',
      Kategori: 'Stempel & Laporan',
      Keterangan: 'Format YYYY-MM-DD atau DD/MM/YYYY. Kosong = otomatis tanggal hari kerja',
      Contoh_Isian: '2026-08-15',
    },
    {
      Nama_Kolom: 'lokasi',
      Kategori: 'Stempel (Wilayah SLS)',
      Keterangan: 'Teks nama SLS/Dusun/Desa/Kecamatan atau Kode ID SLS 16 digit',
      Contoh_Isian: 'Jurit Bebuaq atau 5202050008000501',
    },
    {
      Nama_Kolom: 'jam',
      Kategori: 'Stempel (Waktu)',
      Keterangan: 'Format HH:MM:SS. Kosong = otomatis jam kerja acak (09:00 - 15:00)',
      Contoh_Isian: '09:24:18',
    },
    {
      Nama_Kolom: 'koordinat',
      Kategori: 'Stempel (Opsional)',
      Keterangan: 'Latitude, Longitude manual. Kosong = auto-sample titik acak di dalam poligon SLS',
      Contoh_Isian: '-8.672341, 116.321894',
    },
    {
      Nama_Kolom: 'catatan',
      Kategori: 'Stempel (Opsional)',
      Keterangan: 'Catatan tambahan yang dicetak pada watermark foto',
      Contoh_Isian: 'Kegiatan SAKERNAS',
    },
    {
      Nama_Kolom: 'uraian_kegiatan',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Rincian narasi kegiatan perjalanan dinas. Kosong = menggunakan preset di UI',
      Contoh_Isian: 'Pendataan lapangan terhadap responden sampel berjalan lancar sesuai SOP.',
    },
    {
      Nama_Kolom: 'tujuan',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Tujuan spesifik perjalanan dinas. Kosong = otomatis diturunkan dari nama wilayah SLS',
      Contoh_Isian: 'Desa Bebuaq, Kecamatan Kopang',
    },
    {
      Nama_Kolom: 'nama_kegiatan',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Perihal / nama kegiatan khusus baris ini. Kosong = menggunakan profil global',
      Contoh_Isian: 'Pengawasan Lapangan SAKERNAS 2026',
    },
    {
      Nama_Kolom: 'nomor_st',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Nomor Surat Tugas khusus baris ini. Kosong = menggunakan nomor ST profil',
      Contoh_Isian: 'B-123/52020/KP.100/2026',
    },
    {
      Nama_Kolom: 'tanggal_st',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Tanggal Surat Tugas khusus baris ini. Kosong = menggunakan tanggal ST profil',
      Contoh_Isian: '12 Juli 2026',
    },
    {
      Nama_Kolom: 'nama_pelaksana',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Nama pelaksana jika kegiatan dinas tim/kolektif. Kosong = profil global',
      Contoh_Isian: 'Ahmad Fauzi, S.Tr.Stat.',
    },
    {
      Nama_Kolom: 'jabatan',
      Kategori: 'Laporan Perjadin (Opsional)',
      Keterangan: 'Jabatan pelaksana. Kosong = profil global',
      Contoh_Isian: 'Statistisi Ahli Pertama',
    },
  ];

  const guideWs = XLSX.utils.json_to_sheet(guideRows);
  guideWs['!cols'] = [
    { wch: 18 },
    { wch: 26 },
    { wch: 60 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bulk_GeoStamp_Perjadin');
  XLSX.utils.book_append_sheet(wb, guideWs, 'Panduan_Kolom');
  XLSX.writeFile(wb, 'Template_Bulk_GeoStamp_Perjadin.xlsx');
}

/**
 * Applies parsed spreadsheet rows to current BulkPhotoItem list with smart fallback.
 */
export async function applyParsedRowsToBulkItems(
  rows: ParsedSpreadsheetRow[],
  currentItems: BulkPhotoItem[],
  hierarchy: HierarchyPayload | null
): Promise<BulkPhotoItem[]> {
  const updated: BulkPhotoItem[] = [];

  for (let i = 0; i < currentItems.length; i++) {
    const item = currentItems[i];
    const cleanItemName = item.fileName.toLowerCase().trim();
    const cleanItemBase = cleanItemName.replace(/\.[^/.]+$/, '');

    const matchedRow =
      rows.find((r) => {
        if (!r.nama_foto) return false;
        const rn = r.nama_foto.toLowerCase().trim();
        const rBase = rn.replace(/\.[^/.]+$/, '');
        return rn === cleanItemName || rBase === cleanItemBase;
      }) ?? (i < rows.length ? rows[i] : null);

    if (!matchedRow) {
      updated.push(item);
      continue;
    }

    const rowDate = matchedRow.tanggal || item.dateStr || getTodayDateString();
    const nextDraft: BulkPhotoItem = {
      ...item,
      dateStr: rowDate,
      dayStr: getIndonesianDayName(rowDate),
      timeStr: matchedRow.jam || item.timeStr || getRandomWorkingTime(),
      locationInput:
        matchedRow.lokasi !== undefined && matchedRow.lokasi !== ''
          ? matchedRow.lokasi
          : item.locationInput,
      coordStr: matchedRow.koordinat || item.coordStr || '',
      customNote:
        matchedRow.catatan !== undefined ? matchedRow.catatan : item.customNote,
      // Optional Perjadin report parameters from Excel
      uraianKegiatan:
        matchedRow.uraian !== undefined && matchedRow.uraian.trim() !== ''
          ? matchedRow.uraian.trim()
          : item.uraianKegiatan,
      tujuanPerjadin:
        matchedRow.tujuan !== undefined && matchedRow.tujuan.trim() !== ''
          ? matchedRow.tujuan.trim()
          : item.tujuanPerjadin,
      namaKegiatanPerjadin:
        matchedRow.nama_kegiatan !== undefined && matchedRow.nama_kegiatan.trim() !== ''
          ? matchedRow.nama_kegiatan.trim()
          : item.namaKegiatanPerjadin,
      nomorSTPerjadin:
        matchedRow.nomor_st !== undefined && matchedRow.nomor_st.trim() !== ''
          ? matchedRow.nomor_st.trim()
          : item.nomorSTPerjadin,
      tanggalSTPerjadin:
        matchedRow.tanggal_st !== undefined && matchedRow.tanggal_st.trim() !== ''
          ? matchedRow.tanggal_st.trim()
          : item.tanggalSTPerjadin,
      namaPelaksanaPerjadin:
        matchedRow.nama_pelaksana !== undefined && matchedRow.nama_pelaksana.trim() !== ''
          ? matchedRow.nama_pelaksana.trim()
          : item.namaPelaksanaPerjadin,
      jabatanPelaksanaPerjadin:
        matchedRow.jabatan !== undefined && matchedRow.jabatan.trim() !== ''
          ? matchedRow.jabatan.trim()
          : item.jabatanPelaksanaPerjadin,
    };

    const resolved = await resolveAndSampleBulkItem(
      nextDraft,
      hierarchy,
      Boolean(matchedRow.koordinat)
    );
    updated.push(resolved);
  }

  return updated;
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
  // Report-only photos need a named destination, not random coordinates or boundary I/O.
  if (item.stampEnabled === false) {
    return { ...item, resolvedTarget: target, matchStatus: target.status,
      regionInfo: null, activeFeature: null, coordStr: '', tagStr: '' };
  }

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

    const itemDay =
      item.dayStr?.trim() ||
      getIndonesianDayName(item.dateStr) ||
      '';

    const itemStampConfig: StampConfig = {
      ...globalStyleConfig,
      dateStr: item.dateStr,
      dayStr: itemDay,
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


/** Create editable visits before documentation files are available. */
export async function createSpreadsheetDrafts(rows:ParsedSpreadsheetRow[], hierarchy:HierarchyPayload|null):Promise<BulkPhotoItem[]> {
 const drafts:BulkPhotoItem[]=[];
 for(let i=0;i<rows.length;i++){
  const row=rows[i];const date=row.tanggal||getTodayDateString();
  const draft:BulkPhotoItem={id:crypto.randomUUID(),photoMissing:true,expectedFileName:row.nama_foto,
   file:new File([],row.nama_foto||'photo-pending'),fileName:row.nama_foto||`Kunjungan ${i+1}`,thumbUrl:'',width:0,height:0,
   dateStr:date,dayStr:getIndonesianDayName(date),timeStr:row.jam||getRandomWorkingTime(),locationInput:row.lokasi||'',
   matchStatus:'empty',resolvedTarget:null,regionInfo:null,activeFeature:null,coordStr:row.koordinat||'',tagStr:'',customNote:row.catatan||'',
   uraianKegiatan:row.uraian,tujuanPerjadin:row.tujuan,namaKegiatanPerjadin:row.nama_kegiatan,nomorSTPerjadin:row.nomor_st,
   tanggalSTPerjadin:row.tanggal_st,namaPelaksanaPerjadin:row.nama_pelaksana,jabatanPelaksanaPerjadin:row.jabatan};
  drafts.push(await resolveAndSampleBulkItem(draft,hierarchy,!!row.koordinat));
 }
 return drafts;
}
