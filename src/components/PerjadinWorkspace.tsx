import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  CheckCircle2,
  FolderArchive,
  Layers,
  SlidersHorizontal,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import type { BulkPhotoItem, StampConfig } from '../types';
import {
  formatFormalIndonesianDate,
  JABATAN_OPTIONS,
  loadSavedPerjadinProfile,
  savePerjadinProfile,
  URAIAN_PRESETS,
  type PerjadinProfile,
  type PerjadinReportItem,
} from '../perjadinTypes';
import {
  generateBulkCombinedPerjadinDocx,
  generateBulkZipPerjadinDocx,
  generateSinglePerjadinDocx,
} from '../perjadinDocx';
import { PerjadinA4Preview } from './PerjadinA4Preview';
import { PerjadinSheetView } from './PerjadinSheetView';
import { renderStampedCanvas } from '../canvasStamper';
import { getIndonesianDayName } from '../spatial';

interface PerjadinWorkspaceProps {
  activeSinglePhotoBlob: Blob | null;
  activeSinglePhotoDataUrl: string | null;
  singleDateStr: string;
  singleTujuan: string;
  bulkItems: BulkPhotoItem[];
  globalStampConfig: StampConfig;
  initialSubMode?: 'single' | 'bulk';
  onNavigateToStamp: (mode: 'single' | 'bulk') => void;
  onImportSpreadsheet?: (file: File) => Promise<boolean>;
  onDownloadExcelTemplate?: () => void;
  onUpdateBulkItem?: (id: string, patch: Partial<BulkPhotoItem>) => void;
}

export const PerjadinWorkspace: React.FC<PerjadinWorkspaceProps> = ({
  activeSinglePhotoBlob,
  activeSinglePhotoDataUrl,
  singleDateStr,
  singleTujuan,
  bulkItems,
  globalStampConfig,
  initialSubMode = 'single',
  onNavigateToStamp,
  onImportSpreadsheet,
  onDownloadExcelTemplate,
  onUpdateBulkItem,
}) => {
  // Mode selection inside Perjadin: 'single' (1 Laporan) or 'bulk' (Banyak Laporan)
  const [subMode, setSubMode] = useState<'single' | 'bulk'>(() => {
    return bulkItems.length > 0 && initialSubMode === 'bulk' ? 'bulk' : 'single';
  });

  // Profil Pelaksana (Auto saved to localStorage)
  const [profile, setProfile] = useState<PerjadinProfile>(() => loadSavedPerjadinProfile());
  const [nama, setNama] = useState<string>(profile.nama || '');
  const [selectedJabatan, setSelectedJabatan] = useState<string>(profile.jabatan || 'Pranata Komputer Ahli Pertama');
  const [customJabatan, setCustomJabatan] = useState<string>(profile.customJabatan || '');
  const [asalSatker, setAsalSatker] = useState<string>(profile.asalSatker || 'BPS Kabupaten Lombok Tengah');
  const [namaKegiatan, setNamaKegiatan] = useState<string>(
    profile.namaKegiatan || 'Pengawasan Pemutakhiran SAKERNAS Agustus 2026'
  );
  const [nomorST, setNomorST] = useState<string>(profile.nomorST || '');
  const [tanggalST, setTanggalST] = useState<string>(profile.tanggalST || '');

  // Single Mode State
  const [singleDate, setSingleDate] = useState<string>(singleDateStr || '');
  const [tujuan, setTujuan] = useState<string>(singleTujuan || 'Desa Pandan Indah, Kecamatan Praya Barat Daya');
  const [singlePresetId, setSinglePresetId] = useState<string>('pengawasan-baik');
  const [singleUraian, setSingleUraian] = useState<string>(() => {
    return URAIAN_PRESETS.find((p) => p.id === 'pengawasan-baik')?.text || '';
  });
  const [photoHeight, setPhotoHeight] = useState<number>(185);

  // Bulk Mode State
  const [bulkItemPresets, setBulkItemPresets] = useState<Record<string, string>>({});
  const [bulkItemUraians, setBulkItemUraians] = useState<Record<string, string>>({});
  const [activeBulkPreviewId, setActiveBulkPreviewId] = useState<string | null>(null);

  // Live stamped preview images cache for bulk items
  const [bulkStampedPreviewMap, setBulkStampedPreviewMap] = useState<Record<string, string>>({});

  // Export progress state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  // Spreadsheet import refs & status in Perjadin workspace
  const spreadsheetInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  const handleSpreadsheetFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportSpreadsheet) return;

    const ok = await onImportSpreadsheet(file);
    if (ok) {
      setSubMode('bulk');
      setImportStatusMsg('Data parameter laporan dari Excel/CSV berhasil diterapkan ke daftar.');
      setTimeout(() => setImportStatusMsg(null), 5000);
    }
  };

  // Update default values when props change
  useEffect(() => {
    if (singleDateStr) setSingleDate(singleDateStr);
  }, [singleDateStr]);

  useEffect(() => {
    if (singleTujuan) setTujuan(singleTujuan);
  }, [singleTujuan]);

  // Save profile to localStorage whenever changed
  useEffect(() => {
    savePerjadinProfile({
      nama,
      jabatan: selectedJabatan,
      customJabatan,
      asalSatker,
      nomorST,
      tanggalST,
      namaKegiatan,
    });
  }, [nama, selectedJabatan, customJabatan, asalSatker, nomorST, tanggalST, namaKegiatan]);

  // Effective Jabatan string
  const effectiveJabatan = selectedJabatan === 'Lainnya' ? customJabatan.trim() || 'Pegawai' : selectedJabatan;

  // Single mode formal date calculation
  const singleDates = useMemo(() => formatFormalIndonesianDate(singleDate), [singleDate]);

  // Handle single preset click
  const handleSelectSinglePreset = (presetId: string) => {
    setSinglePresetId(presetId);
    const found = URAIAN_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSingleUraian(found.text);
    }
  };

  // Compile Single Mode PerjadinReportItem
  const singleReportItem: PerjadinReportItem = useMemo(() => {
    return {
      id: 'single-workspace-report',
      nama,
      jabatan: effectiveJabatan,
      asalSatker,
      namaKegiatan,
      nomorST,
      tanggalST,
      tujuan,
      dateStr: singleDate,
      hariTanggal: singleDates.hariTanggal,
      tanggalSurat: singleDates.tanggalSurat,
      uraian: singleUraian,
      photoBlob: activeSinglePhotoBlob,
      photoDataUrl: activeSinglePhotoDataUrl,
      photoTargetHeight: photoHeight,
    };
  }, [
    nama,
    effectiveJabatan,
    asalSatker,
    namaKegiatan,
    nomorST,
    tanggalST,
    tujuan,
    singleDate,
    singleDates,
    singleUraian,
    activeSinglePhotoBlob,
    activeSinglePhotoDataUrl,
    photoHeight,
  ]);

  // Helper to extract clean destination string for a bulk item
  const getBulkItemTujuan = (item: BulkPhotoItem): string => {
    if (item.tujuanPerjadin && item.tujuanPerjadin.trim()) {
      return item.tujuanPerjadin.trim();
    }
    if (item.regionInfo) {
      const parts = [];
      if (item.regionInfo.nmsls) parts.push(item.regionInfo.nmsls);
      if (item.regionInfo.nmdesa) parts.push(`Desa ${item.regionInfo.nmdesa}`);
      if (item.regionInfo.nmkec) parts.push(`Kecamatan ${item.regionInfo.nmkec}`);
      return parts.join(', ');
    }
    return item.tagStr || item.locationInput || 'Wilayah Penugasan';
  };

  // Set default active bulk item for preview
  useEffect(() => {
    if (bulkItems.length > 0 && !activeBulkPreviewId) {
      setActiveBulkPreviewId(bulkItems[0].id);
    }
  }, [bulkItems, activeBulkPreviewId]);

  // Active item in Bulk mode for preview
  const activeBulkItem = useMemo(() => {
    if (!activeBulkPreviewId) return bulkItems[0] || null;
    return bulkItems.find((b) => b.id === activeBulkPreviewId) || bulkItems[0] || null;
  }, [bulkItems, activeBulkPreviewId]);

  // Dynamic preview report item for Bulk mode
  const bulkPreviewReportItem: PerjadinReportItem | null = useMemo(() => {
    if (!activeBulkItem) return null;
    const dates = formatFormalIndonesianDate(activeBulkItem.dateStr);
    const presetId = bulkItemPresets[activeBulkItem.id] || 'pengawasan-baik';
    const defaultText = URAIAN_PRESETS.find((p) => p.id === presetId)?.text || '';
    const uraian =
      bulkItemUraians[activeBulkItem.id] !== undefined
        ? bulkItemUraians[activeBulkItem.id]
        : (activeBulkItem.uraianKegiatan?.trim() || defaultText);

    const itemNama = activeBulkItem.namaPelaksanaPerjadin?.trim() || nama;
    const itemJabatan = activeBulkItem.jabatanPelaksanaPerjadin?.trim() || effectiveJabatan;
    const itemNamaKegiatan = activeBulkItem.namaKegiatanPerjadin?.trim() || namaKegiatan;
    const itemNomorST = activeBulkItem.nomorSTPerjadin?.trim() || nomorST;
    const itemTanggalST = activeBulkItem.tanggalSTPerjadin?.trim() || tanggalST;

    return {
      id: activeBulkItem.id,
      nama: itemNama,
      jabatan: itemJabatan,
      asalSatker,
      namaKegiatan: itemNamaKegiatan,
      nomorST: itemNomorST,
      tanggalST: itemTanggalST,
      tujuan: getBulkItemTujuan(activeBulkItem),
      dateStr: activeBulkItem.dateStr,
      hariTanggal: dates.hariTanggal,
      tanggalSurat: dates.tanggalSurat,
      uraian,
      photoTargetHeight: photoHeight,
    };
  }, [
    activeBulkItem,
    nama,
    effectiveJabatan,
    asalSatker,
    namaKegiatan,
    nomorST,
    tanggalST,
    bulkItemPresets,
    bulkItemUraians,
    photoHeight,
  ]);

  // Generate live stamped preview DataURL for active bulk item
  const renderItemStampedPreviewDataUrl = async (item: BulkPhotoItem): Promise<string> => {
    const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
    const offscreen = document.createElement('canvas');
    // Scale preview canvas up to max 1200px for instant rendering speed
    const scale = Math.min(1, 1200 / bitmap.width);
    const tw = Math.max(1, Math.round(bitmap.width * scale));
    const th = Math.max(1, Math.round(bitmap.height * scale));
    offscreen.width = tw;
    offscreen.height = th;

    const itemDay =
      item.dayStr?.trim() ||
      getIndonesianDayName(item.dateStr) ||
      '';

    const itemStampConfig: StampConfig = {
      ...globalStampConfig,
      dateStr: item.dateStr,
      dayStr: itemDay,
      timeStr: item.timeStr,
      coordStr: item.coordStr,
      tagStr: item.tagStr,
      customNote: item.customNote || globalStampConfig.customNote,
    };

    renderStampedCanvas(
      offscreen,
      bitmap,
      itemStampConfig,
      item.regionInfo,
      item.activeFeature,
      tw,
      th
    );

    bitmap.close();
    return offscreen.toDataURL('image/jpeg', 0.88);
  };

  // Live stamped preview effect for bulk mode
  useEffect(() => {
    if (subMode !== 'bulk' || !activeBulkItem) return;

    const cacheKey = `${activeBulkItem.id}_${activeBulkItem.dateStr}_${activeBulkItem.coordStr}_${activeBulkItem.tagStr}`;
    if (bulkStampedPreviewMap[cacheKey]) return;

    let isMounted = true;
    renderItemStampedPreviewDataUrl(activeBulkItem)
      .then((dataUrl) => {
        if (!isMounted) return;
        setBulkStampedPreviewMap((prev) => ({
          ...prev,
          [cacheKey]: dataUrl,
          [activeBulkItem.id]: dataUrl,
        }));
      })
      .catch((err) => {
        console.error('Error generating live stamped bulk preview:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [subMode, activeBulkItem, globalStampConfig]);

  // Current preview image: use stamped image with watermark for both single and bulk
  const currentPreviewImage = useMemo(() => {
    if (subMode === 'single') {
      return activeSinglePhotoDataUrl;
    }
    if (!activeBulkItem) return null;
    const cacheKey = `${activeBulkItem.id}_${activeBulkItem.dateStr}_${activeBulkItem.coordStr}_${activeBulkItem.tagStr}`;
    return bulkStampedPreviewMap[cacheKey] || bulkStampedPreviewMap[activeBulkItem.id] || activeBulkItem.thumbUrl;
  }, [subMode, activeSinglePhotoDataUrl, activeBulkItem, bulkStampedPreviewMap]);

  // Bulk item preset dropdown change handler
  const handleBulkItemPresetChange = (itemId: string, presetId: string) => {
    setBulkItemPresets((prev) => ({ ...prev, [itemId]: presetId }));
    const found = URAIAN_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setBulkItemUraians((prev) => ({ ...prev, [itemId]: found.text }));
      if (onUpdateBulkItem) {
        onUpdateBulkItem(itemId, { uraianKegiatan: found.text });
      }
    }
  };

  // Apply a preset to all bulk items
  const handleApplyPresetToAllBulk = (presetId: string) => {
    const found = URAIAN_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    const newPresets: Record<string, string> = {};
    const newUraians: Record<string, string> = {};
    for (const b of bulkItems) {
      newPresets[b.id] = presetId;
      newUraians[b.id] = found.text;
      if (onUpdateBulkItem) {
        onUpdateBulkItem(b.id, { uraianKegiatan: found.text });
      }
    }
    setBulkItemPresets(newPresets);
    setBulkItemUraians(newUraians);
  };

  // Helper to render full-resolution stamped canvas for bulk DOCX export
  const renderItemStampedCanvas = async (item: BulkPhotoItem): Promise<HTMLCanvasElement> => {
    const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
    const offscreen = document.createElement('canvas');
    offscreen.width = bitmap.width;
    offscreen.height = bitmap.height;

    const itemDay =
      item.dayStr?.trim() ||
      getIndonesianDayName(item.dateStr) ||
      '';

    const itemStampConfig: StampConfig = {
      ...globalStampConfig,
      dateStr: item.dateStr,
      dayStr: itemDay,
      timeStr: item.timeStr,
      coordStr: item.coordStr,
      tagStr: item.tagStr,
      customNote: item.customNote || globalStampConfig.customNote,
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

    bitmap.close();
    return offscreen;
  };

  // Download Single Word
  const handleDownloadSingleDocx = async () => {
    if (!nama.trim()) {
      alert('Mohon isi nama pelaksana perjalanan dinas terlebih dahulu.');
      return;
    }
    if (!namaKegiatan.trim()) {
      alert('Mohon isi perihal / nama kegiatan terlebih dahulu.');
      return;
    }

    try {
      setIsExporting(true);
      const docxBlob = await generateSinglePerjadinDocx(singleReportItem, activeSinglePhotoBlob);
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      const cleanDate = singleDate.replace(/[^0-9]/g, '');
      const cleanName = (nama || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      link.href = url;
      link.download = `Laporan_Perjadin_${cleanName}_${cleanDate}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error('Error generating docx:', err);
      alert('Terjadi kesalahan saat membuat file Word.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Combined Multi-page Bulk Word
  const handleExportBulkCombinedDocx = async () => {
    if (!nama.trim()) {
      alert('Mohon isi nama pelaksana terlebih dahulu.');
      return;
    }
    if (!namaKegiatan.trim()) {
      alert('Mohon isi perihal / nama kegiatan terlebih dahulu.');
      return;
    }

    try {
      setIsExporting(true);
      const itemsToBuild: { item: PerjadinReportItem; sourceImage?: HTMLCanvasElement }[] = [];

      for (let i = 0; i < bulkItems.length; i++) {
        const b = bulkItems[i];
        setExportProgress({
          current: i + 1,
          total: bulkItems.length,
          label: `Rendering stempel foto ${i + 1} dari ${bulkItems.length}...`,
        });
        await new Promise((r) => setTimeout(r, 10));

        const canvas = await renderItemStampedCanvas(b);
        const dates = formatFormalIndonesianDate(b.dateStr);
        const presetId = bulkItemPresets[b.id] || 'pengawasan-baik';
        const defaultText = URAIAN_PRESETS.find((p) => p.id === presetId)?.text || '';
        const uraian =
          bulkItemUraians[b.id] !== undefined
            ? bulkItemUraians[b.id]
            : (b.uraianKegiatan?.trim() || defaultText);

        const itemNama = b.namaPelaksanaPerjadin?.trim() || nama;
        const itemJabatan = b.jabatanPelaksanaPerjadin?.trim() || effectiveJabatan;
        const itemNamaKegiatan = b.namaKegiatanPerjadin?.trim() || namaKegiatan;
        const itemNomorST = b.nomorSTPerjadin?.trim() || nomorST;
        const itemTanggalST = b.tanggalSTPerjadin?.trim() || tanggalST;

        const reportData: PerjadinReportItem = {
          id: b.id,
          nama: itemNama,
          jabatan: itemJabatan,
          asalSatker,
          namaKegiatan: itemNamaKegiatan,
          nomorST: itemNomorST,
          tanggalST: itemTanggalST,
          tujuan: getBulkItemTujuan(b),
          dateStr: b.dateStr,
          hariTanggal: dates.hariTanggal,
          tanggalSurat: dates.tanggalSurat,
          uraian,
          photoTargetHeight: photoHeight,
        };

        itemsToBuild.push({
          item: reportData,
          sourceImage: canvas,
        });
      }

      setExportProgress({
        current: bulkItems.length,
        total: bulkItems.length,
        label: 'Menyusun dokumen gabungan Word (.docx)...',
      });
      await new Promise((r) => setTimeout(r, 15));

      const docxBlob = await generateBulkCombinedPerjadinDocx(itemsToBuild);
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      const cleanName = (nama || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      link.href = url;
      link.download = `Laporan_Perjadin_Gabungan_${cleanName}_${bulkItems.length}Kegiatan.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error('Error generating bulk combined docx:', err);
      alert('Terjadi kesalahan saat membuat dokumen Word gabungan.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export Bulk ZIP
  const handleExportBulkZipDocx = async () => {
    if (!nama.trim()) {
      alert('Mohon isi nama pelaksana terlebih dahulu.');
      return;
    }
    if (!namaKegiatan.trim()) {
      alert('Mohon isi perihal / nama kegiatan terlebih dahulu.');
      return;
    }

    try {
      setIsExporting(true);
      const itemsToBuild: { item: PerjadinReportItem; sourceImage?: HTMLCanvasElement }[] = [];

      for (let i = 0; i < bulkItems.length; i++) {
        const b = bulkItems[i];
        setExportProgress({
          current: i + 1,
          total: bulkItems.length,
          label: `Rendering stempel foto ${i + 1} dari ${bulkItems.length}...`,
        });
        await new Promise((r) => setTimeout(r, 10));

        const canvas = await renderItemStampedCanvas(b);
        const dates = formatFormalIndonesianDate(b.dateStr);
        const presetId = bulkItemPresets[b.id] || 'pengawasan-baik';
        const defaultText = URAIAN_PRESETS.find((p) => p.id === presetId)?.text || '';
        const uraian =
          bulkItemUraians[b.id] !== undefined
            ? bulkItemUraians[b.id]
            : (b.uraianKegiatan?.trim() || defaultText);

        const itemNama = b.namaPelaksanaPerjadin?.trim() || nama;
        const itemJabatan = b.jabatanPelaksanaPerjadin?.trim() || effectiveJabatan;
        const itemNamaKegiatan = b.namaKegiatanPerjadin?.trim() || namaKegiatan;
        const itemNomorST = b.nomorSTPerjadin?.trim() || nomorST;
        const itemTanggalST = b.tanggalSTPerjadin?.trim() || tanggalST;

        const reportData: PerjadinReportItem = {
          id: b.id,
          nama: itemNama,
          jabatan: itemJabatan,
          asalSatker,
          namaKegiatan: itemNamaKegiatan,
          nomorST: itemNomorST,
          tanggalST: itemTanggalST,
          tujuan: getBulkItemTujuan(b),
          dateStr: b.dateStr,
          hariTanggal: dates.hariTanggal,
          tanggalSurat: dates.tanggalSurat,
          uraian,
          photoTargetHeight: photoHeight,
        };

        itemsToBuild.push({
          item: reportData,
          sourceImage: canvas,
        });
      }

      setExportProgress({
        current: bulkItems.length,
        total: bulkItems.length,
        label: 'Mengemas dokumen ke dalam arsip ZIP...',
      });
      await new Promise((r) => setTimeout(r, 15));

      const zipBlob = await generateBulkZipPerjadinDocx(itemsToBuild);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      const cleanName = (nama || 'Pegawai').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      link.href = url;
      link.download = `Perjadin_Docx_Batch_${cleanName}_${bulkItems.length}Laporan.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error('Error generating bulk zip docx:', err);
      alert('Terjadi kesalahan saat membuat arsip ZIP dokumen.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const currentPreviewItem = subMode === 'single' ? singleReportItem : bulkPreviewReportItem;

  return (
    <div className="flex-1 w-full flex flex-col min-h-0 bg-zinc-950 text-zinc-100">
      {/* Hidden printable container for window.print() */}
      <div id="perjadin-print-container" className="hidden print:block">
        {currentPreviewItem && (
          <PerjadinSheetView
            item={currentPreviewItem}
            imageSrc={currentPreviewImage}
            isPrintOnly={true}
          />
        )}
      </div>

      {/* Sub-Header Toolbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SubMode Toggle: Satuan vs Massal */}
          <div className="inline-flex p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setSubMode('single')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Perjadin Satuan</span>
            </button>
            <button
              type="button"
              onClick={() => setSubMode('bulk')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subMode === 'bulk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Perjadin Massal ({bulkItems.length})</span>
            </button>
          </div>

          {/* Quick Excel Action Buttons in Toolbar (Always Visible) */}
          <div className="flex items-center gap-1.5 sm:border-l sm:border-zinc-800 sm:pl-2.5">
            {onImportSpreadsheet && (
              <>
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleSpreadsheetFileInput}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => spreadsheetInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 hover:border-emerald-500/70 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Impor parameter laporan dan stempel dari file Excel atau CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Impor Excel/CSV</span>
                </button>
              </>
            )}

            {onDownloadExcelTemplate && (
              <button
                type="button"
                onClick={onDownloadExcelTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition cursor-pointer flex items-center gap-1.5"
                title="Unduh format template Excel terpadu (Stempel + Laporan Perjadin)"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Template Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {subMode === 'single' ? (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-zinc-300" />
                <span>Cetak / PDF</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadSingleDocx}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Membuat Word...' : 'Unduh Dokumen Word (.docx)'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isExporting || bulkItems.length === 0}
                onClick={handleExportBulkZipDocx}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-medium border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <FolderArchive className="w-4 h-4 text-zinc-300" />
                <span className="hidden sm:inline">Unduh ZIP (.docx Terpisah)</span>
              </button>

              <button
                type="button"
                disabled={isExporting || bulkItems.length === 0}
                onClick={handleExportBulkCombinedDocx}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Memproses...' : 'Unduh 1 File Word Gabungan'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Alert Notification Banner */}
      {importStatusMsg && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatusMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportStatusMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 font-semibold cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-hidden">
        {/* LEFT COLUMN: Controls & Input Forms */}
        <div className="lg:col-span-5 flex flex-col space-y-4 max-h-[calc(100vh-130px)] overflow-y-auto pr-1">
          {/* Identitas Pelaksana Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200 pb-2 border-b border-zinc-800">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Identitas Pegawai
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap dan gelar"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-zinc-400 mb-1">
                  Jabatan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedJabatan}
                  onChange={(e) => setSelectedJabatan(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                >
                  {JABATAN_OPTIONS.map((jab) => (
                    <option key={jab} value={jab}>
                      {jab}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Asal Satker</label>
                <input
                  type="text"
                  value={asalSatker}
                  onChange={(e) => setAsalSatker(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {selectedJabatan === 'Lainnya' && (
              <div>
                <label className="block text-zinc-400 mb-1">Jabatan Kustom:</label>
                <input
                  type="text"
                  value={customJabatan}
                  onChange={(e) => setCustomJabatan(e.target.value)}
                  placeholder="Ketik jabatan..."
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Kegiatan & Surat Tugas Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200 pb-2 border-b border-zinc-800">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              Kegiatan & Surat Tugas
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                Nama Kegiatan / Perihal <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Nama kegiatan perjalanan dinas"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-zinc-400 mb-1">No. Surat Tugas</label>
                <input
                  type="text"
                  value={nomorST}
                  onChange={(e) => setNomorST(e.target.value)}
                  placeholder="Opsional (Kosong = ST sebelumnya)"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Tanggal ST</label>
                <input
                  type="text"
                  value={tanggalST}
                  onChange={(e) => setTanggalST(e.target.value)}
                  placeholder="Opsional (Contoh: 13 Juli 2026)"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Skenario Single Mode: Form Lokasi & Uraian Kegiatan */}
          {subMode === 'single' ? (
            <>
              {/* Lokasi & Tanggal Single */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-zinc-200 pb-2 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Tujuan & Tanggal
                  </span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    {singleDates.hariTanggal}
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Tujuan Perjalanan</label>
                  <input
                    type="text"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    placeholder="Dusun / Desa / Lokasi"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Uraian Kegiatan Single */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs">
                <div className="flex items-center justify-between text-zinc-200 font-semibold pb-1.5 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Uraian Kegiatan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {URAIAN_PRESETS.map((preset) => {
                    const isSelected = singlePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectSinglePreset(preset.id)}
                        className={`text-left px-2.5 py-1.5 rounded-xl border text-[11px] leading-tight transition cursor-pointer flex items-start gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-medium'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isSelected ? 'text-emerald-400 opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={singleUraian}
                    onChange={(e) => setSingleUraian(e.target.value)}
                    placeholder="Ketik uraian pelaksanaan..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 leading-relaxed focus:outline-hidden focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* Foto Height Sizing Slider (Preserves Aspect Ratio) */}
                <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                      Ukuran Tinggi Foto:
                    </span>
                    <span className="font-mono text-zinc-200">{photoHeight} px</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="260"
                    step="5"
                    value={photoHeight}
                    onChange={(e) => setPhotoHeight(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Skenario Bulk Mode: Dropdown Preset untuk SETIAP baris foto & Klik Box Langsung */
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Daftar Foto ({bulkItems.length})
                </span>

                {/* Import & Template buttons & Batch preset shortcut */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {onImportSpreadsheet && (
                    <>
                      <input
                        ref={spreadsheetInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleSpreadsheetFileInput}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => spreadsheetInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                        title="Impor parameter laporan dan stempel dari file Excel atau CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Impor Excel</span>
                      </button>
                    </>
                  )}

                  {onDownloadExcelTemplate && (
                    <button
                      type="button"
                      onClick={onDownloadExcelTemplate}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] border border-zinc-800 transition cursor-pointer flex items-center gap-1"
                      title="Unduh template Excel terpadu (Stempel + Laporan)"
                    >
                      <Download className="w-3 h-3" />
                      <span>Template</span>
                    </button>
                  )}

                  <select
                    onChange={(e) => {
                      if (e.target.value) handleApplyPresetToAllBulk(e.target.value);
                    }}
                    defaultValue=""
                    className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-300 text-[11px]"
                  >
                    <option value="" disabled>
                      Preset Serentak...
                    </option>
                    {URAIAN_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status message when Excel is imported */}
              {importStatusMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{importStatusMsg}</span>
                </div>
              )}

              {bulkItems.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                  <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">Belum ada foto pada antrean massal</p>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Unggah foto di Geostamp Massal terlebih dahulu, atau impor file Excel/CSV untuk memetakan parameter kegiatan.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onNavigateToStamp('bulk')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ke Geostamp Massal</span>
                    </button>
                    {onImportSpreadsheet && (
                      <button
                        type="button"
                        onClick={() => spreadsheetInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-semibold border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Impor Excel/CSV</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {bulkItems.map((item, idx) => {
                    const dates = formatFormalIndonesianDate(item.dateStr);
                    const currentPresetId = bulkItemPresets[item.id] || 'pengawasan-baik';
                    const defaultText = URAIAN_PRESETS.find((p) => p.id === currentPresetId)?.text || '';
                    const customText =
                      bulkItemUraians[item.id] !== undefined
                        ? bulkItemUraians[item.id]
                        : (item.uraianKegiatan?.trim() || defaultText);
                    const isActive = activeBulkPreviewId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveBulkPreviewId(item.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900 border-emerald-500/70 ring-1 ring-emerald-500/30 shadow-md shadow-emerald-950/30'
                            : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-zinc-500 text-[11px] shrink-0">#{idx + 1}</span>
                            {item.thumbUrl && (
                              <img
                                src={item.thumbUrl}
                                alt=""
                                className="w-9 h-9 rounded-md object-cover border border-zinc-800 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-zinc-200 text-[11px] flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                                {dates.hariTanggal}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate max-w-[210px]">
                                {getBulkItemTujuan(item)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 shrink-0 justify-end">
                            {item.uraianKegiatan && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                title="Uraian kegiatan diimpor dari Excel"
                              >
                                Excel
                              </span>
                            )}
                            {item.nomorSTPerjadin && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                title={`ST Khusus: ${item.nomorSTPerjadin}`}
                              >
                                ST
                              </span>
                            )}
                            {item.namaPelaksanaPerjadin && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                title={`Pelaksana: ${item.namaPelaksanaPerjadin}`}
                              >
                                {item.namaPelaksanaPerjadin.split(' ')[0]}
                              </span>
                            )}
                            {/* Active badge */}
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Dipratinjau
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tujuan Perjalanan Input (Inline edit) */}
                        <div
                          className="pt-1.5 pb-1 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBulkPreviewId(item.id);
                          }}
                        >
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="shrink-0 text-zinc-400 text-[10px]">Tujuan:</span>
                          <input
                            type="text"
                            value={item.tujuanPerjadin ?? ''}
                            placeholder={getBulkItemTujuan(item)}
                            onChange={(e) => {
                              if (onUpdateBulkItem) {
                                onUpdateBulkItem(item.id, { tujuanPerjadin: e.target.value });
                              }
                            }}
                            className="flex-1 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-200 text-[10.5px] focus:outline-hidden focus:border-emerald-500"
                            title="Tujuan perjalanan spesifik untuk laporan Word"
                          />
                        </div>

                        {/* Dropdown Preset & Textarea per baris */}
                        <div
                          className="space-y-1.5 pt-1"
                          onClick={() => {
                            setActiveBulkPreviewId(item.id);
                          }}
                        >
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Preset Narasi:</span>
                            <select
                              value={currentPresetId}
                              onChange={(e) => {
                                handleBulkItemPresetChange(item.id, e.target.value);
                              }}
                              className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] focus:outline-hidden focus:border-emerald-500"
                            >
                              {URAIAN_PRESETS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            rows={2}
                            value={customText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkItemUraians((prev) => ({ ...prev, [item.id]: val }));
                              if (onUpdateBulkItem) {
                                onUpdateBulkItem(item.id, { uraianKegiatan: val });
                              }
                            }}
                            placeholder="Ketik narasi laporan ini..."
                            className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator during Export */}
          {isExporting && exportProgress && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 animate-spin" />
                  {exportProgress.label}
                </span>
                <span className="text-zinc-400 font-mono">
                  {exportProgress.current} / {exportProgress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{
                    width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real A4 Interactive Preview with Zoom Controls */}
        <div className="lg:col-span-7 h-[calc(100vh-130px)] min-h-[500px] flex flex-col">
          {currentPreviewItem ? (
            <PerjadinA4Preview
              item={currentPreviewItem}
              imageSrc={currentPreviewImage}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-center">
              <FileText className="w-12 h-12 mb-3 text-zinc-600" />
              <p className="text-sm font-medium">Belum ada dokumen yang dipilih</p>
              <p className="text-xs text-zinc-500 mt-1">
                Pilih foto atau kembali ke Geostamp untuk memuat foto lapangan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
