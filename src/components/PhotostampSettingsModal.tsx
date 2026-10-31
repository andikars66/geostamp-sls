import React, { useEffect, useRef, useState } from 'react';
import type {
  BoundaryFeature,
  BulkPhotoItem,
  SelectedRegionInfo,
  StampColorThemeId,
  StampConfig,
  StampFontFamilyId,
  StampIconModeId,
  StampPosition,
  StampStyleId,
} from '../types';
import {
  DEFAULT_STAMP_SETTINGS,
  STAMP_STYLES,
  STAMP_THEME_PRESETS,
} from '../types';
import { renderStampedCanvas } from '../canvasStamper';
import { getIndonesianDayName } from '../spatial';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: StampConfig;
  onSave: (settings: {
    stampStyle: StampStyleId;
    colorTheme: StampColorThemeId;
    fontFamily: StampFontFamilyId;
    iconMode: StampIconModeId;
    themePreset: string;
    position: StampPosition;
    fontScale: number;
    scrimOpacity: number;
    showMiniMap: boolean;
  }) => void;
  activeItem?: BulkPhotoItem;
}

const COLOR_OPTIONS: Array<{
  id: StampColorThemeId;
  label: string;
}> = [
  { id: 'onyx', label: 'Hitam Putih (Default)' },
  { id: 'emerald', label: 'Hijau Emerald' },
  { id: 'sapphire', label: 'Biru Safir' },
  { id: 'khaki', label: 'Emas Kedinasan' },
  { id: 'amber', label: 'Amber' },
  { id: 'cyber', label: 'Hijau Terminal' },
];

const FONT_OPTIONS: Array<{
  id: StampFontFamilyId;
  label: string;
}> = [
  { id: 'jakarta', label: 'Plus Jakarta Sans' },
  { id: 'serif', label: 'Times New Roman' },
  { id: 'mono', label: 'JetBrains Mono' },
  { id: 'system', label: 'System UI' },
];

const ICON_MODE_OPTIONS: Array<{
  id: StampIconModeId;
  label: string;
}> = [
  { id: 'clean-poly', label: 'Poligon Bersih' },
  { id: 'radar-pulse', label: 'Lingkaran Radar' },
  { id: 'crosshair', label: 'Garis Bidik' },
  { id: 'pin-badge', label: 'Pin Lokasi' },
];

const POSITION_OPTIONS: Array<{ id: StampPosition; label: string }> = [
  { id: 'bottom-left', label: 'Kiri bawah' },
  { id: 'bottom-right', label: 'Kanan bawah' },
  { id: 'top-left', label: 'Kiri atas' },
  { id: 'top-right', label: 'Kanan atas' },
];

const FONT_SCALE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0.85, label: 'Kecil' },
  { value: 1.0, label: 'Standar' },
  { value: 1.15, label: 'Besar' },
];

const SCRIM_OPACITY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: '50%' },
  { value: 0.68, label: '68%' },
  { value: 0.85, label: '85%' },
];

const SAMPLE_FEATURE: BoundaryFeature = {
  type: 'Feature',
  properties: {
    idsubsls: '5202050008000501',
    kdsubsls: '01',
    idsls: '52020500080005',
    kdsls: '0005',
    nmsls: 'DUSUN JURIT',
    iddesa: '5202050008',
    kddesa: '008',
    nmdesa: 'BEBUAQ',
    kdkec: '050',
    nmkec: 'KOPANG',
    bbox: [116.3195, -8.6748, 116.3248, -8.6698],
    fallback_lng: 116.321894,
    fallback_lat: -8.672341,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.3204, -8.6704],
        [116.3238, -8.6701],
        [116.3245, -8.6719],
        [116.3236, -8.6742],
        [116.3206, -8.6744],
        [116.3198, -8.6723],
        [116.3204, -8.6704],
      ],
    ],
  },
};

function drawSampleFieldScene(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Calm, natural daylight backdrop so the photostamp remains the visual focus
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.56);
  sky.addColorStop(0, '#94a3b8');
  sky.addColorStop(0.6, '#cbd5e1');
  sky.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.56);

  // Distant ridge
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.54);
  ctx.lineTo(width * 0.22, height * 0.41);
  ctx.lineTo(width * 0.45, height * 0.47);
  ctx.lineTo(width * 0.68, height * 0.38);
  ctx.lineTo(width * 0.88, height * 0.46);
  ctx.lineTo(width, height * 0.42);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Midground slope
  const ground = ctx.createLinearGradient(0, height * 0.48, 0, height);
  ground.addColorStop(0, '#475569');
  ground.addColorStop(0.5, '#334155');
  ground.addColorStop(1, '#1e293b');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  ctx.bezierCurveTo(width * 0.3, height * 0.48, width * 0.7, height * 0.58, width, height * 0.51);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Subtle road perspective
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(width * 0.46, height * 0.53);
  ctx.lineTo(width * 0.53, height * 0.53);
  ctx.lineTo(width * 0.78, height);
  ctx.lineTo(width * 0.24, height);
  ctx.closePath();
  ctx.fill();
}

export function PhotostampSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onSave,
  activeItem,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [styleId, setStyleId] = useState<StampStyleId>(
    currentConfig.stampStyle || DEFAULT_STAMP_SETTINGS.stampStyle
  );
  const [colorTheme, setColorTheme] = useState<StampColorThemeId>(
    currentConfig.colorTheme || DEFAULT_STAMP_SETTINGS.colorTheme
  );
  const [fontFamily, setFontFamily] = useState<StampFontFamilyId>(
    currentConfig.fontFamily || DEFAULT_STAMP_SETTINGS.fontFamily
  );
  const [iconMode, setIconMode] = useState<StampIconModeId>(
    currentConfig.iconMode || DEFAULT_STAMP_SETTINGS.iconMode
  );
  const [themePreset, setThemePreset] = useState<string>(
    currentConfig.themePreset || DEFAULT_STAMP_SETTINGS.themePreset || 'hitam-putih'
  );

  const [position, setPosition] = useState<StampPosition>(
    currentConfig.position || DEFAULT_STAMP_SETTINGS.position
  );
  const [fontScale, setFontScale] = useState<number>(
    currentConfig.fontScale || DEFAULT_STAMP_SETTINGS.fontScale
  );
  const [scrimOpacity, setScrimOpacity] = useState<number>(
    currentConfig.scrimOpacity || DEFAULT_STAMP_SETTINGS.scrimOpacity
  );
  const [showMiniMap, setShowMiniMap] = useState<boolean>(currentConfig.showMiniMap !== false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeBitmap, setActiveBitmap] = useState<{ bitmap: ImageBitmap; file: File } | null>(null);

  // Sync native <dialog> open/close state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback light-dismiss where <dialog closedby="any"> is not natively supported
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) dialog.close();
    };
    dialog.addEventListener('pointerdown', onDown);
    dialog.addEventListener('pointerup', onUp);
    return () => {
      dialog.removeEventListener('pointerdown', onDown);
      dialog.removeEventListener('pointerup', onUp);
    };
  }, []);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setStyleId(currentConfig.stampStyle || DEFAULT_STAMP_SETTINGS.stampStyle);
      setColorTheme(currentConfig.colorTheme || DEFAULT_STAMP_SETTINGS.colorTheme);
      setFontFamily(currentConfig.fontFamily || DEFAULT_STAMP_SETTINGS.fontFamily);
      setIconMode(currentConfig.iconMode || DEFAULT_STAMP_SETTINGS.iconMode);
      setThemePreset(currentConfig.themePreset || DEFAULT_STAMP_SETTINGS.themePreset || 'hitam-putih');
      setPosition(currentConfig.position || DEFAULT_STAMP_SETTINGS.position);
      setFontScale(currentConfig.fontScale || DEFAULT_STAMP_SETTINGS.fontScale);
      setScrimOpacity(currentConfig.scrimOpacity || DEFAULT_STAMP_SETTINGS.scrimOpacity);
      setShowMiniMap(currentConfig.showMiniMap !== false);
    }
  }, [isOpen, currentConfig]);

  // Decode active item bitmap if available
  useEffect(() => {
    let cancelled = false;
    let decoded: ImageBitmap | null = null;
    if (!isOpen || !activeItem || activeItem.photoMissing) {
      setActiveBitmap(null);
      return;
    }
    createImageBitmap(activeItem.file, {
      resizeWidth: Math.min(1200, activeItem.width || 1200),
      imageOrientation: 'from-image',
    })
      .then((b) => {
        decoded = b;
        if (cancelled) b.close();
        else setActiveBitmap({ bitmap: b, file: activeItem.file });
      })
      .catch(() => setActiveBitmap(null));

    return () => {
      cancelled = true;
      decoded?.close();
    };
  }, [isOpen, activeItem?.file, activeItem?.photoMissing]);

  // Render live preview on canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sampleWidth = 1200;
    const sampleHeight = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const effectiveDateStr = activeItem?.dateStr || currentConfig.dateStr || '2026-10-31';
    const effectiveDayStr =
      activeItem?.dayStr ||
      currentConfig.dayStr ||
      getIndonesianDayName(effectiveDateStr) ||
      'Sabtu';
    const effectiveTimeStr = activeItem?.timeStr || currentConfig.timeStr || '10:45:18';
    const effectiveCoordStr =
      activeItem?.coordStr || currentConfig.coordStr || '-8.672341, 116.321894';
    const effectiveTagStr =
      activeItem?.tagStr ||
      currentConfig.tagStr ||
      '5202050008000501 • DUSUN JURIT, BEBUAQ, KOPANG';

    const previewConfig: StampConfig = {
      ...currentConfig,
      stampStyle: styleId,
      colorTheme,
      fontFamily,
      iconMode,
      themePreset,
      position,
      fontScale,
      scrimOpacity,
      showMiniMap,
      dateStr: effectiveDateStr,
      dayStr: effectiveDayStr,
      timeStr: effectiveTimeStr,
      coordStr: effectiveCoordStr,
      tagStr: effectiveTagStr,
      customNote: activeItem?.customNote || currentConfig.customNote || '',
    };

    const sampleRegionInfo: SelectedRegionInfo = activeItem?.regionInfo || {
      level: 'subsls',
      kdkec: '050',
      nmkec: 'KOPANG',
      iddesa: '5202050008',
      nmdesa: 'BEBUAQ',
      idsls: '52020500080005',
      nmsls: 'DUSUN JURIT',
      idsubsls: '5202050008000501',
      lat: -8.672341,
      lng: 116.321894,
    };

    const previewFeature = activeItem?.activeFeature || SAMPLE_FEATURE;

    if (activeBitmap && activeBitmap.file === activeItem?.file) {
      const imgW = activeBitmap.bitmap.width;
      const imgH = activeBitmap.bitmap.height;
      canvas.width = imgW;
      canvas.height = imgH;
      renderStampedCanvas(
        canvas,
        activeBitmap.bitmap,
        previewConfig,
        sampleRegionInfo,
        previewFeature,
        imgW,
        imgH
      );
    } else {
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = sampleWidth;
      baseCanvas.height = sampleHeight;
      const baseCtx = baseCanvas.getContext('2d');
      if (baseCtx) drawSampleFieldScene(baseCtx, sampleWidth, sampleHeight);

      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      renderStampedCanvas(
        canvas,
        baseCanvas,
        previewConfig,
        sampleRegionInfo,
        previewFeature,
        sampleWidth,
        sampleHeight
      );
      baseCanvas.width = baseCanvas.height = 0;
    }
  }, [
    isOpen,
    styleId,
    colorTheme,
    fontFamily,
    iconMode,
    themePreset,
    position,
    fontScale,
    scrimOpacity,
    showMiniMap,
    activeBitmap,
    activeItem,
    currentConfig,
  ]);

  const handleApplyPreset = (presetId: string) => {
    const found = STAMP_THEME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setColorTheme(found.colorTheme);
    setFontFamily(found.fontFamily);
    setIconMode(found.iconMode);
    setThemePreset(found.id);
    setShowMiniMap(true);
  };

  const handleReset = () => {
    setStyleId(DEFAULT_STAMP_SETTINGS.stampStyle);
    setColorTheme(DEFAULT_STAMP_SETTINGS.colorTheme);
    setFontFamily(DEFAULT_STAMP_SETTINGS.fontFamily);
    setIconMode(DEFAULT_STAMP_SETTINGS.iconMode);
    setThemePreset(DEFAULT_STAMP_SETTINGS.themePreset || 'hitam-putih');
    setPosition(DEFAULT_STAMP_SETTINGS.position);
    setFontScale(DEFAULT_STAMP_SETTINGS.fontScale);
    setScrimOpacity(DEFAULT_STAMP_SETTINGS.scrimOpacity);
    setShowMiniMap(DEFAULT_STAMP_SETTINGS.showMiniMap);
  };

  const handleSave = () => {
    onSave({
      stampStyle: styleId,
      colorTheme,
      fontFamily,
      iconMode,
      themePreset,
      position,
      fontScale,
      scrimOpacity,
      showMiniMap,
    });
    onClose();
  };

  const selectedDef = STAMP_STYLES.find((s) => s.id === styleId) || STAMP_STYLES[0];
  const activeColorLabel = COLOR_OPTIONS.find((c) => c.id === colorTheme)?.label.replace(' (Default)', '') || 'Hitam Putih';
  const activeIconLabel = showMiniMap
    ? ICON_MODE_OPTIONS.find((i) => i.id === iconMode)?.label || 'Poligon Bersih'
    : 'Tanpa peta mini';

  return (
    <dialog
      ref={dialogRef}
      className="stamp-settings-dialog"
      aria-labelledby="stamp-settings-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="stamp-settings-modal">
        <header className="stamp-settings-header">
          <h2 id="stamp-settings-title">Pengaturan Photostamp</h2>
          <button
            type="button"
            className="stamp-settings-close"
            onClick={onClose}
            aria-label="Tutup pengaturan photostamp"
          >
            Tutup
          </button>
        </header>

        <div className="stamp-settings-body">
          {/* Left Column: Clean, compact form controls */}
          <section className="stamp-settings-controls" aria-label="Pengaturan tampilan stempel">
            {/* 1. Paket Cepat */}
            <div className="stamp-field-block">
              <span className="stamp-field-label">Paket cepat</span>
              <div className="stamp-preset-list" role="radiogroup" aria-label="Paket cepat">
                {STAMP_THEME_PRESETS.map((preset) => {
                  const isSelected =
                    showMiniMap &&
                    colorTheme === preset.colorTheme &&
                    fontFamily === preset.fontFamily &&
                    iconMode === preset.iconMode;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`stamp-preset-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleApplyPreset(preset.id)}
                    >
                      <span
                        className="stamp-swatch"
                        style={{
                          backgroundColor:
                            preset.colorTheme === 'onyx' ? '#18181b' : preset.accentHex,
                        }}
                        aria-hidden="true"
                      />
                      <span className="stamp-preset-name">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Kustomisasi Komponen (2x2 Select Grid) */}
            <div className="stamp-select-grid">
              <label className="stamp-field-block">
                <span className="stamp-field-label">Tata letak</span>
                <select
                  value={styleId}
                  onChange={(e) => setStyleId(e.target.value as StampStyleId)}
                >
                  {STAMP_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="stamp-field-block">
                <span className="stamp-field-label">Warna</span>
                <select
                  value={colorTheme}
                  onChange={(e) => {
                    setColorTheme(e.target.value as StampColorThemeId);
                    setThemePreset('custom');
                  }}
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="stamp-field-block">
                <span className="stamp-field-label">Huruf</span>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value as StampFontFamilyId);
                    setThemePreset('custom');
                  }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="stamp-field-block">
                <span className="stamp-field-label">Peta mini wilayah</span>
                <select
                  value={showMiniMap ? iconMode : 'none'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'none') {
                      setShowMiniMap(false);
                    } else {
                      setShowMiniMap(true);
                      setIconMode(val as StampIconModeId);
                      setThemePreset('custom');
                    }
                  }}
                >
                  {ICON_MODE_OPTIONS.map((ic) => (
                    <option key={ic.id} value={ic.id}>
                      {ic.label}
                    </option>
                  ))}
                  <option value="none">Sembunyikan peta mini</option>
                </select>
              </label>
            </div>

            {/* 3. Posisi */}
            <div className="stamp-field-block">
              <span className="stamp-field-label">Posisi di foto</span>
              <div className="stamp-segment-grid">
                {POSITION_OPTIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    className={`stamp-segment-btn ${position === pos.id ? 'active' : ''}`}
                    onClick={() => setPosition(pos.id)}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ukuran Teks & Kepekatan Latar */}
            <div className="stamp-pair-row">
              <div className="stamp-field-block">
                <span className="stamp-field-label">Ukuran teks</span>
                <div className="stamp-segment-row">
                  {FONT_SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`stamp-segment-btn ${Math.abs(fontScale - opt.value) < 0.05 ? 'active' : ''}`}
                      onClick={() => setFontScale(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stamp-field-block">
                <span className="stamp-field-label">Kepekatan latar</span>
                <div className="stamp-segment-row">
                  {SCRIM_OPACITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`stamp-segment-btn ${Math.abs(scrimOpacity - opt.value) < 0.05 ? 'active' : ''}`}
                      onClick={() => setScrimOpacity(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Live Preview */}
          <section className="stamp-settings-preview" aria-label="Pratinjau stempel">
            <div className="stamp-preview-header">
              <span>Pratinjau</span>
              <small>
                {activeItem && !activeItem.photoMissing
                  ? activeItem.fileName
                  : 'Contoh tampilan'}
              </small>
            </div>

            <div className="stamp-preview-canvas-wrap">
              <canvas ref={canvasRef} className="stamp-preview-canvas" />
            </div>

            <small className="stamp-preview-summary">
              {selectedDef.name} · {activeColorLabel} · {activeIconLabel} ·{' '}
              {POSITION_OPTIONS.find((p) => p.id === position)?.label}
            </small>
          </section>
        </div>

        <footer className="stamp-settings-footer">
          <button type="button" className="stamp-btn-reset" onClick={handleReset}>
            Kembalikan default
          </button>
          <div className="stamp-footer-actions">
            <button type="button" onClick={onClose}>
              Batal
            </button>
            <button type="button" className="primary" onClick={handleSave} autoFocus>
              Simpan
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
