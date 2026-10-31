import type {
  BoundaryFeature,
  SelectedRegionInfo,
  StampColorThemeId,
  StampConfig,
  StampFontFamilyId,
  StampIconModeId,
} from './types';
import { formatIndonesianDate } from './spatial';

/**
 * Helper to draw a rounded rectangle path on a 2D canvas context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Parses a typed coordinate string like "-8.672341, 116.321894" into [lat, lng] numbers if valid.
 */
export function parseTypedCoords(coordStr: string): { lat: number; lng: number } | null {
  if (!coordStr.trim()) return null;
  const parts = coordStr.split(/[,;\s]+/).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export interface StampColorPalette {
  cardBg: string;
  cardBorder: string;
  accent: string;
  coordColor: string;
  coordColorUnverified: string;
  titleColor: string;
  tagColor: string;
  radarBoxBg: string;
  radarBorder: string;
  radarPolyFill: string;
  radarPolyStroke: string;
  radarPulseStroke: string;
  pinOuter: string;
  pinInner: string;
  pinStroke: string;
  badgeBg: string;
  badgeText: string;
}

export function getStampPalette(
  themeId: StampColorThemeId = 'onyx',
  opacity: number = 0.68
): StampColorPalette {
  switch (themeId) {
    case 'emerald':
      return {
        cardBg: `rgba(15, 23, 42, ${Math.min(0.96, opacity + 0.12)})`,
        cardBorder: 'rgba(255, 255, 255, 0.18)',
        accent: '#10b981',
        coordColor: '#6ee7b7',
        coordColorUnverified: '#fcd34d',
        titleColor: '#ffffff',
        tagColor: '#e4e4e7',
        radarBoxBg: 'rgba(15, 23, 42, 0.72)',
        radarBorder: 'rgba(255, 255, 255, 0.15)',
        radarPolyFill: 'rgba(16, 185, 129, 0.2)',
        radarPolyStroke: '#34d399',
        radarPulseStroke: 'rgba(16, 185, 129, 0.45)',
        pinOuter: 'rgba(244, 63, 94, 0.35)',
        pinInner: '#f43f5e',
        pinStroke: '#ffffff',
        badgeBg: 'rgba(6, 95, 70, 0.8)',
        badgeText: '#6ee7b7',
      };
    case 'sapphire':
      return {
        cardBg: `rgba(12, 26, 48, ${Math.min(0.96, opacity + 0.12)})`,
        cardBorder: 'rgba(56, 189, 248, 0.35)',
        accent: '#38bdf8',
        coordColor: '#38bdf8',
        coordColorUnverified: '#fde047',
        titleColor: '#ffffff',
        tagColor: '#e0f2fe',
        radarBoxBg: 'rgba(12, 26, 48, 0.85)',
        radarBorder: 'rgba(56, 189, 248, 0.35)',
        radarPolyFill: 'rgba(56, 189, 248, 0.22)',
        radarPolyStroke: '#38bdf8',
        radarPulseStroke: 'rgba(56, 189, 248, 0.45)',
        pinOuter: 'rgba(244, 63, 94, 0.4)',
        pinInner: '#f43f5e',
        pinStroke: '#ffffff',
        badgeBg: 'rgba(2, 132, 199, 0.85)',
        badgeText: '#bae6fd',
      };
    case 'amber':
      return {
        cardBg: `rgba(28, 25, 23, ${Math.min(0.96, opacity + 0.14)})`,
        cardBorder: 'rgba(245, 158, 11, 0.35)',
        accent: '#f59e0b',
        coordColor: '#fde68a',
        coordColorUnverified: '#fdba74',
        titleColor: '#ffffff',
        tagColor: '#fef3c7',
        radarBoxBg: 'rgba(28, 25, 23, 0.85)',
        radarBorder: 'rgba(245, 158, 11, 0.35)',
        radarPolyFill: 'rgba(245, 158, 11, 0.24)',
        radarPolyStroke: '#f59e0b',
        radarPulseStroke: 'rgba(245, 158, 11, 0.45)',
        pinOuter: 'rgba(239, 68, 68, 0.4)',
        pinInner: '#ef4444',
        pinStroke: '#ffffff',
        badgeBg: 'rgba(180, 83, 9, 0.85)',
        badgeText: '#fef3c7',
      };
    case 'cyber':
      return {
        cardBg: `rgba(0, 0, 0, ${Math.min(0.96, opacity + 0.2)})`,
        cardBorder: 'rgba(34, 197, 94, 0.45)',
        accent: '#22c55e',
        coordColor: '#4ade80',
        coordColorUnverified: '#86efac',
        titleColor: '#bbf7d0',
        tagColor: '#86efac',
        radarBoxBg: 'rgba(0, 0, 0, 0.92)',
        radarBorder: 'rgba(34, 197, 94, 0.45)',
        radarPolyFill: 'rgba(34, 197, 94, 0.28)',
        radarPolyStroke: '#22c55e',
        radarPulseStroke: 'rgba(34, 197, 94, 0.5)',
        pinOuter: 'rgba(74, 222, 128, 0.45)',
        pinInner: '#4ade80',
        pinStroke: '#052e16',
        badgeBg: 'rgba(21, 128, 61, 0.85)',
        badgeText: '#dcfce7',
      };
    case 'khaki':
      return {
        cardBg: `rgba(24, 24, 27, ${Math.min(0.96, opacity + 0.15)})`,
        cardBorder: 'rgba(217, 119, 6, 0.35)',
        accent: '#d97706',
        coordColor: '#fef08a',
        coordColorUnverified: '#fcd34d',
        titleColor: '#fafaf9',
        tagColor: '#e7e5e4',
        radarBoxBg: 'rgba(24, 24, 27, 0.88)',
        radarBorder: 'rgba(217, 119, 6, 0.35)',
        radarPolyFill: 'rgba(217, 119, 6, 0.24)',
        radarPolyStroke: '#d97706',
        radarPulseStroke: 'rgba(217, 119, 6, 0.45)',
        pinOuter: 'rgba(220, 38, 38, 0.4)',
        pinInner: '#dc2626',
        pinStroke: '#ffffff',
        badgeBg: 'rgba(146, 64, 14, 0.85)',
        badgeText: '#fef3c7',
      };
    case 'onyx':
    default:
      return {
        cardBg: `rgba(15, 15, 18, ${Math.min(0.96, opacity + 0.08)})`,
        cardBorder: 'rgba(255, 255, 255, 0.22)',
        accent: '#ffffff',
        coordColor: '#f4f4f5',
        coordColorUnverified: '#d4d4d8',
        titleColor: '#ffffff',
        tagColor: '#d4d4d8',
        radarBoxBg: 'rgba(9, 9, 11, 0.78)',
        radarBorder: 'rgba(255, 255, 255, 0.24)',
        radarPolyFill: 'rgba(255, 255, 255, 0.16)',
        radarPolyStroke: '#ffffff',
        radarPulseStroke: 'rgba(255, 255, 255, 0.3)',
        pinOuter: 'rgba(255, 255, 255, 0.32)',
        pinInner: '#ffffff',
        pinStroke: '#18181b',
        badgeBg: 'rgba(39, 39, 42, 0.9)',
        badgeText: '#f4f4f5',
      };
  }
}

export function getStampFont(
  family: StampFontFamilyId = 'jakarta',
  weight: number,
  size: number,
  isMonoCoords = false
): string {
  if (isMonoCoords && (family === 'jakarta' || family === 'system')) {
    return `${weight} ${size}px "JetBrains Mono", monospace`;
  }
  switch (family) {
    case 'mono':
      return `${weight} ${size}px "JetBrains Mono", monospace`;
    case 'serif':
      return `${weight} ${size}px "Times New Roman", Times, Georgia, serif`;
    case 'system':
      return `${weight} ${size}px system-ui, -apple-system, sans-serif`;
    case 'jakarta':
    default:
      return `${weight} ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;
  }
}

/**
 * Draws the mini polygon outline & coordinate pin inside the stamp card.
 * Default style: 'clean-poly' with 'onyx' (Hitam Putih - Poligon Bersih).
 */
function drawPolygonRadar(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxSize: number,
  feature: BoundaryFeature | null,
  lat: number | null,
  lng: number | null,
  themeConfig?: {
    colorTheme?: StampColorThemeId;
    iconMode?: StampIconModeId;
  }
) {
  const palette = getStampPalette(themeConfig?.colorTheme || 'onyx');
  const iconMode = themeConfig?.iconMode || 'clean-poly';

  drawRoundedRect(ctx, boxX, boxY, boxSize, boxSize, boxSize * 0.12);
  ctx.fillStyle = palette.radarBoxBg;
  ctx.fill();
  ctx.lineWidth = Math.max(1, boxSize * 0.015);
  ctx.strokeStyle = palette.radarBorder;
  ctx.stroke();

  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  const r = boxSize * 0.34;

  // Background radar pulse or crosshair
  if (iconMode === 'radar-pulse') {
    ctx.save();
    ctx.strokeStyle = palette.radarPulseStroke;
    ctx.lineWidth = Math.max(1, boxSize * 0.018);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (iconMode === 'crosshair') {
    ctx.save();
    ctx.strokeStyle = palette.radarPulseStroke;
    ctx.lineWidth = Math.max(1, boxSize * 0.018);
    ctx.beginPath();
    ctx.moveTo(boxX + boxSize * 0.15, cy);
    ctx.lineTo(boxX + boxSize * 0.85, cy);
    ctx.moveTo(cx, boxY + boxSize * 0.15);
    ctx.lineTo(cx, boxY + boxSize * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Fallback when no boundary polygon is loaded yet
  if (!feature || lat === null || lng === null) {
    if (iconMode === 'pin-badge') {
      const pinH = Math.max(16, boxSize * 0.42);
      const pinR = pinH * 0.36;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy - pinH * 0.18, pinR, Math.PI * 0.85, Math.PI * 0.15, false);
      ctx.lineTo(cx, cy + pinH * 0.28);
      ctx.closePath();
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.strokeStyle = palette.pinStroke;
      ctx.lineWidth = Math.max(1, boxSize * 0.022);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - pinH * 0.18, pinR * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = palette.pinStroke;
      ctx.fill();
      ctx.restore();
    } else if (iconMode === 'clean-poly') {
      // Draw a clean representative polygon outline when no boundary feature is loaded yet
      ctx.save();
      const s = boxSize;
      const pts: [number, number][] = [
        [boxX + s * 0.24, boxY + s * 0.22],
        [boxX + s * 0.68, boxY + s * 0.16],
        [boxX + s * 0.84, boxY + s * 0.44],
        [boxX + s * 0.72, boxY + s * 0.80],
        [boxX + s * 0.28, boxY + s * 0.82],
        [boxX + s * 0.16, boxY + s * 0.52],
      ];
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = palette.radarPolyFill;
      ctx.fill();
      ctx.strokeStyle = palette.radarPolyStroke;
      ctx.lineWidth = Math.max(1.5, boxSize * 0.024);
      ctx.stroke();

      // Center point marker
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, boxSize * 0.085), 0, Math.PI * 2);
      ctx.fillStyle = palette.pinOuter;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2.5, boxSize * 0.045), 0, Math.PI * 2);
      ctx.fillStyle = palette.pinInner;
      ctx.fill();
      ctx.strokeStyle = palette.pinStroke;
      ctx.lineWidth = Math.max(1, boxSize * 0.018);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = palette.radarPulseStroke;
      ctx.lineWidth = Math.max(1.5, boxSize * 0.025);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = palette.accent;
      ctx.fill();
    }
    return;
  }

  const [minX, minY, maxX, maxY] = feature.properties.bbox;
  const spanX = Math.max(maxX - minX, 0.0001);
  const spanY = Math.max(maxY - minY, 0.0001);
  const pad = boxSize * 0.14;
  const innerW = boxSize - pad * 2;
  const innerH = boxSize - pad * 2;

  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offsetX = boxX + pad + (innerW - spanX * scale) / 2;
  const offsetY = boxY + pad + (innerH - spanY * scale) / 2;

  const toCanvasXY = (lon: number, latitude: number): [number, number] => {
    const x = offsetX + (lon - minX) * scale;
    const y = offsetY + (maxY - latitude) * scale;
    return [x, y];
  };

  ctx.save();
  ctx.beginPath();
  const geom = feature.geometry;
  const polygons: number[][][][] =
    geom.type === 'Polygon'
      ? [geom.coordinates as number[][][]]
      : (geom.coordinates as number[][][][]);

  for (const poly of polygons) {
    for (const ring of poly) {
      ring.forEach((pt, idx) => {
        const [px, py] = toCanvasXY(pt[0], pt[1]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
    }
  }

  ctx.fillStyle = palette.radarPolyFill;
  ctx.fill();
  ctx.strokeStyle = palette.radarPolyStroke;
  ctx.lineWidth = Math.max(1.5, boxSize * 0.022);
  ctx.stroke();

  // Pin marker inside radar box
  const [rawPx, rawPy] = toCanvasXY(lng, lat);
  const px = Math.max(boxX + pad * 0.6, Math.min(boxX + boxSize - pad * 0.6, rawPx));
  const py = Math.max(boxY + pad * 0.6, Math.min(boxY + boxSize - pad * 0.6, rawPy));

  if (iconMode === 'pin-badge') {
    const pinH = Math.max(14, boxSize * 0.36);
    const pinR = pinH * 0.36;
    ctx.beginPath();
    ctx.arc(px, py - pinH * 0.45, pinR, Math.PI * 0.85, Math.PI * 0.15, false);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.strokeStyle = palette.pinStroke;
    ctx.lineWidth = Math.max(1, boxSize * 0.02);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py - pinH * 0.45, pinR * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = palette.pinStroke;
    ctx.fill();
  } else if (iconMode === 'crosshair') {
    const retR = Math.max(4, boxSize * 0.09);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(1, boxSize * 0.02);
    ctx.beginPath();
    ctx.moveTo(px - retR * 1.4, py);
    ctx.lineTo(px + retR * 1.4, py);
    ctx.moveTo(px, py - retR * 1.4);
    ctx.lineTo(px, py + retR * 1.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, retR * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = palette.pinInner;
    ctx.fill();
  } else {
    // clean-poly & radar-pulse pin
    ctx.beginPath();
    ctx.arc(px, py, Math.max(4, boxSize * 0.085), 0, Math.PI * 2);
    ctx.fillStyle = palette.pinOuter;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, Math.max(2.5, boxSize * 0.045), 0, Math.PI * 2);
    ctx.fillStyle = palette.pinInner;
    ctx.fill();
    ctx.strokeStyle = palette.pinStroke;
    ctx.lineWidth = Math.max(1, boxSize * 0.018);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Text wrapping helper that splits a long string into multiple lines
 * without overflowing maxWidth.
 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Core rendering function that paints the photo and the clean GPS watermark
 * onto a target canvas (either preview canvas or full-resolution offscreen export canvas).
 */
export function renderStampedCanvas(
  canvas: HTMLCanvasElement,
  sourceImage: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  config: StampConfig,
  region: SelectedRegionInfo | null,
  activeFeature: BoundaryFeature | null,
  targetWidth?: number,
  targetHeight?: number
) {
  const width = targetWidth ?? sourceImage.width;
  const height = targetHeight ?? sourceImage.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw original photo cleanly
  ctx.drawImage(sourceImage, 0, 0, width, height);

  // 2. Resolve design theme, colors, and typography (Default: onyx + clean-poly)
  const colorTheme = config.colorTheme || 'onyx';
  const iconMode = config.iconMode || 'clean-poly';
  const palette = getStampPalette(colorTheme, config.scrimOpacity);
  const fontFamily = config.fontFamily || 'jakarta';

  const rawBaseFontSize = Math.max(14, Math.round(width * 0.02));
  const baseFontSize = Math.round(rawBaseFontSize * config.fontScale);
  const titleFontSize = Math.round(baseFontSize * 1.08);
  const coordFontSize = Math.round(baseFontSize * 0.96);
  const metaFontSize = Math.round(baseFontSize * 0.88);
  const lineGap = Math.round(baseFontSize * 0.34);
  const padX = Math.round(baseFontSize * 0.95);
  const padY = Math.round(baseFontSize * 0.8);
  const margin = Math.round(Math.min(width, height) * 0.025);

  const fontTitle = getStampFont(fontFamily, 600, titleFontSize);
  const fontCoord = getStampFont(fontFamily, 500, coordFontSize, true);
  const fontMeta = getStampFont(fontFamily, 500, metaFontSize);

  // 3. Prepare text lines
  const formattedDate = formatIndonesianDate(config.dateStr, config.dayStr);
  const timePart = `${config.timeStr} ${config.timezoneLabel}`.trim();
  const line1DateTime = [formattedDate, timePart].filter(Boolean).join(' • ');

  const hasTypedCoords = config.coordStr.trim().length > 0;
  const line2Coords = hasTypedCoords
    ? config.coordStr.trim()
    : 'Pilih wilayah atau ketik koordinat';

  const parsedCoords = parseTypedCoords(config.coordStr);
  const pinLat = parsedCoords ? parsedCoords.lat : region ? region.lat : null;
  const pinLng = parsedCoords ? parsedCoords.lng : region ? region.lng : null;

  const maxCardWidth = Math.min(width - margin * 2, Math.round(width * 0.9));
  const radarSize = config.showMiniMap ? Math.round(baseFontSize * 4.2) : 0;
  const radarGap = config.showMiniMap ? Math.round(baseFontSize * 0.85) : 0;
  const maxTextWidth = maxCardWidth - padX * 2 - radarSize - radarGap;

  ctx.font = fontMeta;
  const regionLines = config.tagStr.trim()
    ? wrapTextLines(ctx, config.tagStr.trim(), maxTextWidth)
    : [];

  const customNoteLines = config.customNote.trim()
    ? wrapTextLines(ctx, config.customNote.trim(), maxTextWidth)
    : [];

  // Measure widest line
  ctx.font = fontTitle;
  const wLine1 = ctx.measureText(line1DateTime).width;

  ctx.font = fontCoord;
  const wLine2 = ctx.measureText(line2Coords).width;

  ctx.font = fontMeta;
  const wRegion = Math.max(
    0,
    ...regionLines.map((l) => ctx.measureText(l).width),
    ...customNoteLines.map((l) => ctx.measureText(l).width)
  );

  const contentTextWidth = Math.min(
    maxTextWidth,
    Math.max(wLine1, wLine2, wRegion, baseFontSize * 12)
  );

  let totalTextHeight = titleFontSize + lineGap + coordFontSize;
  if (regionLines.length > 0) {
    totalTextHeight +=
      lineGap +
      regionLines.length * metaFontSize +
      (regionLines.length - 1) * Math.round(lineGap * 0.45);
  }
  if (customNoteLines.length > 0) {
    totalTextHeight +=
      Math.round(lineGap * 0.7) +
      customNoteLines.length * metaFontSize +
      (customNoteLines.length - 1) * Math.round(lineGap * 0.45);
  }

  const innerHeight = Math.max(totalTextHeight, radarSize);
  const cardWidth = Math.round(padX * 2 + radarSize + radarGap + contentTextWidth);
  const cardHeight = Math.round(padY * 2 + innerHeight);

  // Position
  let cardX = margin;
  let cardY = height - margin - cardHeight;

  if (config.position === 'bottom-right') {
    cardX = width - margin - cardWidth;
    cardY = height - margin - cardHeight;
  } else if (config.position === 'top-left') {
    cardX = margin;
    cardY = margin;
  } else if (config.position === 'top-right') {
    cardX = width - margin - cardWidth;
    cardY = margin;
  }

  // 4. Render selected photostamp style
  const style = config.stampStyle || 'modern-card';

  // --- STYLE 1: Full-width Bottom Banner ---
  if (style === 'bottom-banner') {
    const bannerPadX = Math.max(margin, Math.round(baseFontSize * 1.2));
    const bannerPadY = Math.round(baseFontSize * 0.7);
    const radarSizeBanner = config.showMiniMap ? Math.round(baseFontSize * 3.8) : 0;
    const radarGapBanner = config.showMiniMap ? Math.round(baseFontSize * 0.8) : 0;
    const maxBannerTextW = width - bannerPadX * 2 - radarSizeBanner - radarGapBanner;

    ctx.font = fontMeta;
    const bannerRegionLines = config.tagStr.trim()
      ? wrapTextLines(ctx, config.tagStr.trim(), maxBannerTextW)
      : [];

    const bannerTextHeight =
      titleFontSize +
      lineGap +
      coordFontSize +
      (bannerRegionLines.length ? lineGap + bannerRegionLines.length * metaFontSize : 0);
    const bannerInnerH = Math.max(bannerTextHeight, radarSizeBanner);
    const bannerH = Math.round(bannerPadY * 2 + bannerInnerH);
    const bannerY = config.position.startsWith('top') ? 0 : height - bannerH;

    ctx.save();
    ctx.fillStyle = palette.cardBg;
    ctx.fillRect(0, bannerY, width, bannerH);

    ctx.fillStyle = palette.accent;
    ctx.fillRect(0, config.position.startsWith('top') ? bannerH - 3 : bannerY, width, 3);

    let curX = bannerPadX;
    if (config.showMiniMap) {
      const radarY = bannerY + Math.round((bannerH - radarSizeBanner) / 2);
      drawPolygonRadar(ctx, curX, radarY, radarSizeBanner, activeFeature, pinLat, pinLng, {
        colorTheme,
        iconMode,
      });
      curX += radarSizeBanner + radarGapBanner;
    }

    let textY = bannerY + Math.round((bannerH - bannerTextHeight) / 2);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    ctx.font = fontTitle;
    ctx.fillStyle = palette.titleColor;
    ctx.fillText(line1DateTime, curX, textY);
    textY += titleFontSize + lineGap;

    ctx.font = fontCoord;
    ctx.fillStyle = hasTypedCoords ? palette.coordColor : palette.coordColorUnverified;
    ctx.fillText(line2Coords, curX, textY);
    textY += coordFontSize;

    if (bannerRegionLines.length > 0) {
      textY += lineGap;
      ctx.font = fontMeta;
      ctx.fillStyle = palette.tagColor;
      for (const line of bannerRegionLines) {
        ctx.fillText(line, curX, textY);
        textY += metaFontSize + Math.round(lineGap * 0.4);
      }
    }

    ctx.restore();
    return;
  }

  // --- STYLE 2: Formal Kedinasan (with accent bar & field header) ---
  if (style === 'formal-survey') {
    const headerHeight = Math.round(metaFontSize * 1.5);
    const cardPadX = Math.round(baseFontSize * 1.1);
    const cardPadY = Math.round(baseFontSize * 0.85);
    const totalH = Math.round(cardPadY * 2 + headerHeight + lineGap + Math.max(totalTextHeight, radarSize));
    const cardW = Math.round(padX * 2 + radarSize + radarGap + contentTextWidth + baseFontSize * 0.5);

    let posX = margin;
    let posY = height - margin - totalH;
    if (config.position === 'bottom-right') posX = width - margin - cardW;
    else if (config.position === 'top-left') posY = margin;
    else if (config.position === 'top-right') {
      posX = width - margin - cardW;
      posY = margin;
    }

    ctx.save();
    drawRoundedRect(ctx, posX, posY, cardW, totalH, 8);
    ctx.fillStyle = palette.cardBg;
    ctx.fill();
    ctx.strokeStyle = palette.cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.fillRect(posX, posY, 6, totalH);

    const badgeX = posX + cardPadX;
    const badgeY = posY + cardPadY;
    const fontBadge = getStampFont(fontFamily, 700, Math.round(metaFontSize * 0.82));
    ctx.font = fontBadge;
    const badgeText = 'DOKUMENTASI KEGIATAN LAPANGAN';
    const badgeW = ctx.measureText(badgeText).width + baseFontSize;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, headerHeight, 4);
    ctx.fillStyle = palette.badgeBg;
    ctx.fill();
    ctx.fillStyle = palette.badgeText;
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + Math.round(baseFontSize * 0.5), badgeY + headerHeight / 2);

    let curX = posX + cardPadX;
    const contentY = badgeY + headerHeight + lineGap;
    if (config.showMiniMap) {
      const radarY = contentY + Math.round((totalTextHeight - radarSize) / 2);
      drawPolygonRadar(ctx, curX, Math.max(contentY, radarY), radarSize, activeFeature, pinLat, pinLng, {
        colorTheme,
        iconMode,
      });
      curX += radarSize + radarGap;
    }

    ctx.textBaseline = 'top';
    let curY = contentY;
    ctx.font = fontTitle;
    ctx.fillStyle = palette.titleColor;
    ctx.fillText(line1DateTime, curX, curY);
    curY += titleFontSize + lineGap;

    ctx.font = fontCoord;
    ctx.fillStyle = hasTypedCoords ? palette.coordColor : palette.coordColorUnverified;
    ctx.fillText(line2Coords, curX, curY);
    curY += coordFontSize;

    if (regionLines.length > 0) {
      curY += lineGap;
      ctx.font = fontMeta;
      ctx.fillStyle = palette.tagColor;
      for (let i = 0; i < regionLines.length; i++) {
        ctx.fillText(regionLines[i], curX, curY);
        curY += metaFontSize + Math.round(lineGap * 0.4);
      }
    }

    ctx.restore();
    return;
  }

  // --- STYLE 3: Minimalis Teks (Clean text overlay with drop shadow, no box) ---
  if (style === 'minimal-text') {
    const gradHeight = Math.round(Math.max(totalTextHeight, radarSize) * 2.2);
    const isTop = config.position.startsWith('top');
    const isRight = config.position.endsWith('right');

    ctx.save();
    const grad = ctx.createLinearGradient(0, isTop ? gradHeight : height - gradHeight, 0, isTop ? 0 : height);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.88, config.scrimOpacity + 0.12)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, isTop ? 0 : height - gradHeight, width, gradHeight);

    const posX = isRight ? width - margin - (contentTextWidth + radarSize + radarGap) : margin;
    let curX = posX;
    const startY = isTop ? margin + Math.round(baseFontSize * 0.5) : height - margin - Math.max(totalTextHeight, radarSize);

    if (config.showMiniMap) {
      drawPolygonRadar(ctx, curX, startY, radarSize, activeFeature, pinLat, pinLng, {
        colorTheme,
        iconMode,
      });
      curX += radarSize + radarGap;
    }

    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = Math.max(4, Math.round(baseFontSize * 0.3));
    ctx.shadowOffsetY = 2;

    let curY = startY;
    ctx.font = fontTitle;
    ctx.fillStyle = palette.titleColor;
    ctx.fillText(line1DateTime, curX, curY);
    curY += titleFontSize + lineGap;

    ctx.font = fontCoord;
    ctx.fillStyle = hasTypedCoords ? palette.coordColor : palette.coordColorUnverified;
    ctx.fillText(line2Coords, curX, curY);
    curY += coordFontSize;

    if (regionLines.length > 0) {
      curY += lineGap;
      ctx.font = fontMeta;
      ctx.fillStyle = palette.tagColor;
      for (let i = 0; i < regionLines.length; i++) {
        ctx.fillText(regionLines[i], curX, curY);
        curY += metaFontSize + Math.round(lineGap * 0.4);
      }
    }

    ctx.restore();
    return;
  }

  // --- STYLE 4: Compact Pill (Rounded Pill Badge) ---
  if (style === 'compact-pill') {
    const pillPadX = Math.round(baseFontSize * 1.25);
    const pillPadY = Math.round(baseFontSize * 0.7);
    const pillRadarSize = config.showMiniMap ? Math.round(baseFontSize * 3.4) : 0;
    const pillRadarGap = config.showMiniMap ? Math.round(baseFontSize * 0.7) : 0;
    const pillTextH =
      titleFontSize +
      lineGap +
      coordFontSize +
      (regionLines.length ? lineGap + regionLines.length * metaFontSize : 0);
    const pillInnerH = Math.max(pillTextH, pillRadarSize);
    const pillH = Math.round(pillPadY * 2 + pillInnerH);
    const pillW = Math.round(pillPadX * 2 + pillRadarSize + pillRadarGap + contentTextWidth);
    const radius = Math.round(Math.min(pillH / 2, 28));

    let posX = margin;
    let posY = height - margin - pillH;
    if (config.position === 'bottom-right') posX = width - margin - pillW;
    else if (config.position === 'top-left') posY = margin;
    else if (config.position === 'top-right') {
      posX = width - margin - pillW;
      posY = margin;
    }

    ctx.save();
    drawRoundedRect(ctx, posX, posY, pillW, pillH, radius);
    ctx.fillStyle = palette.cardBg;
    ctx.fill();
    ctx.strokeStyle = palette.cardBorder;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    let curX = posX + pillPadX;
    if (config.showMiniMap) {
      const radarY = posY + Math.round((pillH - pillRadarSize) / 2);
      drawPolygonRadar(ctx, curX, radarY, pillRadarSize, activeFeature, pinLat, pinLng, {
        colorTheme,
        iconMode,
      });
      curX += pillRadarSize + pillRadarGap;
    }

    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;

    let curY = posY + Math.round((pillH - pillTextH) / 2);
    ctx.font = fontTitle;
    ctx.fillStyle = palette.titleColor;
    ctx.fillText(line1DateTime, curX, curY);
    curY += titleFontSize + lineGap;

    ctx.font = fontCoord;
    ctx.fillStyle = hasTypedCoords ? palette.coordColor : palette.coordColorUnverified;
    ctx.fillText(line2Coords, curX, curY);
    curY += coordFontSize;

    if (regionLines.length > 0) {
      curY += lineGap;
      ctx.font = fontMeta;
      ctx.fillStyle = palette.tagColor;
      for (let i = 0; i < regionLines.length; i++) {
        ctx.fillText(regionLines[i], curX, curY);
        curY += metaFontSize + Math.round(lineGap * 0.4);
      }
    }

    ctx.restore();
    return;
  }

  // --- STYLE 5: Kartu Modern (Default) ---
  ctx.save();
  const cornerRadius = Math.max(8, Math.round(baseFontSize * 0.6));
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius);
  ctx.fillStyle = palette.cardBg;
  ctx.fill();

  ctx.lineWidth = Math.max(1, Math.round(baseFontSize * 0.06));
  ctx.strokeStyle = palette.cardBorder;
  ctx.stroke();

  // 5. Optional mini polygon radar box on the left
  let textStartX = cardX + padX;
  if (config.showMiniMap) {
    const radarX = cardX + padX;
    const radarY = cardY + Math.round((cardHeight - radarSize) / 2);
    drawPolygonRadar(ctx, radarX, radarY, radarSize, activeFeature, pinLat, pinLng, {
      colorTheme,
      iconMode,
    });
    textStartX = radarX + radarSize + radarGap;
  }

  // 6. Draw Stamped Text Lines cleanly centered vertically
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = Math.max(2, Math.round(baseFontSize * 0.18));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, Math.round(baseFontSize * 0.06));

  let cursorY = cardY + Math.round((cardHeight - totalTextHeight) / 2);

  // Line 1: Date & Time
  ctx.font = fontTitle;
  ctx.fillStyle = palette.titleColor;
  ctx.fillText(line1DateTime, textStartX, cursorY);
  cursorY += titleFontSize + lineGap;

  // Line 2: Coordinates
  ctx.font = fontCoord;
  ctx.fillStyle = hasTypedCoords ? palette.coordColor : palette.coordColorUnverified;
  ctx.fillText(line2Coords, textStartX, cursorY);
  cursorY += coordFontSize;

  // Line 3: Tagging / Region Text
  if (regionLines.length > 0) {
    cursorY += lineGap;
    ctx.font = fontMeta;
    ctx.fillStyle = palette.tagColor;
    for (let i = 0; i < regionLines.length; i++) {
      ctx.fillText(regionLines[i], textStartX, cursorY);
      cursorY += metaFontSize + (i < regionLines.length - 1 ? Math.round(lineGap * 0.45) : 0);
    }
  }

  // Optional Custom Note
  if (customNoteLines.length > 0) {
    cursorY += Math.round(lineGap * 0.7);
    ctx.font = fontMeta;
    ctx.fillStyle = palette.tagColor;
    for (let i = 0; i < customNoteLines.length; i++) {
      ctx.fillText(customNoteLines[i], textStartX, cursorY);
      cursorY += metaFontSize + (i < customNoteLines.length - 1 ? Math.round(lineGap * 0.45) : 0);
    }
  }

  ctx.restore();
}

/**
 * Generates a clean default sample canvas so the user can test
 * reactive stamping immediately or click/drag onto the preview to upload.
 */
export function createSamplePlaceholderCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  const grad = ctx.createLinearGradient(0, 0, 1600, 1200);
  grad.addColorStop(0, '#18181b');
  grad.addColorStop(1, '#09090b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 1200);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const step = 80;
  for (let x = 0; x < 1600; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1200);
    ctx.stroke();
  }
  for (let y = 0; y < 1200; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1600, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.arc(800, 520, 96, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Pilih atau Seret Foto ke Sini', 800, 680);

  ctx.fillStyle = '#71717a';
  ctx.font = '400 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Mendukung JPG, PNG, WEBP dengan metadata lokasi & waktu', 800, 720);

  return c;
}
