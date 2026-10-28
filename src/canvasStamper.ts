import type { BoundaryFeature, SelectedRegionInfo, StampConfig } from './types';
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

/**
 * Draws the mini polygon outline & coordinate pin inside the stamp card.
 */
function drawPolygonRadar(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxSize: number,
  feature: BoundaryFeature | null,
  lat: number | null,
  lng: number | null
) {
  drawRoundedRect(ctx, boxX, boxY, boxSize, boxSize, boxSize * 0.12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fill();
  ctx.lineWidth = Math.max(1, boxSize * 0.015);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  if (!feature || lat === null || lng === null) {
    const cx = boxX + boxSize / 2;
    const cy = boxY + boxSize / 2;
    const r = boxSize * 0.24;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = Math.max(1.5, boxSize * 0.025);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
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
        const [cx, cy] = toCanvasXY(pt[0], pt[1]);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
    }
  }

  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = Math.max(1.5, boxSize * 0.022);
  ctx.stroke();

  // Clamp pin inside radar box if user typed custom coordinates slightly outside bbox
  const [rawPx, rawPy] = toCanvasXY(lng, lat);
  const px = Math.max(boxX + pad * 0.6, Math.min(boxX + boxSize - pad * 0.6, rawPx));
  const py = Math.max(boxY + pad * 0.6, Math.min(boxY + boxSize - pad * 0.6, rawPy));

  ctx.beginPath();
  ctx.arc(px, py, Math.max(4, boxSize * 0.085), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, Math.max(2.5, boxSize * 0.045), 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, boxSize * 0.018);
  ctx.stroke();

  ctx.restore();
}

/**
 * Wraps text into multiple lines if it exceeds maxWidth.
 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
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
 *
 * Uses `config.timeStr`, `config.coordStr`, and `config.tagStr` directly so any user
 * keystroke immediately reflects on the stamped image.
 */
export function renderStampedCanvas(
  canvas: HTMLCanvasElement,
  sourceImage: ImageBitmap | HTMLImageElement,
  config: StampConfig,
  region: SelectedRegionInfo | null,
  activeFeature: BoundaryFeature | null,
  targetWidth?: number,
  targetHeight?: number
) {
  const width = targetWidth ?? sourceImage.width;
  const height = targetHeight ?? sourceImage.height;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base image at full target resolution
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(sourceImage, 0, 0, width, height);

  // 2. Dynamic typography scaling per AGENTS.md formula
  const rawBaseFontSize = Math.max(14, Math.round(width * 0.02));
  const baseFontSize = Math.round(rawBaseFontSize * config.fontScale);
  const titleFontSize = Math.round(baseFontSize * 1.08);
  const coordFontSize = Math.round(baseFontSize * 0.96);
  const metaFontSize = Math.round(baseFontSize * 0.88);
  const lineGap = Math.round(baseFontSize * 0.34);
  const padX = Math.round(baseFontSize * 0.95);
  const padY = Math.round(baseFontSize * 0.8);
  const margin = Math.round(Math.min(width, height) * 0.025);

  // 3. Prepare text lines from user-typable state
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

  // Wrap typable tagStr (region tagging) and optional custom note
  ctx.font = `500 ${metaFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  const regionLines = config.tagStr.trim()
    ? wrapTextLines(ctx, config.tagStr.trim(), maxTextWidth)
    : [];

  const customNoteLines = config.customNote.trim()
    ? wrapTextLines(ctx, config.customNote.trim(), maxTextWidth)
    : [];

  // Measure widest line
  ctx.font = `600 ${titleFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  const wLine1 = ctx.measureText(line1DateTime).width;

  ctx.font = `500 ${coordFontSize}px "JetBrains Mono", monospace`;
  const wLine2 = ctx.measureText(line2Coords).width;

  ctx.font = `500 ${metaFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
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

  // Determine card X & Y based on chosen position
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

  // 4. Draw dark high-contrast scrim background
  ctx.save();
  const cornerRadius = Math.max(8, Math.round(baseFontSize * 0.6));
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius);
  ctx.fillStyle = `rgba(9, 9, 11, ${config.scrimOpacity})`;
  ctx.fill();

  ctx.lineWidth = Math.max(1, Math.round(baseFontSize * 0.06));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  // 5. Optional mini polygon radar box on the left
  let textStartX = cardX + padX;
  if (config.showMiniMap) {
    const radarX = cardX + padX;
    const radarY = cardY + Math.round((cardHeight - radarSize) / 2);
    drawPolygonRadar(ctx, radarX, radarY, radarSize, activeFeature, pinLat, pinLng);
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
  ctx.font = `600 ${titleFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line1DateTime, textStartX, cursorY);
  cursorY += titleFontSize + lineGap;

  // Line 2: Coordinates
  ctx.font = `500 ${coordFontSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = hasTypedCoords ? '#6ee7b7' : '#fcd34d';
  ctx.fillText(line2Coords, textStartX, cursorY);
  cursorY += coordFontSize;

  // Line 3: Tagging / Region Text
  if (regionLines.length > 0) {
    cursorY += lineGap;
    ctx.font = `500 ${metaFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#e4e4e7';
    for (let i = 0; i < regionLines.length; i++) {
      ctx.fillText(regionLines[i], textStartX, cursorY);
      cursorY += metaFontSize + (i < regionLines.length - 1 ? Math.round(lineGap * 0.45) : 0);
    }
  }

  // Optional Custom Note
  if (customNoteLines.length > 0) {
    cursorY += Math.round(lineGap * 0.7);
    ctx.font = `400 ${metaFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#a1a1aa';
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

  const skyGrad = ctx.createLinearGradient(0, 0, 0, 740);
  skyGrad.addColorStop(0, '#09090b');
  skyGrad.addColorStop(0.6, '#18181b');
  skyGrad.addColorStop(1, '#27272a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1600, 740);

  ctx.beginPath();
  ctx.moveTo(0, 740);
  ctx.lineTo(0, 540);
  ctx.lineTo(380, 430);
  ctx.lineTo(760, 290);
  ctx.lineTo(960, 340);
  ctx.lineTo(1280, 450);
  ctx.lineTo(1600, 500);
  ctx.lineTo(1600, 740);
  ctx.closePath();
  ctx.fillStyle = '#18181b';
  ctx.fill();

  const groundGrad = ctx.createLinearGradient(0, 650, 0, 1200);
  groundGrad.addColorStop(0, '#064e3b');
  groundGrad.addColorStop(1, '#022c22');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 650, 1600, 550);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.lineWidth = 1.5;
  for (let y = 690; y < 1200; y += 65) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1600, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(244, 244, 245, 0.85)';
  ctx.font = '600 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Klik atau Seret Foto Anda ke Area Ini', 800, 420);
  ctx.fillStyle = 'rgba(161, 161, 170, 0.75)';
  ctx.font = '400 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Mendukung JPG, PNG, WebP • Resolusi asli tetap terjaga', 800, 468);
  ctx.restore();

  return c;
}
