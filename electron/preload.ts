import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  RecordingItem,
  ScreenSource,
  VideoProcessingOptions,
  AudioProcessingOptions,
  RegionRect,
  DiskSpaceInfo
} from '../src/types';

export const API = {
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Screen and Desktop Capture Sources
  getScreenSources: (): Promise<ScreenSource[]> => ipcRenderer.invoke('sources:get-screens'),

  // Media Processing & Saving
  saveVideoRecording: (
    buffer: ArrayBuffer,
    options: VideoProcessingOptions
  ): Promise<RecordingItem> => ipcRenderer.invoke('recording:save-video', buffer, options),

  saveAudioRecording: (
    buffer: ArrayBuffer,
    options: AudioProcessingOptions
  ): Promise<RecordingItem> => ipcRenderer.invoke('recording:save-audio', buffer, options),

  saveScreenshot: (
    buffer: ArrayBuffer,
    format: 'png' | 'jpg',
    rect?: RegionRect
  ): Promise<RecordingItem> => ipcRenderer.invoke('screenshot:save', buffer, format, rect),

  copyImageToClipboard: (buffer: ArrayBuffer): Promise<boolean> =>
    ipcRenderer.invoke('screenshot:copy-clipboard', buffer),

  // Floating Control Bar
  showFloatingBar: (initialState: any) => ipcRenderer.invoke('floating-bar:show', initialState),
  hideFloatingBar: () => ipcRenderer.invoke('floating-bar:hide'),
  updateFloatingBar: (state: any) => ipcRenderer.invoke('floating-bar:update', state),
  onFloatingBarAction: (callback: (action: string) => void) => {
    const handler = (_: any, action: string) => callback(action);
    ipcRenderer.on('floating-bar:action', handler);
    return () => ipcRenderer.removeListener('floating-bar:action', handler);
  },

  // Interactive Region Selection
  startRegionSelection: (): Promise<RegionRect | null> =>
    ipcRenderer.invoke('region:start-selection'),
  getRegionSnapshot: (): Promise<string> =>
    ipcRenderer.invoke('region:get-snapshot'),
  sendRegionResult: (rect: RegionRect | null) =>
    ipcRenderer.send('region:selected', rect),
  showMainWindow: () => ipcRenderer.invoke('window:show'),
  hideMainWindow: () => ipcRenderer.invoke('window:hide'),

  // Library & File Management
  getRecordings: (): Promise<RecordingItem[]> => ipcRenderer.invoke('library:get-recordings'),
  openInFolder: (filePath?: string): Promise<boolean> =>
    ipcRenderer.invoke('library:open-folder', filePath),
  openFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('library:open-file', filePath),
  renameRecording: (id: string, newName: string): Promise<RecordingItem | null> =>
    ipcRenderer.invoke('library:rename', id, newName),
  deleteRecording: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('library:delete', id),
  copyPath: (text: string): Promise<void> =>
    ipcRenderer.invoke('library:copy-path', text),
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('library:select-folder'),

  // Settings & System
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:save', settings),
  getDiskSpace: (): Promise<DiskSpaceInfo> => ipcRenderer.invoke('system:get-disk-space'),
  checkHwAccel: (): Promise<string | null> => ipcRenderer.invoke('system:check-hw-accel'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('system:open-external', url),

  // Shortcuts Listener
  onShortcut: (callback: (action: string) => void) => {
    const handler = (_: any, action: string) => callback(action);
    ipcRenderer.on('shortcut:triggered', handler);
    return () => ipcRenderer.removeListener('shortcut:triggered', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', API);

export type ElectronAPI = typeof API;
