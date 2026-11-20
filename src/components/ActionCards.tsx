import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Monitor3D, Webcam3D, Audio3D, Screenshot3D } from './Icons3D';

interface ActionCardsProps {
  onRecordScreen: () => void;
  onRecordWebcam: () => void;
  onRecordAudio: () => void;
  onScreenshot: () => void;
  shortcutScreen?: string;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onRecordScreen,
  onRecordWebcam,
  onRecordAudio,
  onScreenshot,
  shortcutScreen = 'Ctrl+Alt+R',
}) => {
  return (
    <div className="grid grid-cols-4 gap-4 px-6 pt-5 pb-3">
      {/* 1. Record Screen */}
      <div
        onClick={onRecordScreen}
        className="group relative flex flex-col justify-between p-4 rounded-3xl bg-[#181a28]/80 hover:bg-[#1f2233]/90 backdrop-blur-xl border border-white/[0.08] hover:border-pink-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-xl hover:shadow-pink-500/15 overflow-hidden select-none"
      >
        {/* Top Vibrant Gradient Banner */}
        <div className="relative w-full h-28 rounded-2xl bg-gradient-to-br from-[#FF1493] via-[#FF0055] to-[#7928CA] p-3 flex items-center justify-center shadow-lg shadow-pink-500/20 overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <div className="group-hover:scale-110 transition-transform duration-300">
            <Monitor3D className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
          </div>
        </div>

        {/* Text & Action Row */}
        <div className="mt-3.5 flex items-end justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-pink-400 transition-colors">
              Record Screen
            </h3>
            <span className="text-gray-400 text-[11px] font-mono mt-0.5 tracking-wide">
              {shortcutScreen}
            </span>
          </div>

          {/* Floating Pill Arrow */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5252] to-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.5)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <ChevronRight size={16} className="stroke-[2.5] ml-0.5" />
          </div>
        </div>
      </div>

      {/* 2. Record Webcam */}
      <div
        onClick={onRecordWebcam}
        className="group relative flex flex-col justify-between p-4 rounded-3xl bg-[#181a28]/80 hover:bg-[#1f2233]/90 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-xl hover:shadow-blue-500/15 overflow-hidden select-none"
      >
        {/* Top Vibrant Gradient Banner */}
        <div className="relative w-full h-28 rounded-2xl bg-gradient-to-br from-[#0070F3] via-[#00B4D8] to-[#00F5D4] p-3 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <div className="group-hover:scale-110 transition-transform duration-300">
            <Webcam3D className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
          </div>
        </div>

        {/* Text & Action Row */}
        <div className="mt-3.5 flex items-end justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-blue-400 transition-colors">
              Record Webcam
            </h3>
            <span className="text-gray-400 text-[11px] mt-0.5">
              Camera + microphone
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0070F3] to-[#00B4D8] shadow-[0_0_12px_rgba(0,112,243,0.5)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <ChevronRight size={16} className="stroke-[2.5] ml-0.5" />
          </div>
        </div>
      </div>

      {/* 3. Record Audio */}
      <div
        onClick={onRecordAudio}
        className="group relative flex flex-col justify-between p-4 rounded-3xl bg-[#181a28]/80 hover:bg-[#1f2233]/90 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-xl hover:shadow-emerald-500/15 overflow-hidden select-none"
      >
        {/* Top Vibrant Gradient Banner */}
        <div className="relative w-full h-28 rounded-2xl bg-gradient-to-br from-[#00F5D4] via-[#059669] to-[#047857] p-3 flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <div className="group-hover:scale-110 transition-transform duration-300">
            <Audio3D className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
          </div>
        </div>

        {/* Text & Action Row */}
        <div className="mt-3.5 flex items-end justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-emerald-400 transition-colors">
              Record Audio
            </h3>
            <span className="text-gray-400 text-[11px] mt-0.5">
              Mic + system sound
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <ChevronRight size={16} className="stroke-[2.5] ml-0.5" />
          </div>
        </div>
      </div>

      {/* 4. Screenshot */}
      <div
        onClick={onScreenshot}
        className="group relative flex flex-col justify-between p-4 rounded-3xl bg-[#181a28]/80 hover:bg-[#1f2233]/90 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-xl hover:shadow-amber-500/15 overflow-hidden select-none"
      >
        {/* Top Vibrant Gradient Banner */}
        <div className="relative w-full h-28 rounded-2xl bg-gradient-to-br from-[#FFB703] via-[#FB8500] to-[#E63946] p-3 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <div className="group-hover:scale-110 transition-transform duration-300">
            <Screenshot3D className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
          </div>
        </div>

        {/* Text & Action Row */}
        <div className="mt-3.5 flex items-end justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-amber-400 transition-colors">
              Screenshot
            </h3>
            <span className="text-gray-400 text-[11px] mt-0.5">
              Capture an area
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FB8500] to-[#E63946] shadow-[0_0_12px_rgba(251,133,0,0.5)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <ChevronRight size={16} className="stroke-[2.5] ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
