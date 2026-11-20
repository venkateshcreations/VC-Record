import React from 'react';
import { Folder, Settings, Minus, Square, X } from 'lucide-react';
import { Logo3D } from './Icons3D';

interface HeaderProps {
  onOpenFolder: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFolder, onOpenSettings }) => {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow?.();
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-6 select-none bg-[#12141f]/90 backdrop-blur-xl border-b border-white/[0.06] app-drag-region relative z-30">
      {/* Brand: 3D Logo + Title + Subtitle */}
      <div className="flex items-center gap-3.5 no-drag">
        <Logo3D className="w-10 h-10 hover:scale-105 transition-transform duration-200" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              VC-Record
            </span>
          </div>
          <span className="text-gray-400 text-[11px] font-medium tracking-wide">
            Capture • Create • Share
          </span>
        </div>
      </div>

      {/* Top-Right Quick Actions & Window Controls */}
      <div
        className="flex items-center gap-1.5 no-drag relative z-50 pointer-events-auto"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={onOpenFolder}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Open Recordings Folder"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 cursor-pointer"
        >
          <Folder size={17} />
        </button>

        <button
          onClick={onOpenSettings}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Settings"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 cursor-pointer"
        >
          <Settings size={17} />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-2" />

        <button
          onClick={handleMinimize}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Minimize"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <Minus size={15} />
        </button>

        <button
          onClick={handleMaximize}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Maximize"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <Square size={13} />
        </button>

        <button
          onClick={handleClose}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Close VC-Record"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/80 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
};
