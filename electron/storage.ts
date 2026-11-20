import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppSettings, RecordingItem, DiskSpaceInfo } from '../src/types';

const execAsync = promisify(exec);

export class StorageManager {
  private baseDir: string;
  private settingsFile: string;
  private dbFile: string;
  private settings: AppSettings;
  private recordings: RecordingItem[] = [];

  constructor() {
    // Default Videos path on Windows: ~/Videos/VC-Record
    const homeDir = app.getPath('videos') || app.getPath('home');
    this.baseDir = path.join(homeDir, 'VC-Record');

    const appData = app.getPath('userData');
    this.settingsFile = path.join(appData, 'settings.json');
    this.dbFile = path.join(appData, 'recordings.json');

    this.settings = this.loadSettings();
    this.ensureDirectories();
    this.loadRecordings();
  }

  public ensureDirectories() {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'Videos'),
      path.join(this.baseDir, 'Audio'),
      path.join(this.baseDir, 'Screenshots'),
      path.join(this.baseDir, 'Thumbnails')
    ];

    dirs.forEach(d => {
      if (!fs.existsSync(d)) {
        try {
          fs.mkdirSync(d, { recursive: true });
        } catch (e) {
          console.error('Failed to create directory:', d, e);
        }
      }
    });
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.recordingsDir) {
      this.baseDir = newSettings.recordingsDir;
      this.ensureDirectories();
    }
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write settings:', e);
    }
    return this.settings;
  }

  private loadSettings(): AppSettings {
    const defaults: AppSettings = {
      startOnBoot: false,
      minimizeToTray: false,
      startMinimized: false,
      showNotifications: true,
      confirmDelete: true,

      defaultCaptureMode: 'fullscreen',
      defaultVideoFormat: 'mp4',
      defaultAudioFormat: 'mp3',
      defaultResolution: 'original',
      defaultFps: 60,
      defaultQuality: 'high',
      hwAccelEnabled: true,
      showCursor: true,
      countdownDuration: 3,

      micEnabled: true,
      systemAudioEnabled: true,
      defaultMicDevice: 'default',
      defaultSystemAudioDevice: 'default',
      micVolume: 100,

      recordingsDir: this.baseDir,
      screenshotsDir: path.join(this.baseDir, 'Screenshots'),

      shortcutStartStop: 'CommandOrControl+Alt+R',
      shortcutPauseResume: 'CommandOrControl+Alt+P',
      shortcutScreenshot: 'CommandOrControl+Alt+S',
      shortcutToggleBar: 'CommandOrControl+Alt+H',
    };

    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read settings file, using defaults');
    }

    return defaults;
  }

  public getRecordings(): RecordingItem[] {
    this.syncRecordingsWithDisk();
    return this.recordings;
  }

  public addRecording(item: RecordingItem): RecordingItem {
    this.recordings.unshift(item);
    this.persistRecordings();
    return item;
  }

  public renameRecording(id: string, newBaseName: string): RecordingItem | null {
    const index = this.recordings.findIndex(r => r.id === id);
    if (index === -1) return null;

    const item = this.recordings[index];
    const oldPath = item.path;
    const ext = path.extname(oldPath);
    const cleanName = newBaseName.endsWith(ext) ? newBaseName : `${newBaseName}${ext}`;
    const newPath = path.join(path.dirname(oldPath), cleanName);

    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      item.name = cleanName;
      item.path = newPath;
      this.persistRecordings();
      return item;
    } catch (e) {
      console.error('Failed to rename file:', e);
      throw e;
    }
  }

  public deleteRecording(id: string): boolean {
    const index = this.recordings.findIndex(r => r.id === id);
    if (index === -1) return false;

    const item = this.recordings[index];
    try {
      if (fs.existsSync(item.path)) {
        fs.unlinkSync(item.path);
      }
      if (item.thumbnailPath && fs.existsSync(item.thumbnailPath)) {
        try {
          fs.unlinkSync(item.thumbnailPath);
        } catch (e) {
          // ignore thumbnail delete error
        }
      }
      this.recordings.splice(index, 1);
      this.persistRecordings();
      return true;
    } catch (e) {
      console.error('Failed to delete file:', e);
      return false;
    }
  }

  private loadRecordings() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        this.recordings = JSON.parse(raw);
      }
    } catch (e) {
      this.recordings = [];
    }
    this.syncRecordingsWithDisk();
  }

  private persistRecordings() {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.recordings, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save recordings DB:', e);
    }
  }

  private syncRecordingsWithDisk() {
    // 1. Remove deleted files from DB
    this.recordings = this.recordings.filter(item => fs.existsSync(item.path));

    // 2. Discover any recordings directly created in directories
    const subdirs = [
      { dir: path.join(this.baseDir, 'Videos'), type: 'video' as const },
      { dir: path.join(this.baseDir, 'Audio'), type: 'audio' as const },
      { dir: path.join(this.baseDir, 'Screenshots'), type: 'screenshot' as const }
    ];

    const knownPaths = new Set(this.recordings.map(r => path.resolve(r.path)));

    subdirs.forEach(({ dir, type }) => {
      if (!fs.existsSync(dir)) return;
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const resolved = path.resolve(fullPath);
          if (knownPaths.has(resolved)) return;

          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) return;

          const ext = path.extname(file).toLowerCase();
          const validVideo = ['.mp4', '.mkv', '.webm'];
          const validAudio = ['.mp3', '.wav', '.m4a', '.ogg'];
          const validScreen = ['.png', '.jpg', '.jpeg'];

          if (type === 'video' && !validVideo.includes(ext)) return;
          if (type === 'audio' && !validAudio.includes(ext)) return;
          if (type === 'screenshot' && !validScreen.includes(ext)) return;

          this.recordings.push({
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file,
            path: fullPath,
            type,
            format: ext.replace('.', ''),
            size: stat.size,
            createdAt: stat.birthtimeMs || stat.mtimeMs,
          });
          knownPaths.add(resolved);
        });
      } catch (e) {
        console.warn('Error syncing directory:', dir, e);
      }
    });

    // Sort newest first
    this.recordings.sort((a, b) => b.createdAt - a.createdAt);
  }

  public async getDiskSpace(): Promise<DiskSpaceInfo> {
    try {
      const driveLetter = path.parse(this.baseDir).root.replace('\\', '');
      // On Windows PowerShell: Get-PSDrive C
      const cmd = `powershell -Command "(Get-PSDrive '${driveLetter.replace(':', '')}').Free, (Get-PSDrive '${driveLetter.replace(':', '')}').Used"`;
      const { stdout } = await execAsync(cmd);
      const lines = stdout.trim().split('\n').map(l => parseFloat(l.trim()));
      const freeBytes = lines[0] || 0;
      const usedBytes = lines[1] || 0;
      const totalBytes = freeBytes + usedBytes;

      return {
        free: freeBytes,
        size: totalBytes,
        freeFormatted: this.formatBytes(freeBytes),
        totalFormatted: this.formatBytes(totalBytes),
      };
    } catch (e) {
      return {
        free: 100 * 1024 * 1024 * 1024,
        size: 500 * 1024 * 1024 * 1024,
        freeFormatted: '100 GB',
        totalFormatted: '500 GB',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  public getBaseDir(): string {
    return this.baseDir;
  }
}
