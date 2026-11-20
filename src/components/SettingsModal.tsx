import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Keyboard,
  Sliders,
  Info,
  FolderOpen,
  X,
  Check,
  Cpu,
  Volume2
} from 'lucide-react';
import { AppSettings, DiskSpaceInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'recording' | 'audio' | 'storage' | 'shortcuts' | 'about'>('general');
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [diskSpace, setDiskSpace] = useState<DiskSpaceInfo | null>(null);
  const [hwEncoder, setHwEncoder] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setSettings(initialSettings);

    // Fetch disk space
    window.electronAPI?.getDiskSpace().then((info) => {
      setDiskSpace(info);
    });

    // Fetch hardware encoder status
    window.electronAPI?.checkHwAccel().then((enc) => {
      setHwEncoder(enc);
    });
  }, [isOpen, initialSettings]);

  const handleChange = (key: keyof AppSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onSaveSettings({ [key]: value });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI?.selectFolder();
    if (selected) {
      handleChange('recordingsDir', selected);
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
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-2xl h-[520px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#0F7DFD]" />
            <h2 className="text-white font-semibold text-base">VC-Record Settings</h2>
          </div>
          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check size={13} /> Saved
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings Body with Sidebar Tabs */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-44 bg-[#1e1e1e] border-r border-white/5 p-2.5 space-y-1 select-none">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'general'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders size={15} /> General
            </button>

            <button
              onClick={() => setActiveTab('recording')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'recording'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cpu size={15} /> Recording
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'audio'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Volume2 size={15} /> Audio
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'storage'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HardDrive size={15} /> Storage
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'shortcuts'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Keyboard size={15} /> Shortcuts
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'about'
                  ? 'bg-[#0F7DFD] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info size={15} /> About
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-5 select-none">
            {/* 1. General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  General Preferences
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">Start on Windows Startup</span>
                      <span className="text-[11px] text-gray-400">Launch VC-Record when you log into Windows</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.startOnBoot}
                      onChange={(e) => handleChange('startOnBoot', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">Minimize to System Tray</span>
                      <span className="text-[11px] text-gray-400">Keep application in background tray on close</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.minimizeToTray}
                      onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">Show Recording Notifications</span>
                      <span className="text-[11px] text-gray-400">Display desktop notification when recordings finish</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showNotifications}
                      onChange={(e) => handleChange('showNotifications', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">Confirm Before Deleting</span>
                      <span className="text-[11px] text-gray-400">Show prompt before permanently removing files</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.confirmDelete}
                      onChange={(e) => handleChange('confirmDelete', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2. Recording Tab */}
            {activeTab === 'recording' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  Recording Defaults
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Default Video Format</label>
                    <select
                      value={settings.defaultVideoFormat}
                      onChange={(e) => handleChange('defaultVideoFormat', e.target.value)}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="mp4">MP4 (Faststart & Broad Compatibility)</option>
                      <option value="mkv">MKV (Crash Resilient)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Default Frame Rate</label>
                    <select
                      value={settings.defaultFps}
                      onChange={(e) => handleChange('defaultFps', parseInt(e.target.value))}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="60">60 FPS (Ultra Smooth)</option>
                      <option value="30">30 FPS (Standard)</option>
                      <option value="24">24 FPS (Cinematic)</option>
                      <option value="15">15 FPS (Compact)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Default Resolution</label>
                    <select
                      value={settings.defaultResolution}
                      onChange={(e) => handleChange('defaultResolution', e.target.value)}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="original">Original Screen Resolution</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Encoding Quality</label>
                    <select
                      value={settings.defaultQuality}
                      onChange={(e) => handleChange('defaultQuality', e.target.value)}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="high">High Quality (Low Compression)</option>
                      <option value="medium">Medium Quality (Balanced)</option>
                      <option value="low">Low Quality (Smallest File)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Countdown Duration</label>
                    <select
                      value={settings.countdownDuration}
                      onChange={(e) => handleChange('countdownDuration', parseInt(e.target.value))}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="3">3 seconds</option>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="0">Disabled (Start instantly)</option>
                    </select>
                  </div>
                </div>

                {/* Hardware acceleration info card */}
                <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-white/5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Cpu size={15} className="text-[#0F7DFD]" />
                      Hardware Video Acceleration
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.hwAccelEnabled}
                      onChange={(e) => handleChange('hwAccelEnabled', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Detected hardware encoder:{' '}
                    <span className="text-emerald-400 font-mono">
                      {hwEncoder ? hwEncoder.toUpperCase() : 'None (using software libx264)'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 3. Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  Audio Configuration
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Default Audio Format</label>
                    <select
                      value={settings.defaultAudioFormat}
                      onChange={(e) => handleChange('defaultAudioFormat', e.target.value)}
                      className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
                    >
                      <option value="mp3">MP3 (Compressed 192kbps)</option>
                      <option value="wav">WAV (Uncompressed Lossless PCM)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">Microphone Enabled by Default</span>
                      <span className="text-[11px] text-gray-400">Record mic audio during screen recording</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.micEnabled}
                      onChange={(e) => handleChange('micEnabled', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-white block">System Audio Enabled by Default</span>
                      <span className="text-[11px] text-gray-400">Capture computer sound / WASAPI loopback</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.systemAudioEnabled}
                      onChange={(e) => handleChange('systemAudioEnabled', e.target.checked)}
                      className="accent-[#0F7DFD] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  Storage Locations & Disk Space
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Recordings Directory</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={settings.recordingsDir}
                        className="flex-1 bg-[#1c1c1c] text-xs text-gray-300 p-2 rounded-xl border border-white/10 font-mono"
                      />
                      <button
                        onClick={handleSelectFolder}
                        className="px-3 py-2 bg-[#333] hover:bg-[#3d3d3d] text-white text-xs font-medium rounded-xl transition-colors"
                      >
                        Browse
                      </button>
                      <button
                        onClick={() => window.electronAPI?.openInFolder(settings.recordingsDir)}
                        className="px-3 py-2 bg-[#0F7DFD] hover:bg-blue-600 text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <FolderOpen size={14} /> Open
                      </button>
                    </div>
                  </div>

                  {/* Disk space card */}
                  {diskSpace && (
                    <div className="p-4 rounded-xl bg-[#1c1c1c] border border-white/5 space-y-2 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <HardDrive size={15} className="text-[#0F7DFD]" /> Available Disk Space
                        </span>
                        <span className="text-gray-300 font-mono">
                          {diskSpace.freeFormatted} free of {diskSpace.totalFormatted}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F7DFD] rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                5,
                                ((diskSpace.size - diskSpace.free) / (diskSpace.size || 1)) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  Global Keyboard Shortcuts
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5">
                    <div>
                      <span className="text-xs font-medium text-white block">Start / Stop Recording</span>
                      <span className="text-[11px] text-gray-400">Quick toggle screen recording</span>
                    </div>
                    <kbd className="px-2.5 py-1 bg-[#2a2a2a] text-gray-300 border border-white/10 rounded-lg text-xs font-mono">
                      {(settings.shortcutStartStop || 'Ctrl+Alt+R').replace(/CommandOrControl/gi, 'Ctrl').replace(/Command/gi, 'Ctrl')}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5">
                    <div>
                      <span className="text-xs font-medium text-white block">Pause / Resume Recording</span>
                      <span className="text-[11px] text-gray-400">Temporarily halt recording</span>
                    </div>
                    <kbd className="px-2.5 py-1 bg-[#2a2a2a] text-gray-300 border border-white/10 rounded-lg text-xs font-mono">
                      {(settings.shortcutPauseResume || 'Ctrl+Alt+P').replace(/CommandOrControl/gi, 'Ctrl').replace(/Command/gi, 'Ctrl')}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-white/5">
                    <div>
                      <span className="text-xs font-medium text-white block">Capture Screenshot</span>
                      <span className="text-[11px] text-gray-400">Instantly grab screen</span>
                    </div>
                    <kbd className="px-2.5 py-1 bg-[#2a2a2a] text-gray-300 border border-white/10 rounded-lg text-xs font-mono">
                      {(settings.shortcutScreenshot || 'Ctrl+Alt+S').replace(/CommandOrControl/gi, 'Ctrl').replace(/Command/gi, 'Ctrl')}
                    </kbd>
                  </div>
                </div>
              </div>
            )}

            {/* 6. About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold border-b border-white/5 pb-2">
                  About VC-Record
                </h3>

                <div className="p-4 rounded-xl bg-[#1c1c1c] border border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0070F3] to-[#00DFD8] p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-[#12141f] rounded-[9px] flex items-center justify-center font-bold text-white text-xs">
                        VA
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-sm">VC-Record Pro</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                          v1.0.0
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Created by <span className="text-white font-medium">Venkatesh Ammireddy</span>
                      </p>
                    </div>
                  </div>

                  {/* Portfolio link */}
                  <div className="p-2.5 rounded-lg bg-blue-900/20 border border-blue-500/20 flex items-center justify-between text-xs">
                    <span className="text-gray-300">Creator Portfolio:</span>
                    <button
                      onClick={() => window.electronAPI?.openExternal?.('https://venkateshcreations.github.io/portfolio/')}
                      className="text-cyan-400 hover:underline font-mono text-[11px]"
                    >
                      venkateshcreations.github.io/portfolio
                    </button>
                  </div>

                  <p className="text-gray-300 text-xs leading-relaxed">
                    A fast, native-feeling screen recording suite built for Windows 10 & 11.
                    Captures full screens, custom regions, webcam with PiP compositing, microphone and
                    WASAPI system loopback audio, powered by bundled FFmpeg hardware-accelerated encoding.
                  </p>

                  <div className="text-[11px] text-gray-400 pt-2 border-t border-white/5 space-y-1">
                    <p>• 100% Local: No registration, no telemetry, no cloud dependencies.</p>
                    <p>• Encoding: Hardware Accelerated (NVENC / QSV / AMF) with libx264 CPU fallback.</p>
                    <p>• Audio: High definition WASAPI loopback & AAC / lossless PCM WAV.</p>
                    <p>• License: Open Source (MIT License).</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
