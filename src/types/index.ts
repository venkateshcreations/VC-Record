export type CaptureMode = 'fullscreen' | 'display' | 'region' | 'window';

export type VideoFormat = 'mp4' | 'mkv';
export type AudioFormat = 'wav' | 'mp3';
export type VideoQuality = 'low' | 'medium' | 'high';
export type Resolution = 'original' | '1080p' | '720p' | '480p';
export type FrameRate = 15 | 24 | 30 | 60;
export type CountdownDuration = 0 | 3 | 5 | 10;
export type OverlayShape = 'circle' | 'rect';
export type OverlayPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type OverlaySize = 'sm' | 'md' | 'lg';

export type RecordingType = 'video' | 'audio' | 'screenshot';

export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string;
  display_id?: string;
  appIcon?: string;
}

export interface MediaDeviceItem {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface RecordingItem {
  id: string;
  name: string;
  path: string;
  type: RecordingType;
  format: string;
  size: number; // in bytes
  createdAt: number; // timestamp
  duration?: number; // in seconds
  thumbnailPath?: string;
  width?: number;
  height?: number;
  fps?: number;
}

export interface AppSettings {
  // General
  startOnBoot: boolean;
  minimizeToTray: boolean;
  startMinimized: boolean;
  showNotifications: boolean;
  confirmDelete: boolean;
  
  // Recording Defaults
  defaultCaptureMode: CaptureMode;
  defaultVideoFormat: VideoFormat;
  defaultAudioFormat: AudioFormat;
  defaultResolution: Resolution;
  defaultFps: FrameRate;
  defaultQuality: VideoQuality;
  hwAccelEnabled: boolean;
  showCursor: boolean;
  countdownDuration: CountdownDuration;
  
  // Audio Defaults
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  defaultMicDevice: string;
  defaultSystemAudioDevice: string;
  micVolume: number;
  
  // Storage
  recordingsDir: string;
  screenshotsDir: string;
  
  // Shortcuts
  shortcutStartStop: string;
  shortcutPauseResume: string;
  shortcutScreenshot: string;
  shortcutToggleBar: string;
}

export interface RegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoProcessingOptions {
  format: VideoFormat;
  quality: VideoQuality;
  hwAccel: boolean;
  fps: FrameRate;
  resolution: Resolution;
  targetWidth?: number;
  targetHeight?: number;
  duration?: number;
  customName?: string;
}

export interface AudioProcessingOptions {
  format: AudioFormat;
  quality: string;
  duration?: number;
  customName?: string;
}

export interface DiskSpaceInfo {
  free: number;
  size: number;
  freeFormatted: string;
  totalFormatted: string;
}
