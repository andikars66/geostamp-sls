import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, FileText, Layers } from 'lucide-react';
import { PerjadinSheetView } from './PerjadinSheetView';
import type { PerjadinReportItem } from '../perjadinTypes';

interface PerjadinA4PreviewProps {
  item: PerjadinReportItem;
  imageSrc?: string | null;
  className?: string;
}

export const PerjadinA4Preview: React.FC<PerjadinA4PreviewProps> = ({
  item,
  imageSrc,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(75);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [forceTwoPages, setForceTwoPages] = useState<boolean>(false);

  // Exact A4 dimensions in pixels at 96 DPI
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  // Auto-calculate Fit to Box scale
  const updateFitScale = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const paddingX = 48;
    const paddingY = 48;
    const availW = clientWidth - paddingX;
    const availH = clientHeight - paddingY;

    // Base fit scale on 1 A4 page
    const scaleW = availW / A4_WIDTH_PX;
    const scaleH = availH / A4_HEIGHT_PX;
    const computedScale = Math.min(scaleW, scaleH);

    // Clamp between 30% and 120%
    const finalPercent = Math.max(30, Math.min(120, Math.round(computedScale * 100)));
    setZoomPercent(finalPercent);
  };

  useEffect(() => {
    if (isFitMode) {
      updateFitScale();
    }
  }, [isFitMode]);

  useEffect(() => {
    const handleResize = () => {
      if (isFitMode) {
        updateFitScale();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFitMode]);

  const handleZoomIn = () => {
    setIsFitMode(false);
    setZoomPercent((prev) => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setIsFitMode(false);
    setZoomPercent((prev) => Math.max(30, prev - 10));
  };

  const handleResetFit = () => {
    setIsFitMode(true);
    updateFitScale();
  };

  const handle100Percent = () => {
    setIsFitMode(false);
    setZoomPercent(100);
  };

  const scale = zoomPercent / 100;
  const isAutoTwoPages = forceTwoPages || (item.uraian && item.uraian.length > 550);

  return (
    <div className={`flex flex-col h-full w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      {/* Top Floating / Fixed Preview Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Pratinjau Kertas A4
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
            {isAutoTwoPages ? '2 Halaman' : '1 Halaman'}
          </span>
        </div>

        {/* Zoom & Page Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Force 2 Pages */}
          <button
            type="button"
            onClick={() => setForceTwoPages((prev) => !prev)}
            title="Ubah pembagian halaman"
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1 ${
              forceTwoPages
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>{forceTwoPages ? '2 Halaman (Aktif)' : 'Bagi 2 Halaman'}</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/80">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil (-10%)"
              className="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] text-zinc-300 px-1 min-w-[3rem] text-center select-none">
              {zoomPercent}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar (+10%)"
              className="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetFit}
            title="Sesuaikan ukuran tampilan dengan layar (Fit to box)"
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1 ${
              isFitMode
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit Box</span>
          </button>

          <button
            type="button"
            onClick={handle100Percent}
            title="Ukuran fisik 100% asli"
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
          >
            100%
          </button>
        </div>
      </div>

      {/* Viewport Canvas (Scrollable with zoom transform) */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-auto p-6 flex flex-col items-center justify-start bg-zinc-900/40 relative"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            marginBottom: `${Math.round(40 * scale)}px`,
          }}
        >
          <PerjadinSheetView
            item={item}
            imageSrc={imageSrc}
            forceTwoPages={forceTwoPages}
          />
        </div>
      </div>
    </div>
  );
};
