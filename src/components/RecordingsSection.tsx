import React, { useState, useMemo } from 'react';
import {
  Film,
  Play,
  FolderOpen,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  Music,
  Image as ImageIcon,
  Video as VideoIcon,
  Calendar,
  Pin
} from 'lucide-react';
import { RecordingItem } from '../types';
import { formatBytes, formatDuration, formatDate } from '../utils/formatters';

interface RecordingsSectionProps {
  recordings: RecordingItem[];
  saveDirectory: string;
  onPlay: (item: RecordingItem) => void;
  onOpenFolder: (item?: RecordingItem) => void;
  onRename: (item: RecordingItem, newName: string) => void;
  onDelete: (item: RecordingItem) => void;
}

export const RecordingsSection: React.FC<RecordingsSectionProps> = ({
  recordings,
  saveDirectory,
  onPlay,
  onOpenFolder,
  onRename,
  onDelete,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'screenshot'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size' | 'duration' | 'name'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<RecordingItem | null>(null);

  // Filter & search & sort
  const filteredRecordings = useMemo(() => {
    let result = recordings;

    // Filter type
    if (filter !== 'all') {
      result = result.filter((r) => r.type === filter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'size':
          return b.size - a.size;
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [recordings, filter, searchQuery, sortBy]);

  const handleCopyPath = (item: RecordingItem) => {
    window.electronAPI?.copyPath(item.path);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartRename = (item: RecordingItem) => {
    setEditingId(item.id);
    setEditingName(item.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSaveRename = (item: RecordingItem) => {
    if (editingName.trim() && editingName !== item.name) {
      onRename(item, editingName.trim());
    }
    setEditingId(null);
  };

  const getFormatBadgeStyle = (format: string, type: string) => {
    const f = format.toLowerCase();
    if (f === 'png' || f === 'jpg' || type === 'screenshot') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (f === 'mp3' || f === 'wav' || type === 'audio') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-blue-500/20 text-cyan-300 border-cyan-500/30';
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-2 pb-4 overflow-hidden relative">
      {/* 1. Header Row: Left Title & Count + Right Filter Tabs */}
      <div className="flex items-center justify-between mb-3 select-none">
        {/* Left: Glowing red indicator + Title + Pill Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
          <h2 className="text-white text-base font-bold tracking-tight">Recordings</h2>
          <span className="bg-[#1c2035] text-gray-200 text-xs px-2.5 py-0.5 rounded-full font-bold border border-white/10 shadow-sm">
            {recordings.length}
          </span>
        </div>

        {/* Right: Glassmorphic Capsule Filter Tabs */}
        <div className="flex items-center bg-[#141726]/90 p-1 rounded-2xl border border-white/[0.08] shadow-inner backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#0070F3] to-[#0091EA] text-white shadow-md shadow-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all ${
              filter === 'video'
                ? 'bg-gradient-to-r from-[#0070F3] to-[#0091EA] text-white shadow-md shadow-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all ${
              filter === 'audio'
                ? 'bg-gradient-to-r from-[#0070F3] to-[#0091EA] text-white shadow-md shadow-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => setFilter('screenshot')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all ${
              filter === 'screenshot'
                ? 'bg-gradient-to-r from-[#0070F3] to-[#0091EA] text-white shadow-md shadow-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Screenshots
          </button>
        </div>
      </div>

      {/* 2. Sub-Bar: Search Capsule + Sort Dropdown */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Search input with pill styling */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141726]/80 text-xs text-white placeholder-gray-500 pl-9 pr-4 py-2 rounded-xl border border-white/[0.08] focus:outline-none focus:border-cyan-500/60 shadow-inner transition-colors"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-gray-400 select-none">
          <ArrowUpDown size={13} className="text-gray-400" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#141726]/80 text-gray-200 text-xs py-1.5 px-3 rounded-xl border border-white/[0.08] focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="size">File size</option>
            <option value="duration">Duration</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* 3. Main Content: Recording Cards List OR Glass Empty State */}
      <div className="flex-1 overflow-y-auto pr-1 select-none space-y-2.5">
        {filteredRecordings.length === 0 ? (
          /* Glassmorphic Empty State */
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 bg-[#141726]/40 border border-white/[0.05] rounded-3xl backdrop-blur-md">
            <div className="relative flex items-center justify-center mb-3">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1e32] border border-white/10 flex items-center justify-center shadow-lg">
                <Film size={34} className="text-cyan-400/80 stroke-[1.6]" />
              </div>
              <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl pointer-events-none" />
            </div>

            <h3 className="text-white text-base font-bold tracking-tight">
              {recordings.length === 0 ? 'No Recordings Yet' : 'No matching recordings found'}
            </h3>

            <p className="text-gray-400 text-xs mt-1.5 max-w-md font-mono select-text">
              Recordings are saved to{' '}
              <span
                onClick={() => onOpenFolder()}
                className="hover:underline cursor-pointer text-cyan-400 font-medium"
              >
                {saveDirectory || 'Videos\\VC-Record\\'}
              </span>
            </p>
          </div>
        ) : (
          /* Recordings List Items matching reference screenshot */
          filteredRecordings.map((item, index) => (
            <div
              key={item.id}
              className={`group relative flex items-center justify-between p-3 rounded-2xl bg-[#141726]/80 hover:bg-[#191d32]/90 backdrop-blur-xl border transition-all duration-200 shadow-lg ${
                index === 0
                  ? 'border-cyan-500/40 shadow-cyan-500/10'
                  : 'border-white/[0.07] hover:border-cyan-500/30 hover:shadow-cyan-500/5'
              }`}
            >
              {/* Left Group: Play/Pin icon + Thumbnail + File Info */}
              <div
                className="flex items-center flex-1 min-w-0 cursor-pointer mr-3"
                onClick={() => onPlay(item)}
              >
                {/* 1. Leading Play button for 1st item or Cyan Pin for others */}
                {index === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(item);
                    }}
                    title="Play Recording"
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0091ea] to-[#00e5ff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,229,255,0.45)] hover:scale-105 active:scale-95 transition-all flex-shrink-0 mr-3"
                  >
                    <Play size={15} className="fill-white ml-0.5" />
                  </button>
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 mr-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <Pin size={12} className="rotate-45" />
                    </div>
                  </div>
                )}

                {/* 2. Thumbnail Container */}
                <div className="relative w-16 h-11 rounded-xl overflow-hidden bg-[#0d0f19] border border-white/10 flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:border-cyan-500/40 transition-colors">
                  {item.thumbnailPath ? (
                    <img
                      src={`file://${item.thumbnailPath.replace(/\\/g, '/')}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : item.type === 'video' ? (
                    <VideoIcon size={20} className="text-red-400" />
                  ) : item.type === 'audio' ? (
                    <div className="flex flex-col items-center">
                      <Music size={16} className="text-emerald-400 mb-0.5" />
                    </div>
                  ) : (
                    <ImageIcon size={20} className="text-amber-400" />
                  )}

                  {/* Duration badge overlay */}
                  {item.duration !== undefined && item.duration > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/85 text-[10px] text-gray-200 px-1.5 py-0.2 rounded font-mono font-medium shadow-sm">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                  {item.type === 'audio' && (!item.duration || item.duration === 0) && (
                    <div className="absolute bottom-1 right-1 bg-black/85 text-[10px] text-gray-200 px-1.5 py-0.2 rounded font-mono">
                      00:00
                    </div>
                  )}
                </div>

                {/* 3. Title and Metadata */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(item);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="bg-[#0e101a] text-white text-xs px-2.5 py-1 rounded-lg border border-cyan-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(item)}
                        className="text-xs font-semibold text-cyan-400 hover:underline"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h4
                      className="text-white text-[13px] font-bold truncate group-hover:text-cyan-400 transition-colors"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    <Calendar size={12} className="text-gray-500 flex-shrink-0" />
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="text-gray-600">•</span>
                    <span>{formatBytes(item.size)}</span>
                    <span className="text-gray-600">•</span>
                    <span
                      className={`uppercase text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider border ${getFormatBadgeStyle(
                        item.format,
                        item.type
                      )}`}
                    >
                      {item.format}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Group: Action Buttons */}
              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onPlay(item)}
                  title="Play"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Play size={15} className="fill-current" />
                </button>

                <button
                  onClick={() => onOpenFolder(item)}
                  title="Open folder location"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <FolderOpen size={15} />
                </button>

                <button
                  onClick={() => handleCopyPath(item)}
                  title="Copy path"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  {copiedId === item.id ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>

                <button
                  onClick={() => handleStartRename(item)}
                  title="Rename"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Edit2 size={15} />
                </button>

                <button
                  onClick={() => setDeleteConfirmItem(item)}
                  title="Delete"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Bottom Row: Library Status & "Ready to record anytime!" Pill */}
      <div className="flex items-center justify-between mt-3 pt-2 select-none border-t border-white/[0.04]">
        <span className="text-[11px] text-gray-500 font-mono">
          Showing {filteredRecordings.length} of {recordings.length} recordings
        </span>

        {/* Floating Ambient Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-cyan-500/10">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 bg-cyan-400 h-2 rounded-full animate-pulse" />
            <span className="w-1 bg-cyan-400 h-3 rounded-full animate-pulse delay-75" />
            <span className="w-1 bg-cyan-400 h-1.5 rounded-full animate-pulse delay-150" />
          </div>
          <span>Ready to record anytime!</span>
        </div>
      </div>

      {/* 5. Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141726] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-base mb-1.5">Delete Recording?</h3>
            <p className="text-gray-400 text-xs mb-5">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">{deleteConfirmItem.name}</span>? This will
              remove the file from your computer.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmItem);
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
