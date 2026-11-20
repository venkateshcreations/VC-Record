import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FolderOpen,
  Trash2,
  Copy,
  Check,
  X,
  Music,
  Video as VideoIcon
} from 'lucide-react';
import { RecordingItem } from '../types';
import { formatBytes, formatDuration, formatDate } from '../utils/formatters';

interface MediaPlayerModalProps {
  item: RecordingItem | null;
  onClose: () => void;
  onOpenFolder: (item: RecordingItem) => void;
  onDelete: (item: RecordingItem) => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  item,
  onClose,
  onOpenFolder,
  onDelete,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  if (!item) return null;

  const mediaSrc = `file://${item.path.replace(/\\/g, '/')}`;

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    setCurrentTime(mediaRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (mediaRef.current) {
      mediaRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    if (isMuted) {
      mediaRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      mediaRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (mediaRef.current && mediaRef.current.requestFullscreen) {
      mediaRef.current.requestFullscreen();
    }
  };

  const handleCopyPath = () => {
    window.electronAPI?.copyPath(item.path);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (item) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [item, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              {item.type === 'video' ? (
                <VideoIcon size={15} className="text-red-400" />
              ) : item.type === 'audio' ? (
                <Music size={15} className="text-emerald-400" />
              ) : null}
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
              <p className="text-gray-400 text-[11px]">
                {formatDate(item.createdAt)} • {formatBytes(item.size)} •{' '}
                <span className="uppercase">{item.format}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Media Player Area */}
        <div className="relative bg-black flex items-center justify-center min-h-[340px] max-h-[500px] overflow-hidden group">
          {item.type === 'video' ? (
            <video
              ref={mediaRef as any}
              src={mediaSrc}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="max-h-[460px] max-w-full object-contain cursor-pointer"
            />
          ) : item.type === 'audio' ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Music size={36} className="text-emerald-400" />
              </div>
              <span className="text-white text-sm font-medium">{item.name}</span>
              <audio
                ref={mediaRef as any}
                src={mediaSrc}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <img src={mediaSrc} alt="" className="max-h-[460px] max-w-full object-contain" />
          )}

          {/* Central Play/Pause overlay button */}
          {item.type !== 'screenshot' && (
            <button
              onClick={togglePlay}
              className={`absolute w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 scale-100'
              }`}
            >
              {isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} className="fill-current ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Player Controls (for video & audio) */}
        {item.type !== 'screenshot' && (
          <div className="px-5 py-3 bg-[#1e1e1e] border-t border-white/5 space-y-2">
            {/* Scrubber slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-gray-400 w-10 text-right">
                {formatDuration(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#0F7DFD]"
              />
              <span className="text-[11px] font-mono text-gray-400 w-10">
                {formatDuration(duration || item.duration || 0)}
              </span>
            </div>

            {/* Bottom bar with volume and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#0F7DFD]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenFolder(item)}
                  title="Show in Windows Explorer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FolderOpen size={14} />
                  Open Folder
                </button>

                <button
                  onClick={handleCopyPath}
                  title="Copy Path"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {isCopied ? 'Copied' : 'Copy Path'}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete ${item.name}?`)) {
                      onDelete(item);
                      onClose();
                    }
                  }}
                  title="Delete Recording"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>

                {item.type === 'video' && (
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Maximize size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
