import React, { useState, useEffect } from 'react';
import {
  Crop,
  Monitor,
  Copy,
  Check,
  FolderOpen,
  RotateCcw,
  X,
  Camera
} from 'lucide-react';
import { ScreenSource, RegionRect } from '../types';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveScreenshot: (buffer: ArrayBuffer, format: 'png' | 'jpg', rect?: RegionRect) => Promise<any>;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  onSaveScreenshot,
}) => {
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [format, setFormat] = useState<'png' | 'jpg'>('png');

  // Preview state
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBuffer, setCapturedBuffer] = useState<ArrayBuffer | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [savedItem, setSavedItem] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    window.electronAPI?.getScreenSources().then((srcs) => {
      setSources(srcs);
      if (srcs.length > 0) {
        const primary = srcs.find((s) => s.id.startsWith('screen')) || srcs[0];
        setSelectedSourceId(primary.id);
      }
    });

    setCapturedDataUrl(null);
    setCapturedBuffer(null);
    setSavedItem(null);
    setIsCopied(false);
  }, [isOpen]);

  const captureFromStream = async (sourceId: string, rect?: RegionRect) => {
    setIsCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 1. If region mode and desktop snapshot is available, crop directly for instant 0ms result
      if (rect) {
        try {
          const snapUrl = await window.electronAPI?.getRegionSnapshot();
          if (snapUrl) {
            const img = new Image();
            img.src = snapUrl;
            await new Promise((resolve) => {
              img.onload = resolve;
            });

            const screenW = window.screen.width || window.innerWidth || 1920;
            const screenH = window.screen.height || window.innerHeight || 1080;
            const scaleX = img.naturalWidth / screenW;
            const scaleY = img.naturalHeight / screenH;

            const sx = Math.max(0, Math.round(rect.x * scaleX));
            const sy = Math.max(0, Math.round(rect.y * scaleY));
            const sw = Math.min(img.naturalWidth - sx, Math.max(1, Math.round(rect.width * scaleX)));
            const sh = Math.min(img.naturalHeight - sy, Math.max(1, Math.round(rect.height * scaleY)));

            canvas.width = sw;
            canvas.height = sh;
            ctx?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

            const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const dataUrl = canvas.toDataURL(mime, 0.95);
            setCapturedDataUrl(dataUrl);

            const res = await fetch(dataUrl);
            const buffer = await res.arrayBuffer();
            setCapturedBuffer(buffer);

            window.electronAPI?.copyImageToClipboard(buffer);
            setIsCopied(true);

            const item = await onSaveScreenshot(buffer, format, rect);
            setSavedItem(item);
            return;
          }
        } catch (e) {
          console.warn('Snapshot crop fallback to stream:', e);
        }
      }

      // 2. Stream capture fallback or full screen
      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1920,
            maxWidth: 3840,
            minHeight: 1080,
            maxHeight: 2160,
          },
        },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      if (rect) {
        const screenW = window.screen.width || window.innerWidth || 1920;
        const screenH = window.screen.height || window.innerHeight || 1080;
        const scaleX = video.videoWidth / screenW;
        const scaleY = video.videoHeight / screenH;

        const sx = Math.max(0, Math.round(rect.x * scaleX));
        const sy = Math.max(0, Math.round(rect.y * scaleY));
        const sw = Math.min(video.videoWidth - sx, Math.max(1, Math.round(rect.width * scaleX)));
        const sh = Math.min(video.videoHeight - sy, Math.max(1, Math.round(rect.height * scaleY)));

        canvas.width = sw;
        canvas.height = sh;
        ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Stop stream
      stream.getTracks().forEach((t: any) => t.stop());

      // Get image buffer
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.95);
      setCapturedDataUrl(dataUrl);

      // Convert to ArrayBuffer
      const res = await fetch(dataUrl);
      const buffer = await res.arrayBuffer();
      setCapturedBuffer(buffer);

      // Automatically copy to Windows clipboard
      window.electronAPI?.copyImageToClipboard(buffer);
      setIsCopied(true);

      // Save to disk immediately as well
      const item = await onSaveScreenshot(buffer, format, rect);
      setSavedItem(item);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCaptureFullScreen = () => {
    const srcId = selectedSourceId || sources[0]?.id || 'screen:0:0';
    captureFromStream(srcId);
  };

  const handleCaptureRegion = async () => {
    try {
      const srcId = selectedSourceId || sources[0]?.id || 'screen:0:0';
      const rect = await window.electronAPI?.startRegionSelection();
      if (rect && rect.width > 5 && rect.height > 5) {
        await captureFromStream(srcId, rect);
      }
    } catch (err) {
      console.error('Region capture error:', err);
    }
  };

  const handleCopyClipboard = () => {
    if (capturedBuffer) {
      window.electronAPI?.copyImageToClipboard(capturedBuffer);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenFolder = () => {
    if (savedItem) {
      window.electronAPI?.openInFolder(savedItem.path);
    } else {
      window.electronAPI?.openInFolder();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera size={16} />
            </div>
            <h2 className="text-white font-semibold text-base">Screenshot Tool</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {!capturedDataUrl ? (
          /* Selection Options Mode */
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wider block mb-2.5">
                Select Capture Mode
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCaptureFullScreen}
                  disabled={isCapturing}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#1c1c1c] hover:bg-[#282828] border border-white/5 hover:border-amber-500/40 transition-all group text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-105 transition-transform">
                    <Monitor size={22} />
                  </div>
                  <span className="text-white text-sm font-medium">Full Screen</span>
                  <span className="text-gray-400 text-xs mt-0.5">Capture entire desktop</span>
                </button>

                <button
                  onClick={handleCaptureRegion}
                  disabled={isCapturing}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#1c1c1c] hover:bg-[#282828] border border-white/5 hover:border-amber-500/40 transition-all group text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-105 transition-transform">
                    <Crop size={22} />
                  </div>
                  <span className="text-white text-sm font-medium">Custom Region</span>
                  <span className="text-gray-400 text-xs mt-0.5">Drag & select an area</span>
                </button>
              </div>
            </div>

            {/* Display and format settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {sources.filter((s) => s.id.startsWith('screen')).length > 1 && (
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Display Monitor</label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                  >
                    {sources
                      .filter((s) => s.id.startsWith('screen'))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Image Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                >
                  <option value="png">PNG (Lossless High Quality)</option>
                  <option value="jpg">JPG (Compact File Size)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode After Capture */
          <div className="p-5 space-y-4">
            {/* Captured Image Display */}
            <div className="relative bg-black/60 rounded-xl overflow-hidden border border-white/10 max-h-72 flex items-center justify-center">
              <img src={capturedDataUrl} alt="Captured" className="max-h-72 max-w-full object-contain" />

              {/* Copied to clipboard toast banner */}
              {isCopied && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg animate-in fade-in">
                  <Check size={14} />
                  Copied to Clipboard!
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check size={14} />
                Saved to Screenshots folder
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCapturedDataUrl(null);
                    setCapturedBuffer(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw size={14} />
                  Capture Again
                </button>

                <button
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#333333] hover:bg-[#3d3d3d] text-white transition-colors"
                >
                  <Copy size={14} />
                  {isCopied ? 'Copied' : 'Copy'}
                </button>

                <button
                  onClick={handleOpenFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#0F7DFD] hover:bg-blue-600 text-white transition-colors shadow-sm"
                >
                  <FolderOpen size={14} />
                  Open in Explorer
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
