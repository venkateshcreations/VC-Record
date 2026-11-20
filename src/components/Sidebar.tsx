import React from 'react';
import { Home, Folder, Settings, Info } from 'lucide-react';

export type NavTab = 'home' | 'recordings' | 'settings' | 'about';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-20 bg-[#12141f]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col items-center justify-between py-5 select-none relative z-20">
      {/* Top Nav Buttons */}
      <div className="flex flex-col items-center gap-4 w-full px-2.5">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative ${
            activeTab === 'home'
              ? 'bg-gradient-to-b from-[#1E88E5] to-[#1565C0] text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Home size={22} className={activeTab === 'home' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>

        {/* 2. My Recordings */}
        <button
          onClick={() => onTabChange('recordings')}
          className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative ${
            activeTab === 'recordings'
              ? 'bg-gradient-to-b from-[#1E88E5] to-[#1565C0] text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Folder size={22} className={activeTab === 'recordings' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
          <span className="text-[10px] font-medium mt-1 leading-tight text-center">My Rec</span>
        </button>

        {/* 3. Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative ${
            activeTab === 'settings'
              ? 'bg-gradient-to-b from-[#1E88E5] to-[#1565C0] text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Settings size={22} className={activeTab === 'settings' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>

        {/* 4. About */}
        <button
          onClick={() => onTabChange('about')}
          className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative ${
            activeTab === 'about'
              ? 'bg-gradient-to-b from-[#1E88E5] to-[#1565C0] text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Info size={22} className={activeTab === 'about' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
          <span className="text-[10px] font-medium mt-1">About</span>
        </button>
      </div>

      {/* Bottom Brand Badge with ambient glow */}
      <div className="flex flex-col items-center text-center relative px-1">
        {/* Colorful flare aura */}
        <div className="absolute -bottom-2 w-16 h-12 bg-gradient-to-tr from-pink-500/25 via-purple-500/25 to-blue-500/25 rounded-full blur-xl pointer-events-none" />
        <span className="text-[11px] font-bold text-gray-300 tracking-wide">VC-Record</span>
        <span className="text-[9px] font-mono text-gray-500">v1.0.0</span>
      </div>
    </aside>
  );
};
