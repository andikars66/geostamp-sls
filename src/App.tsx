import { useNotice } from './useNotice';
import { assignPhotos } from './photoAssignment';
import { createSpreadsheetDrafts } from './bulkUtils';
import { buildLocationOptions } from './locationSearch';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  MapPin,
  Calendar,
  Clock,
  Search,
  Sliders,
  Compass,
  X,
  Shuffle,
  FileSpreadsheet,
  FolderArchive,
  Plus,
  Trash2,
  CopyCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Images,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { PerjadinWorkspace } from './components/PerjadinWorkspace';
import type {
  BoundaryFeature,
  BulkPhotoItem,
  HierarchyPayload,
  SelectedRegionInfo,
  StampConfig,
  StampPosition,
} from './types';
import {
  filterCandidateFeatures,
  getDescendingWorkdayDates,
  getIndonesianDayName,
  getRandomWorkingTime,
  getTodayDateString,
  loadKecamatanBoundaries,
  sampleRandomPointInFeatures,
  toIsoDateValue,
  toIsoTimeValue,
} from './spatial';
import { createSamplePlaceholderCanvas, renderStampedCanvas } from './canvasStamper';
import {
  applyParsedRowsToBulkItems,
  createThumbnailFromFile,
  downloadBulkExcelTemplate,
  exportBulkPhotosToZip,
  parseBulkSpreadsheetFile,
  resolveAndSampleBulkItem,
} from './bulkUtils';

interface SearchIndexEntry {
  id: string;
  label: string;
  sublabel: string;
  searchText: string;
  kdkec: string;
  iddesa: string;
  idsls: string;
  idsubsls: string;
}

export default function App() {
  // Mode Toggle: 'single' (Default per AGENTS.md) | 'bulk' | 'perjadin'
  const [appMode, setAppMode] = useState<'single' | 'bulk' | 'perjadin'>('perjadin');
  const [perjadinInitialSubMode, setPerjadinInitialSubMode] = useState<'single' | 'bulk'>('single');

  // 1. Spatial Hierarchy Data State
  const [hierarchy, setHierarchy] = useState<HierarchyPayload | null>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(true);
  const [loadingBoundary, setLoadingBoundary] = useState<boolean>(false);
  const {message:errorMsg,setMessage:notifyError,restart:restartError}=useNotice();
  const setErrorMsg=useCallback((text:string|null)=>notifyError(text,'error'),[notifyError]);

  // 2. Single Mode: Hierarchical Filter State (Kecamatan -> Desa -> SLS -> SubSLS)
  const [selectedKdkec, setSelectedKdkec] = useState<string>('');
  const [selectedIddesa, setSelectedIddesa] = useState<string>('');
  const [selectedIdsls, setSelectedIdsls] = useState<string>('');
  const [selectedIdsubsls, setSelectedIdsubsls] = useState<string>('');

  // Quick Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // 3. Single Mode: Active Sampled Geotag State
  const [regionInfo, setRegionInfo] = useState<SelectedRegionInfo | null>(null);
  const [activeFeature, setActiveFeature] = useState<BoundaryFeature | null>(null);

  // 4. Stamp Configuration State (Shared style settings + Single mode values)
  const [config, setConfig] = useState<StampConfig>(() => {
    const today = getTodayDateString();
    return {
      dateStr: today,
      dayStr: getIndonesianDayName(today) || 'Rabu',
      timeStr: getRandomWorkingTime(),
      timezoneLabel: 'WITA',
      coordStr: '',
      tagStr: '',
      fontScale: 1.0,
      scrimOpacity: 0.68,
      position: 'bottom-left',
      showMiniMap: true,
      customNote: '',
    };
  });

  // 5. Single Mode Image & Canvas State
  const [uploadedImage, setUploadedImage] = useState<ImageBitmap | HTMLCanvasElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 1600,
    height: 1200,
  });
  const [isSampleImage, setIsSampleImage] = useState<boolean>(true);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // 6. Bulk Mode State (Memory-safe: stores File reference + tiny thumbUrl)
  const [bulkItems, setBulkItems] = useState<BulkPhotoItem[]>([]);
  const [activeBulkId, setActiveBulkId] = useState<string | null>(null);
  const [activeBulkBitmap, setActiveBulkBitmap] = useState<ImageBitmap | null>(null);
  const [bulkRowSuggestId, setBulkRowSuggestId] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState<{
    active: boolean;
    current: number;
    total: number;
    fileName: string;
  }>({ active: false, current: 0, total: 0, fileName: '' });

  // 7. Laporan Perjalanan Dinas (Perjadin) State
  const [currentStampedBlob, setCurrentStampedBlob] = useState<Blob | null>(null);
  const [currentStampedDataUrl, setCurrentStampedDataUrl] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bulkFilesInputRef = useRef<HTMLInputElement | null>(null);
  const replaceActiveBulkInputRef = useRef<HTMLInputElement | null>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const timePickerRef = useRef<HTMLInputElement | null>(null);

  // Initialize default sample canvas & load hierarchy.json on mount
  useEffect(() => {
    const sampleCanvas = createSamplePlaceholderCanvas();
    setUploadedImage(sampleCanvas as any);
    setImageDimensions({ width: sampleCanvas.width, height: sampleCanvas.height });

    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    fetch(`${cleanBase}data/hierarchy.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat daftar wilayah');
        return res.json();
      })
      .then((data: HierarchyPayload) => {
        setHierarchy(data);
        setLoadingHierarchy(false);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data wilayah');
        setLoadingHierarchy(false);
      });
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build flat search index from hierarchy for instant autocomplete
  const searchIndex = useMemo<SearchIndexEntry[]>(() => {
    if (!hierarchy) return [];
    const list: SearchIndexEntry[] = [];
    for (const kec of hierarchy.kecamatan) {
      for (const desa of kec.desa) {
        for (const sls of desa.sls) {
          for (const sub of sls.subsls) {
            list.push({
              id: sub.idsubsls,
              label: `${sls.nmsls}, ${desa.nmdesa}`,
              sublabel: `${sub.idsubsls} • ${kec.nmkec}`,
              searchText: `${sub.idsubsls} ${sls.nmsls} ${desa.nmdesa} ${kec.nmkec} ${sub.kdsubsls}`.toLowerCase(),
              kdkec: kec.kdkec,
              iddesa: desa.iddesa,
              idsls: sls.idsls,
              idsubsls: sub.idsubsls,
            });
          }
        }
      }
    }
    return list;
  }, [hierarchy]);

  const reportLocationOptions = useMemo(() => buildLocationOptions(hierarchy), [hierarchy]);

  // Filtered quick search results (Single Mode)
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    const matches: SearchIndexEntry[] = [];
    for (let i = 0; i < searchIndex.length; i++) {
      const item = searchIndex[i];
      if (tokens.every((t) => item.searchText.includes(t))) {
        matches.push(item);
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }, [searchIndex, searchQuery]);

  // Derived lists for cascading dropdowns
  const currentKecObj = useMemo(
    () => hierarchy?.kecamatan.find((k) => k.kdkec === selectedKdkec) ?? null,
    [hierarchy, selectedKdkec]
  );
  const currentDesaList = useMemo(() => currentKecObj?.desa ?? [], [currentKecObj]);
  const currentDesaObj = useMemo(
    () => currentDesaList.find((d) => d.iddesa === selectedIddesa) ?? null,
    [currentDesaList, selectedIddesa]
  );
  const currentSlsList = useMemo(() => currentDesaObj?.sls ?? [], [currentDesaObj]);
  const currentSlsObj = useMemo(
    () => currentSlsList.find((s) => s.idsls === selectedIdsls) ?? null,
    [currentSlsList, selectedIdsls]
  );
  const currentSubslsList = useMemo(() => currentSlsObj?.subsls ?? [], [currentSlsObj]);

  // Currently selected bulk item
  const activeBulkItem = useMemo(
    () => bulkItems.find((it) => it.id === activeBulkId) ?? bulkItems[0] ?? null,
    [bulkItems, activeBulkId]
  );

  // Decode ONLY the single currently selected bulk item for Live Preview (Memory Safety Rule 3.2)
  useEffect(() => {
    if (appMode !== 'bulk' || !activeBulkItem || activeBulkItem.photoMissing) {
      setActiveBulkBitmap((prev) => {
        if (prev) prev.close();
        return null;
      });
      return;
    }

    let cancelled = false;
    createImageBitmap(activeBulkItem.file, { imageOrientation: 'from-image' })
      .then((bmp) => {
        if (cancelled) {
          bmp.close();
          return;
        }
        setActiveBulkBitmap((prev) => {
          if (prev) prev.close();
          return bmp;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appMode, activeBulkItem?.id, activeBulkItem?.file]);

  // Single Mode: Reactive Geotagging Sampling whenever region selection changes
  const computeRandomGeotag = useCallback(
    async (kdkec: string, iddesa: string, idsls: string, idsubsls: string) => {
      if (!kdkec) {
        setRegionInfo(null);
        setActiveFeature(null);
        return;
      }

      try {
        setLoadingBoundary(true);
        setErrorMsg(null);
        const boundaryCollection = await loadKecamatanBoundaries(kdkec);
        const candidates = filterCandidateFeatures(boundaryCollection, {
          kdkec,
          iddesa: iddesa || undefined,
          idsls: idsls || undefined,
          idsubsls: idsubsls || undefined,
        });

        if (candidates.length === 0) {
          setRegionInfo(null);
          setActiveFeature(null);
          setLoadingBoundary(false);
          return;
        }

        const { lat, lng, feature } = sampleRandomPointInFeatures(candidates);
        const props = feature.properties;

        const level: SelectedRegionInfo['level'] = idsubsls
          ? 'subsls'
          : idsls
          ? 'sls'
          : iddesa
          ? 'desa'
          : 'kecamatan';

        const newRegion: SelectedRegionInfo = {
          level,
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
        const autoTagStr = `${idTag} • ${locParts.join(', ')}`;
        const autoCoordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        setActiveFeature(feature);
        setRegionInfo(newRegion);
        setConfig((prev) => ({
          ...prev,
          coordStr: autoCoordStr,
          tagStr: autoTagStr,
        }));
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat koordinat wilayah');
      } finally {
        setLoadingBoundary(false);
      }
    },
    []
  );

  useEffect(() => {
    computeRandomGeotag(selectedKdkec, selectedIddesa, selectedIdsls, selectedIdsubsls);
  }, [selectedKdkec, selectedIddesa, selectedIdsls, selectedIdsubsls, computeRandomGeotag]);

  // Reactive Canvas Rendering (Supports both Single Mode and active photo in Bulk Mode)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const sourceImg =
      appMode === 'bulk' && activeBulkBitmap ? activeBulkBitmap : uploadedImage;
    if (!sourceImg) return;

    const maxPreviewDim = 1920;
    const scale =
      Math.max(sourceImg.width, sourceImg.height) > maxPreviewDim
        ? maxPreviewDim / Math.max(sourceImg.width, sourceImg.height)
        : 1;

    const previewW = Math.round(sourceImg.width * scale);
    const previewH = Math.round(sourceImg.height * scale);

    if (appMode === 'bulk' && activeBulkItem) {
      const itemDay =
        activeBulkItem.dayStr?.trim() ||
        getIndonesianDayName(activeBulkItem.dateStr) ||
        '';
      const bulkPreviewConfig: StampConfig = {
        ...config,
        dateStr: activeBulkItem.dateStr,
        dayStr: itemDay,
        timeStr: activeBulkItem.timeStr,
        coordStr: activeBulkItem.coordStr,
        tagStr: activeBulkItem.tagStr,
        customNote: activeBulkItem.customNote || config.customNote,
      };
      renderStampedCanvas(
        canvas,
        sourceImg as any,
        bulkPreviewConfig,
        activeBulkItem.regionInfo,
        activeBulkItem.activeFeature,
        previewW,
        previewH
      );
    } else {
      renderStampedCanvas(
        canvas,
        sourceImg as any,
        config,
        regionInfo,
        activeFeature,
        previewW,
        previewH
      );
    }
  }, [
    appMode,
    uploadedImage,
    activeBulkBitmap,
    activeBulkItem,
    config,
    regionInfo,
    activeFeature,
  ]);

  // Handle Single Photo File Selection
  const handleSingleFileLoaded = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file tidak didukung. Harap pilih foto (.jpg, .png, .webp).');
      return;
    }

    try {
      setErrorMsg(null);
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      setUploadedImage(bitmap);
      setUploadedFileName(file.name);
      setImageDimensions({ width: bitmap.width, height: bitmap.height });
      setIsSampleImage(false);
    } catch {
      setErrorMsg('Gagal membaca file gambar.');
    }
  };

  // Handle Adding Multiple Photos to Bulk Queue
  const handleAddBulkFiles = async (fileList: FileList | File[], stampEnabled = true, previewId?: string) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setErrorMsg('Tidak ada file gambar valid yang dipilih.');
      return;
    }

    setErrorMsg(null);
    const defaultLoc =
      selectedIdsubsls ||
      currentSlsObj?.nmsls ||
      currentDesaObj?.nmdesa ||
      currentKecObj?.nmkec ||
      '';

    const newItems: BulkPhotoItem[] = [];
    // Generate distinct descending working dates (Monday-Friday) for all added photos
    const workdayDates = getDescendingWorkdayDates(files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { thumbUrl, width, height } = await createThumbnailFromFile(file);
        const itemDate = getTodayDateString();
        const draft: BulkPhotoItem = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          file,
          fileName: file.name,
          stampEnabled,
          thumbUrl,
          width,
          height,
          dateStr: itemDate,
          dayStr: getIndonesianDayName(itemDate),
          timeStr: getRandomWorkingTime(),
          locationInput: defaultLoc,
          matchStatus: 'empty',
          resolvedTarget: null,
          regionInfo: null,
          activeFeature: null,
          coordStr: '',
          tagStr: '',
          customNote: '',
        };
        const resolved = await resolveAndSampleBulkItem(draft, hierarchy);
        newItems.push(resolved);
      } catch {
        // Skip unreadable image file
      }
    }

    if (newItems.length > 0) {
      setBulkItems((prev) => {
        const assignment = assignPhotos(prev, newItems, previewId || prev[0]?.id);
        assignment.replacedUrls.forEach(url => URL.revokeObjectURL(url));
        const updated = assignment.items;
        if (!activeBulkId && updated.length > 0) {
          setActiveBulkId(updated[0].id);
        }
        return updated;
      });
    }
  };

  // Replace only the currently active photo in Bulk Mode without losing its metadata (date, time, location)
  const handleReplaceActiveBulkFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file tidak didukung. Harap pilih foto (.jpg, .png, .webp).');
      return;
    }
    if (!activeBulkItem) {
      handleAddBulkFiles([file]);
      return;
    }

    try {
      setErrorMsg(null);
      const { thumbUrl, width, height } = await createThumbnailFromFile(file);
      if (activeBulkItem.thumbUrl) {
        URL.revokeObjectURL(activeBulkItem.thumbUrl);
      }
      setBulkItems((prev) =>
        prev.map((it) =>
          it.id === activeBulkItem.id
            ? {
                ...it,
                file,
                fileName: file.name,
                thumbUrl,
                width,
                height,
              }
            : it
        )
      );
    } catch {
      setErrorMsg('Gagal membaca foto pengganti.');
    }
  };

  const handleReplaceFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReplaceActiveBulkFile(file);
    }
    e.target.value = '';
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (appMode === 'bulk' || files.length > 1) {
      if (appMode !== 'bulk') setAppMode('bulk');
      handleAddBulkFiles(files);
    } else {
      handleSingleFileLoaded(files[0]);
    }
    e.target.value = '';
  };

  const handleBulkFilesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleAddBulkFiles(files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (appMode === 'bulk') {
      if (files.length === 1 && activeBulkItem) {
        // Dragging a single photo onto the preview replaces the currently active photo
        handleReplaceActiveBulkFile(files[0]);
      } else {
        handleAddBulkFiles(files);
      }
    } else {
      if (files.length > 1) {
        setAppMode('bulk');
        handleAddBulkFiles(files);
      } else {
        handleSingleFileLoaded(files[0]);
      }
    }
  };

  // Update a field on a specific BulkPhotoItem row
  const handleUpdateBulkRow = async (
    id: string,
    patch: Partial<BulkPhotoItem>,
    reResolveLocation = false
  ) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch, ...(reResolveLocation ? { regionInfo: null, activeFeature: null, coordStr: '', tagStr: '', resolvedTarget: null, matchStatus: 'empty' as const } : {}) } : item))
    );

    if (reResolveLocation) {
      const targetItem = bulkItems.find((it) => it.id === id);
      if (!targetItem) return;
      const merged = { ...targetItem, ...patch };
      const resolved = await resolveAndSampleBulkItem(merged, hierarchy);
      setBulkItems((prev) =>
        prev.map((item) => (item.id === id && item.locationInput === merged.locationInput ? { ...item, regionInfo: resolved.regionInfo, activeFeature: resolved.activeFeature, coordStr: resolved.coordStr, tagStr: resolved.tagStr, resolvedTarget: resolved.resolvedTarget, matchStatus: resolved.matchStatus } : item))
      );
    }
  };

  // Reshuffle random coordinate or time for a single bulk row
  const handleReshuffleBulkRow = async (id: string) => {
    const targetItem = bulkItems.find((it) => it.id === id);
    if (!targetItem) return;
    const withNewTime = { ...targetItem, timeStr: getRandomWorkingTime() };
    const resolved = await resolveAndSampleBulkItem(withNewTime, hierarchy, false);
    setBulkItems((prev) => prev.map((it) => (it.id === id ? resolved : it)));
  };

  // Reshuffle all bulk rows (new random natural time + new random point inside each row's polygon)
  const handleReshuffleAllBulk = async () => {
    const updated: BulkPhotoItem[] = [];
    for (const item of bulkItems) {
      const nextItem = { ...item, timeStr: getRandomWorkingTime() };
      const resolved = await resolveAndSampleBulkItem(nextItem, hierarchy, false);
      updated.push(resolved);
    }
    setBulkItems(updated);
  };

  // Apply first row's Date or Location to all rows below (Quick Fill-Down)
  const handleFillDownBulk = async (field: 'date' | 'location') => {
    if (bulkItems.length < 2) return;
    const sourceRow = activeBulkItem || bulkItems[0];

    if (field === 'date') {
      const sourceDay = sourceRow.dayStr || getIndonesianDayName(sourceRow.dateStr);
      setBulkItems((prev) =>
        prev.map((item) => ({
          ...item,
          dateStr: sourceRow.dateStr,
          dayStr: sourceDay,
        }))
      );
    } else if (field === 'location') {
      const updated: BulkPhotoItem[] = [];
      for (const item of bulkItems) {
        const draft = { ...item, locationInput: sourceRow.locationInput };
        const resolved = await resolveAndSampleBulkItem(draft, hierarchy, false);
        updated.push(resolved);
      }
      setBulkItems(updated);
    }
  };

  // Handle Excel / CSV Spreadsheet Upload & Smart Matching
  const handleProcessSpreadsheetFile = async (file: File): Promise<boolean> => {
    try {
      setErrorMsg(null);
      const rows = await parseBulkSpreadsheetFile(file);
      if (rows.length === 0) {
        setErrorMsg('File Excel/CSV kosong atau kolom tidak dikenali.');
        return false;
      }

      if (bulkItems.length === 0) {
        const drafts = await createSpreadsheetDrafts(rows, hierarchy);
        setBulkItems(drafts);
        return true;
      }

      const updated = await applyParsedRowsToBulkItems(rows, bulkItems, hierarchy);
      setBulkItems(updated);
      return true;
    } catch {
      setErrorMsg('Gagal membaca file Excel/CSV. Pastikan format .xlsx atau .csv valid.');
      return false;
    }
  };

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await handleProcessSpreadsheetFile(file);
  };

  // Remove a photo from Bulk Queue and free its thumbnail ObjectURL
  const handleRemoveBulkItem = (id: string) => {
    setBulkItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.thumbUrl) URL.revokeObjectURL(target.thumbUrl);
      const remaining = prev.filter((it) => it.id !== id);
      if (activeBulkId === id) {
        setActiveBulkId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const handleClearAllBulk = () => {
    bulkItems.forEach((it) => {
      if (it.thumbUrl) URL.revokeObjectURL(it.thumbUrl);
    });
    setBulkItems([]);
    setActiveBulkId(null);
  };

  // Export all bulk photos as a ZIP archive
  const handleDownloadBulkZip = async () => {
    if (bulkItems.length === 0 || zipProgress.active) return;
    try {
      setErrorMsg(null);
      setZipProgress({
        active: true,
        current: 0,
        total: bulkItems.length,
        fileName: '',
      });
      await exportBulkPhotosToZip(bulkItems, config, (current, total, fileName) => {
        setZipProgress({ active: true, current, total, fileName });
      });
    } catch {
      setErrorMsg('Gagal membuat arsip ZIP.');
    } finally {
      setZipProgress({ active: false, current: 0, total: 0, fileName: '' });
    }
  };

  const handleSelectSearchItem = (item: SearchIndexEntry) => {
    setSelectedKdkec(item.kdkec);
    setSelectedIddesa(item.iddesa);
    setSelectedIdsls(item.idsls);
    setSelectedIdsubsls(item.idsubsls);
    setSearchQuery(`${item.idsubsls} — ${item.label}`);
    setIsSearchOpen(false);
  };

  const handleShuffleCoordinate = () => {
    if (selectedKdkec) {
      computeRandomGeotag(selectedKdkec, selectedIddesa, selectedIdsls, selectedIdsubsls);
    }
  };

  const handleShuffleTime = () => {
    setConfig((prev) => ({
      ...prev,
      timeStr: getRandomWorkingTime(),
    }));
  };

  // Download single photo (or currently previewed bulk photo)
  const handleDownloadSingleImage = () => {
    const sourceImg =
      appMode === 'bulk' && activeBulkBitmap ? activeBulkBitmap : uploadedImage;
    if (!sourceImg) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceImg.width;
    exportCanvas.height = sourceImg.height;

    if (appMode === 'bulk' && activeBulkItem) {
      const itemDay =
        activeBulkItem.dayStr?.trim() ||
        getIndonesianDayName(activeBulkItem.dateStr) ||
        '';
      const bulkExportConfig: StampConfig = {
        ...config,
        dateStr: activeBulkItem.dateStr,
        dayStr: itemDay,
        timeStr: activeBulkItem.timeStr,
        coordStr: activeBulkItem.coordStr,
        tagStr: activeBulkItem.tagStr,
        customNote: activeBulkItem.customNote || config.customNote,
      };
      renderStampedCanvas(
        exportCanvas,
        sourceImg as any,
        bulkExportConfig,
        activeBulkItem.regionInfo,
        activeBulkItem.activeFeature,
        sourceImg.width,
        sourceImg.height
      );
    } else {
      renderStampedCanvas(
        exportCanvas,
        sourceImg as any,
        config,
        regionInfo,
        activeFeature,
        sourceImg.width,
        sourceImg.height
      );
    }

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const idTag =
          appMode === 'bulk'
            ? activeBulkItem?.regionInfo?.idsubsls || 'SLS'
            : regionInfo?.idsubsls || '5202';
        const dStr = appMode === 'bulk' ? activeBulkItem?.dateStr || '' : config.dateStr;
        const tStr = appMode === 'bulk' ? activeBulkItem?.timeStr || '' : config.timeStr;
        const cleanDate = dStr.replace(/[^0-9]/g, '');
        const cleanTime = tStr.replace(/[^0-9]/g, '');
        link.href = url;
        link.download = `STAMP_${idTag}_${cleanDate}_${cleanTime}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      },
      'image/jpeg',
      0.94
    );
  };

  // Helper to render current active stamped canvas into Blob and DataURL
  const prepareSingleStampedImage = () => {
    const sourceImg =
      appMode === 'bulk' && activeBulkBitmap ? activeBulkBitmap : uploadedImage;
    if (!sourceImg) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceImg.width;
    exportCanvas.height = sourceImg.height;

    if (appMode === 'bulk' && activeBulkItem) {
      const itemDay =
        activeBulkItem.dayStr?.trim() ||
        getIndonesianDayName(activeBulkItem.dateStr) ||
        '';
      const bulkExportConfig: StampConfig = {
        ...config,
        dateStr: activeBulkItem.dateStr,
        dayStr: itemDay,
        timeStr: activeBulkItem.timeStr,
        coordStr: activeBulkItem.coordStr,
        tagStr: activeBulkItem.tagStr,
        customNote: activeBulkItem.customNote || config.customNote,
      };
      renderStampedCanvas(
        exportCanvas,
        sourceImg as any,
        bulkExportConfig,
        activeBulkItem.regionInfo,
        activeBulkItem.activeFeature,
        sourceImg.width,
        sourceImg.height
      );
    } else {
      renderStampedCanvas(
        exportCanvas,
        sourceImg as any,
        config,
        regionInfo,
        activeFeature,
        sourceImg.width,
        sourceImg.height
      );
    }

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCurrentStampedBlob(blob);
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
        setCurrentStampedDataUrl(dataUrl);
      },
      'image/jpeg',
      0.90
    );
  };

  // Open Perjadin Workspace in Single SubMode
  const handleOpenSinglePerjadin = () => {
    prepareSingleStampedImage();
    setPerjadinInitialSubMode('single');
    setAppMode('perjadin');
  };

  // Open Perjadin Workspace in Bulk SubMode
  const handleOpenBulkPerjadin = () => {
    prepareSingleStampedImage();
    setPerjadinInitialSubMode('bulk');
    setAppMode('perjadin');
  };

  const effectiveSingleDateStr =
    appMode === 'bulk' && activeBulkItem ? activeBulkItem.dateStr : config.dateStr;

  const effectiveSingleTujuan = useMemo(() => {
    if (appMode === 'bulk' && activeBulkItem) {
      if (activeBulkItem.regionInfo) {
        const parts = [];
        if (activeBulkItem.regionInfo.nmsls) parts.push(activeBulkItem.regionInfo.nmsls);
        if (activeBulkItem.regionInfo.nmdesa) parts.push(`Desa ${activeBulkItem.regionInfo.nmdesa}`);
        if (activeBulkItem.regionInfo.nmkec) parts.push(`Kecamatan ${activeBulkItem.regionInfo.nmkec}`);
        return parts.join(', ');
      }
      return activeBulkItem.tagStr || activeBulkItem.locationInput || 'Wilayah Penugasan';
    }

    if (regionInfo) {
      const parts = [];
      if (regionInfo.nmsls) parts.push(regionInfo.nmsls);
      if (regionInfo.nmdesa) parts.push(`Desa ${regionInfo.nmdesa}`);
      if (regionInfo.nmkec) parts.push(`Kecamatan ${regionInfo.nmkec}`);
      return parts.join(', ');
    }
    return config.tagStr || 'Wilayah Penugasan';
  }, [appMode, activeBulkItem, regionInfo, config.tagStr]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={appMode === 'bulk'}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={bulkFilesInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleBulkFilesInputChange}
        className="hidden"
      />
      <input
        ref={replaceActiveBulkInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleReplaceFileInputChange}
        className="hidden"
      />
      <input
        ref={spreadsheetInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleSpreadsheetUpload}
        className="hidden"
      />

      {/* Main Workspace (Conditional: Perjadin Workspace vs Geostamp Workspace) */}
      {appMode === 'perjadin' ? (
        <PerjadinWorkspace
          onReplacePhoto={async (id, file) => {
            const thumbnail = await createThumbnailFromFile(file);
            const previous = bulkItems.find(item => item.id === id);
            setBulkItems(items => items.map(item => item.id === id ? { ...item, file, fileName: file.name, ...thumbnail, photoMissing: false } : item));
            if (previous) URL.revokeObjectURL(previous.thumbUrl);
          }}
          locationOptions={reportLocationOptions}
          onRemovePhotos={(ids) => {
            bulkItems.filter(item => ids.includes(item.id)).forEach(item => URL.revokeObjectURL(item.thumbUrl));
            setBulkItems(prev => prev.filter(item => !ids.includes(item.id)));
            if (activeBulkId && ids.includes(activeBulkId)) setActiveBulkId(null);
          }}
          onAddPhotos={handleAddBulkFiles}
          activeSinglePhotoBlob={currentStampedBlob}
          activeSinglePhotoDataUrl={currentStampedDataUrl}
          singleDateStr={effectiveSingleDateStr}
          singleTujuan={effectiveSingleTujuan}
          bulkItems={bulkItems}
          globalStampConfig={config}
          initialSubMode={perjadinInitialSubMode}
          onNavigateToStamp={(targetMode) => setAppMode(targetMode)}
          onImportSpreadsheet={handleProcessSpreadsheetFile}
          onDownloadExcelTemplate={() => downloadBulkExcelTemplate(bulkItems)}
          onUpdateBulkItem={handleUpdateBulkRow}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <aside
          className={`${
            appMode === 'bulk'
              ? 'lg:col-span-7 xl:col-span-7'
              : 'lg:col-span-5 xl:col-span-4'
          } flex flex-col gap-5`}
        >
          {errorMsg && (
            <div onClick={restartError} role="alert" className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {appMode === 'single' ? (
            /* ================= SINGLE MODE CONTROLS ================= */
            <>
              {/* CARD 1: WILAYAH & GEOTAG */}
              <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold">Wilayah & Geotag</h2>
                  </div>
                  {(selectedKdkec || config.coordStr || config.tagStr) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKdkec('');
                        setSelectedIddesa('');
                        setSelectedIdsls('');
                        setSelectedIdsubsls('');
                        setSearchQuery('');
                        setConfig((prev) => ({ ...prev, coordStr: '', tagStr: '' }));
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Quick Search Autocomplete */}
                <div ref={searchContainerRef} className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setIsSearchOpen(true)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      placeholder="Cari nama SLS, desa, atau kode ID..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/70 transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isSearchOpen && filteredSearchResults.length > 0 && (
                    <div className="absolute z-40 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl divide-y divide-zinc-800/60">
                      {filteredSearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSearchItem(item)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-800/70 transition flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span className="text-xs font-medium text-zinc-100">
                            {item.label}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {item.sublabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cascading Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Kecamatan</label>
                    <select
                      value={selectedKdkec}
                      disabled={loadingHierarchy}
                      onChange={(e) => {
                        setSelectedKdkec(e.target.value);
                        setSelectedIddesa('');
                        setSelectedIdsls('');
                        setSelectedIdsubsls('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/70 transition"
                    >
                      <option value="">Pilih Kecamatan</option>
                      {hierarchy?.kecamatan.map((k) => (
                        <option key={k.kdkec} value={k.kdkec}>
                          {k.nmkec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Desa</label>
                    <select
                      value={selectedIddesa}
                      disabled={!selectedKdkec}
                      onChange={(e) => {
                        setSelectedIddesa(e.target.value);
                        setSelectedIdsls('');
                        setSelectedIdsubsls('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 disabled:opacity-40 focus:outline-none focus:border-emerald-500/70 transition"
                    >
                      <option value="">Semua Desa</option>
                      {currentDesaList.map((d) => (
                        <option key={d.iddesa} value={d.iddesa}>
                          {d.nmdesa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">SLS / Dusun</label>
                    <select
                      value={selectedIdsls}
                      disabled={!selectedIddesa}
                      onChange={(e) => {
                        const newIdsls = e.target.value;
                        setSelectedIdsls(newIdsls);
                        const slsObj = currentSlsList.find((s) => s.idsls === newIdsls);
                        if (slsObj && slsObj.subsls.length === 1) {
                          setSelectedIdsubsls(slsObj.subsls[0].idsubsls);
                        } else {
                          setSelectedIdsubsls('');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 disabled:opacity-40 focus:outline-none focus:border-emerald-500/70 transition"
                    >
                      <option value="">Semua SLS</option>
                      {currentSlsList.map((s) => (
                        <option key={s.idsls} value={s.idsls}>
                          {s.nmsls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">ID Sub-SLS</label>
                    <select
                      value={selectedIdsubsls}
                      disabled={!selectedIdsls}
                      onChange={(e) => setSelectedIdsubsls(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 disabled:opacity-40 focus:outline-none focus:border-emerald-500/70 transition"
                    >
                      <option value="">Semua Sub-SLS</option>
                      {currentSubslsList.map((sub) => (
                        <option key={sub.idsubsls} value={sub.idsubsls}>
                          {sub.idsubsls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Typable Coordinate Input */}
                <div className="pt-2 border-t border-zinc-800/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-zinc-400">Koordinat (Lat, Long)</label>
                    <button
                      type="button"
                      disabled={!selectedKdkec || loadingBoundary}
                      onClick={handleShuffleCoordinate}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingBoundary ? 'animate-spin' : ''}`} />
                      <span>Acak Titik</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.coordStr}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, coordStr: e.target.value }))
                    }
                    placeholder="-8.672341, 116.321894"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70 transition"
                  />
                </div>
              </section>

              {/* CARD 2: TANGGAL & WAKTU */}
              <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold">Waktu Stempel</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleShuffleTime}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Acak Jam</span>
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* 1. TANGGAL */}
                  <div className="col-span-5">
                    <label className="block text-xs text-zinc-400 mb-1.5">Tanggal</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={config.dateStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoDay = getIndonesianDayName(val);
                          setConfig((prev) => ({
                            ...prev,
                            dateStr: val,
                            dayStr: autoDay || prev.dayStr,
                          }));
                        }}
                        placeholder="2026-10-28"
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = datePickerRef.current;
                          if (!el) return;
                          if (typeof (el as any).showPicker === 'function') {
                            (el as any).showPicker();
                          } else {
                            el.focus();
                            el.click();
                          }
                        }}
                        title="Pilih dari Kalender"
                        className="absolute right-2.5 text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={datePickerRef}
                        type="date"
                        tabIndex={-1}
                        value={toIsoDateValue(config.dateStr)}
                        onChange={(e) => {
                          if (e.target.value) {
                            const val = e.target.value;
                            const autoDay = getIndonesianDayName(val);
                            setConfig((prev) => ({
                              ...prev,
                              dateStr: val,
                              dayStr: autoDay || prev.dayStr,
                            }));
                          }
                        }}
                        className="sr-only pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* 2. HARI */}
                  <div className="col-span-3">
                    <label className="block text-xs text-zinc-400 mb-1.5">Hari</label>
                    <input
                      type="text"
                      value={config.dayStr}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, dayStr: e.target.value }))
                      }
                      placeholder="Rabu"
                      className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>

                  {/* 3. JAM */}
                  <div className="col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1.5">Jam</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={config.timeStr}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            timeStr: e.target.value,
                          }))
                        }
                        placeholder="09:24:37"
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = timePickerRef.current;
                          if (!el) return;
                          if (typeof (el as any).showPicker === 'function') {
                            (el as any).showPicker();
                          } else {
                            el.focus();
                            el.click();
                          }
                        }}
                        title="Pilih Jam"
                        className="absolute right-2.5 text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={timePickerRef}
                        type="time"
                        step="1"
                        tabIndex={-1}
                        value={toIsoTimeValue(config.timeStr)}
                        onChange={(e) => {
                          if (e.target.value) {
                            const val = e.target.value;
                            const randSec = String(Math.floor(Math.random() * 58) + 1).padStart(
                              2,
                              '0'
                            );
                            setConfig((prev) => ({
                              ...prev,
                              timeStr: val.length === 5 ? `${val}:${randSec}` : val,
                            }));
                          }
                        }}
                        className="sr-only pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* ================= BULK STAMP DATA MATRIX ================= */
            <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
              {/* Bulk Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Images className="w-4 h-4 text-emerald-400" />
                    <span>Daftar Foto & Variasi Lokasi ({bulkItems.length})</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ketik nama dusun/desa/kecamatan atau impor dari Excel/CSV
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bulkFilesInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => spreadsheetInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Impor Excel/CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadBulkExcelTemplate(bulkItems)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Template Excel</span>
                  </button>
                </div>
              </div>

              {/* Quick Batch Utilities Bar */}
              {bulkItems.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFillDownBulk('date')}
                      title="Salin tanggal foto yang sedang dipilih ke semua foto"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                    >
                      <CopyCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Samakan Tanggal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDownBulk('location')}
                      title="Salin lokasi foto yang sedang dipilih ke semua foto"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                    >
                      <CopyCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Samakan Lokasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReshuffleAllBulk}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acak Semua Jam & Titik</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenBulkPerjadin}
                      title="Ekspor seluruh daftar foto ke laporan perjalanan dinas Word format BPS"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition cursor-pointer font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ekspor Perjadin (.docx)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAllBulk}
                    className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                </div>
              )}

              {/* Bulk Progress Indicator during ZIP Export */}
              {zipProgress.active && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-emerald-200">
                      Merender resolusi penuh & mengemas ZIP: {zipProgress.fileName}
                    </span>
                    <span className="font-mono text-emerald-300">
                      {zipProgress.current} / {zipProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{
                        width: `${Math.round(
                          (zipProgress.current / Math.max(1, zipProgress.total)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Empty State Dropzone vs Quick Data Matrix Table */}
              {bulkItems.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  onClick={() => bulkFilesInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${
                    isDraggingOver
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
                  }`}
                >
                  <Images className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-200">
                    Klik atau seret banyak foto sekaligus ke sini
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Anda dapat mengatur tanggal & lokasi berbeda untuk setiap foto atau mengimpor dari Excel/CSV
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto rounded-xl border border-zinc-800/90 bg-zinc-950/60">
                  <table className="w-full text-left border-collapse table-fixed min-w-[840px]">
                    <thead className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-xs text-[11px] font-medium text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-2 w-44">Foto</th>
                        <th className="py-2.5 px-2 w-36">Tanggal</th>
                        <th className="py-2.5 px-2 w-28">Jam</th>
                        <th className="py-2.5 px-2 w-[380px]">
                          Lokasi (Ketik Nama SLS / Desa / Kec / ID)
                        </th>
                        <th className="py-2.5 px-2 w-16 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs">
                      {bulkItems.map((item, idx) => {
                        const isSelected = activeBulkItem?.id === item.id;
                        const rowQuery = item.locationInput.trim().toLowerCase();
                        const rowSuggestions =
                          bulkRowSuggestId === item.id && rowQuery.length >= 2
                            ? searchIndex
                                .filter((s) =>
                                  rowQuery
                                    .split(/\s+/)
                                    .every((tok) => s.searchText.includes(tok))
                                )
                                .slice(0, 8)
                            : [];

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setActiveBulkId(item.id)}
                            className={`transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/25'
                                : 'hover:bg-zinc-900/50'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-zinc-400">
                              {idx + 1}
                            </td>

                            {/* Thumbnail & Filename */}
                            <td className="py-2.5 px-2 w-44">
                              <div className="flex items-center gap-2.5">
                                {item.thumbUrl ? (
                                  <img
                                    src={item.thumbUrl}
                                    alt={item.fileName}
                                    className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-900 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-200 truncate max-w-[115px]">
                                    {item.fileName}
                                  </p>
                                  <p className="text-[10px] font-mono text-zinc-500">
                                    {item.width}×{item.height}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Inline Date Input with Day Name pill & Calendar picker */}
                            <td className="py-2.5 px-2 w-36">
                              <div className="space-y-1">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={item.dateStr}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const autoDay = getIndonesianDayName(val);
                                      handleUpdateBulkRow(item.id, {
                                        dateStr: val,
                                        dayStr: autoDay,
                                      });
                                    }}
                                    placeholder="2026-10-28"
                                    className="w-full pl-2.5 pr-7 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                                  />
                                  <input
                                    type="date"
                                    tabIndex={-1}
                                    value={toIsoDateValue(item.dateStr)}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const val = e.target.value;
                                        const autoDay = getIndonesianDayName(val);
                                        handleUpdateBulkRow(item.id, {
                                          dateStr: val,
                                          dayStr: autoDay,
                                        });
                                      }
                                    }}
                                    className="absolute right-1.5 w-4 h-4 opacity-0 cursor-pointer"
                                    title="Pilih dari Kalender"
                                  />
                                  <Calendar className="w-3.5 h-3.5 text-zinc-500 hover:text-emerald-400 pointer-events-none absolute right-2" />
                                </div>
                                {(item.dayStr || getIndonesianDayName(item.dateStr)) && (
                                  <div className="text-[10px] text-emerald-400 font-medium px-0.5">
                                    {item.dayStr || getIndonesianDayName(item.dateStr)}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Inline Time Input */}
                            <td className="py-2.5 px-2 w-28">
                              <input
                                type="text"
                                value={item.timeStr}
                                onChange={(e) =>
                                  handleUpdateBulkRow(item.id, { timeStr: e.target.value })
                                }
                                placeholder="09:24:37"
                                className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                              />
                            </td>

                            {/* Smart Location Input + Status Badge */}
                            <td className="py-2.5 px-2 relative w-[380px]">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={item.locationInput}
                                  onFocus={() => setBulkRowSuggestId(item.id)}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setBulkRowSuggestId((prev) =>
                                        prev === item.id ? null : prev
                                      );
                                    }, 180);
                                  }}
                                  onChange={(e) =>
                                    handleUpdateBulkRow(
                                      item.id,
                                      { locationInput: e.target.value },
                                      true
                                    )
                                  }
                                  placeholder="Ketik dusun / desa / kec..."
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
                                />

                                {/* Match Status Pill */}
                                {item.matchStatus !== 'empty' && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    {item.matchStatus === 'matched' && (
                                      <span className="inline-flex items-center gap-1 text-emerald-400 truncate">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {item.resolvedTarget?.displayLabel}
                                        </span>
                                      </span>
                                    )}
                                    {item.matchStatus === 'partial' && (
                                      <span className="inline-flex items-center gap-1 text-amber-400 truncate">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {item.resolvedTarget?.displayLabel} (Acak di level{' '}
                                          {item.resolvedTarget?.level})
                                        </span>
                                      </span>
                                    )}
                                    {item.matchStatus === 'unmatched' && (
                                      <span className="inline-flex items-center gap-1 text-rose-400 truncate">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>Tidak ditemukan — periksa ejaan</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Inline Autocomplete Suggestions */}
                              {rowSuggestions.length > 0 && (
                                <div className="absolute z-30 left-2 right-2 mt-1 max-h-48 overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl divide-y divide-zinc-800">
                                  {rowSuggestions.map((sug) => (
                                    <button
                                      key={sug.id}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleUpdateBulkRow(
                                          item.id,
                                          { locationInput: sug.idsubsls },
                                          true
                                        );
                                        setBulkRowSuggestId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 transition flex flex-col cursor-pointer"
                                    >
                                      <span className="text-xs font-medium text-zinc-100">
                                        {sug.label}
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-400">
                                        {sug.sublabel}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Row Actions */}
                            <td className="py-2.5 px-2 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReshuffleBulkRow(item.id);
                                  }}
                                  title="Acak ulang jam & titik koordinat baris ini"
                                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveBulkItem(item.id);
                                  }}
                                  title="Hapus foto ini"
                                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* CARD 3: TAMPILAN WATERMARK (Shared across Single & Bulk modes) */}
          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-zinc-200">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold">Tampilan Stempel</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Posisi</label>
                <select
                  value={config.position}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      position: e.target.value as StampPosition,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                >
                  <option value="bottom-left">Kiri Bawah</option>
                  <option value="bottom-right">Kanan Bawah</option>
                  <option value="top-left">Kiri Atas</option>
                  <option value="top-right">Kanan Atas</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showMiniMap}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showMiniMap: e.target.checked }))
                    }
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-xs text-zinc-200">Mini Poligon</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Ukuran Teks</span>
                  <span className="font-mono text-zinc-300">
                    {Math.round(config.fontScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={config.fontScale}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      fontScale: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Transparansi Latar</span>
                  <span className="font-mono text-zinc-300">
                    {Math.round(config.scrimOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="0.92"
                  step="0.03"
                  value={config.scrimOpacity}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      scrimOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={config.customNote}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, customNote: e.target.value }))
                }
                placeholder="Tambahkan keterangan kegiatan..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
              />
            </div>
          </section>
        </aside>

        {/* RIGHT COLUMN: Interactive Live Preview */}
        <section
          className={`${
            appMode === 'bulk'
              ? 'lg:col-span-5 xl:col-span-5'
              : 'lg:col-span-7 xl:col-span-8'
          } flex flex-col gap-4 sticky top-22`}
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (appMode === 'bulk') {
                if (activeBulkItem) {
                  // If a bulk photo is actively selected, clicking preview replaces this photo
                  replaceActiveBulkInputRef.current?.click();
                } else {
                  bulkFilesInputRef.current?.click();
                }
              } else {
                fileInputRef.current?.click();
              }
            }}
            title={
              appMode === 'bulk' && activeBulkItem
                ? `Klik atau seret untuk mengganti foto ini (${activeBulkItem.fileName})`
                : 'Klik atau seret foto ke sini'
            }
            className={`group relative rounded-2xl border transition overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[520px] max-h-[78vh] cursor-pointer ${
              isDraggingOver
                ? 'border-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40'
            }`}
          >
            <canvas
              ref={previewCanvasRef}
              className="max-w-full max-h-[76vh] w-auto h-auto object-contain"
            />

            {/* Hover / Drag Overlay Badge */}
            <div
              className={`pointer-events-none absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-2 transition duration-200 ${
                isDraggingOver
                  ? 'opacity-100 scale-105 border-emerald-500/60 text-emerald-300'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isDraggingOver
                  ? 'Lepaskan foto di sini'
                  : appMode === 'bulk' && activeBulkItem
                  ? 'Klik / Seret untuk ganti foto ini'
                  : appMode === 'bulk'
                  ? 'Klik / Seret untuk tambah foto'
                  : 'Klik / Seret untuk ganti foto'}
              </span>
            </div>
          </div>

          {/* Minimal Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="text-xs text-zinc-400 flex items-center gap-2 truncate">
              {appMode === 'bulk' && activeBulkItem ? (
                <>
                  <span className="font-medium text-zinc-200 truncate max-w-[200px]">
                    {activeBulkItem.fileName}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="font-mono text-zinc-400">
                    {activeBulkItem.width} × {activeBulkItem.height} px
                  </span>
                </>
              ) : (
                <>
                  <span>{isSampleImage ? 'Contoh Pratinjau' : uploadedFileName}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="font-mono text-zinc-400">
                    {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {appMode === 'bulk' && bulkItems.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadSingleImage}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unduh Foto Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSinglePerjadin}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Perjadin Foto Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenBulkPerjadin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ekspor Semua Perjadin</span>
                  </button>
                  <button
                    type="button"
                    disabled={zipProgress.active}
                    onClick={handleDownloadBulkZip}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-sm transition cursor-pointer"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Unduh Semua (.ZIP)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOpenSinglePerjadin}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Buat Laporan Perjadin</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSingleImage}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Foto (.JPG)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      )}
    </div>
  );
}
