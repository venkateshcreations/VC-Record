import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { RegionRect } from '../types';

interface RegionSelectOverlayProps {
  onConfirm: (rect: RegionRect) => void;
  onCancel: () => void;
}

export const RegionSelectOverlay: React.FC<RegionSelectOverlayProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [snapshot, setSnapshot] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [finalRect, setFinalRect] = useState<RegionRect | null>(null);

  useEffect(() => {
    // Load desktop screenshot for crystal clear backdrop
    window.electronAPI?.getRegionSnapshot?.().then((url) => {
      if (url) {
        setSnapshot(url);
      }
    });
  }, []);

  // Active rect during drag or finalized rect
  const rect: RegionRect | null = isSelecting
    ? startPos && currentPos
      ? {
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width: Math.abs(currentPos.x - startPos.x),
          height: Math.abs(currentPos.y - startPos.y),
        }
      : null
    : finalRect;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter' && rect && rect.width > 10 && rect.height > 10) {
        onConfirm(rect);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rect, onConfirm, onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setFinalRect(null);
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && startPos && currentPos) {
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      if (w > 10 && h > 10) {
        setFinalRect({
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width: w,
          height: h,
        });
      }
      setIsSelecting(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: snapshot ? `url(${snapshot})` : undefined,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-[9999] cursor-crosshair select-none bg-transparent overflow-hidden"
    >
      {/* Dark tint over the desktop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Instructions header pill with clickable Cancel Button */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#121422]/95 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl text-white text-xs flex items-center gap-4 shadow-2xl z-50 pointer-events-auto select-none"
      >
        <span className="font-semibold text-gray-200">Click and drag to select an area</span>
        <span className="text-gray-400 font-mono text-[11px] bg-white/10 px-2.5 py-1 rounded-lg">
          Enter to confirm • Esc to cancel
        </span>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 transition-all font-semibold cursor-pointer active:scale-95 shadow-md"
          title="Cancel Region Selection (Esc)"
        >
          <X size={14} />
          <span>Cancel</span>
        </button>
      </div>

      {/* Selected Box with Spotlight background & border */}
      {rect && rect.width > 5 && rect.height > 5 && (
        <div
          style={{
            position: 'absolute',
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundImage: snapshot ? `url(${snapshot})` : undefined,
            backgroundSize: `${window.innerWidth}px ${window.innerHeight}px`,
            backgroundPosition: `-${rect.x}px -${rect.y}px`,
            backgroundRepeat: 'no-repeat',
            boxShadow: '0 0 0 2px #0F7DFD, 0 0 15px rgba(15, 125, 253, 0.5)',
          }}
          onDoubleClick={() => onConfirm(rect)}
          className="pointer-events-auto relative cursor-crosshair"
        >
          {/* Dimension Tag */}
          <div
            style={{
              top: rect.y > 32 ? '-28px' : '4px',
            }}
            className="absolute left-0 bg-[#0F7DFD] text-white text-[11px] font-mono px-2 py-0.5 rounded shadow pointer-events-none z-20"
          >
            {rect.width} × {rect.height} px
          </div>

          {/* Confirm & Cancel floating buttons */}
          <div
            style={{
              bottom: rect.y + rect.height < window.innerHeight - 48 ? '-42px' : '6px',
            }}
            className="absolute right-0 flex items-center gap-1.5 bg-[#1a1a1a] border border-white/20 p-1 rounded-xl shadow-2xl z-20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onConfirm(rect)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0F7DFD] hover:bg-blue-600 active:scale-95 text-white text-xs font-medium transition-all shadow-md"
              title="Confirm Selection (Enter)"
            >
              <Check size={14} />
              <span>Confirm</span>
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-gray-300 hover:text-white transition-all"
              title="Cancel (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
