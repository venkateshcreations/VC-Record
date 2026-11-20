import React from 'react';
import { Play, Pause, Square, Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface FloatingControlBarProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isMicMuted: boolean;
  isSystemMuted: boolean;
  onPauseResume: () => void;
  onStop: () => void;
  onToggleMic: () => void;
  onToggleSystemAudio: () => void;
  isSaving?: boolean;
}

export const FloatingControlBar: React.FC<FloatingControlBarProps> = ({
  isRecording,
  isPaused,
  duration,
  isMicMuted,
  isSystemMuted,
  onPauseResume,
  onStop,
  onToggleMic,
  onToggleSystemAudio,
  isSaving = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  if (!isRecording) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#1f1f1f]/95 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-white select-none">
        {/* Recording Status & Timer */}
        <div className="flex items-center gap-2 pl-1 pr-2 border-r border-white/10">
          <div
            className={`w-3 h-3 rounded-full ${
              isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
            }`}
          />
          <span className="font-mono text-sm font-semibold tracking-wider">
            {formatDuration(duration)}
          </span>
          {isPaused && (
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              PAUSED
            </span>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Pause / Resume Button */}
            <button
              onClick={onPauseResume}
              title={isPaused ? 'Resume Recording' : 'Pause Recording'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-200 hover:text-white transition-all"
            >
              {isPaused ? <Play size={16} className="fill-current" /> : <Pause size={16} />}
            </button>

            {/* Mic Toggle Button */}
            <button
              onClick={onToggleMic}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`p-2 rounded-xl active:scale-95 transition-all ${
                isMicMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* System Audio Status */}
            <button
              onClick={onToggleSystemAudio}
              title={isSystemMuted ? 'Unmute System Sound' : 'Mute System Sound'}
              className={`p-2 rounded-xl active:scale-95 transition-all ${
                isSystemMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isSystemMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Stop & Save Button */}
            <button
              onClick={onStop}
              disabled={isSaving}
              title="Stop Recording and Save"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium text-xs shadow-md shadow-red-500/30 transition-all disabled:opacity-50"
            >
              <Square size={13} className="fill-white" />
              <span>{isSaving ? 'Saving...' : 'Stop'}</span>
            </button>
          </>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          {isCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
    </div>
  );
};
