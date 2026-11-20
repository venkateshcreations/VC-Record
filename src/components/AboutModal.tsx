import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HardDrive,
  Cpu,
  Globe,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Logo3D } from './Icons3D';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const portfolioUrl = 'https://venkateshcreations.github.io/portfolio/';

  const handleOpenPortfolio = () => {
    window.electronAPI?.openExternal?.(portfolioUrl);
  };

  const handleCopyLink = () => {
    window.electronAPI?.copyPath?.(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#141726]/95 border border-white/10 rounded-3xl p-7 shadow-2xl overflow-hidden cursor-default"
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header with 3D Logo */}
        <div className="flex items-center gap-4 mb-5 relative">
          <div className="p-2.5 rounded-2xl bg-[#1c2035] border border-white/10 shadow-lg">
            <Logo3D className="w-12 h-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">VC-Record</h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                v1.0.0 Pro
              </span>
            </div>
            <p className="text-xs text-blue-300/80 font-medium tracking-wide mt-0.5">
              Capture • Create • Share
            </p>
          </div>
        </div>

        {/* Developer / Creator Attribution Card */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 mb-5 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar Initials with Gradient Ring */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0070F3] to-[#00DFD8] p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-[#12141f] rounded-[10px] flex items-center justify-center font-bold text-white text-sm">
                  VA
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm tracking-tight">
                    Venkatesh Ammireddy
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                    Creator
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Globe size={11} className="text-cyan-400" />
                  <span>Portfolio & Projects</span>
                </p>
              </div>
            </div>

            {/* Reach Out & Copy Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleOpenPortfolio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0070F3] to-[#00B4D8] hover:opacity-90 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all"
                title="Open Portfolio Website in Browser"
              >
                <span>Reach Out</span>
                <ExternalLink size={12} />
              </button>

              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Copy Portfolio URL"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Website:</span>
            <button
              onClick={handleOpenPortfolio}
              className="text-cyan-400 hover:underline font-mono text-[11px] truncate max-w-[280px] text-right"
              title={portfolioUrl}
            >
              venkateshcreations.github.io/portfolio
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4 bg-[#181a29]/80 border border-white/5 rounded-2xl p-3">
          VC-Record is a lightweight, high-performance Windows desktop recording studio engineered
          for creators, developers, and gamers. Built with hardware-accelerated video pipelines,
          custom region capture, dual audio mixing, and 100% private offline storage.
        </p>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Zap size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-white">Hardware Accel</h4>
              <p className="text-[10px] text-gray-400">NVENC, QSV, AMF auto-detection</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <ShieldCheck size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-white">100% Private</h4>
              <p className="text-[10px] text-gray-400">Zero cloud uploads, offline only</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Cpu size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-white">60 FPS Native</h4>
              <p className="text-[10px] text-gray-400">Ultra-smooth low CPU recording</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <HardDrive size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-white">Local Library</h4>
              <p className="text-[10px] text-gray-400">Instant playback & quick export</p>
            </div>
          </div>
        </div>

        {/* Footer info & OK button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Ready for Windows 10 & 11</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#0070F3] to-[#00B4D8] text-white hover:opacity-90 active:scale-95 shadow-md shadow-blue-500/30 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
