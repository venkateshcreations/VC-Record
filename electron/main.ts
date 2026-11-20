import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  shell,
  dialog,
  clipboard,
  nativeImage,
  Tray,
  Menu,
  globalShortcut,
  Notification
} from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { StorageManager } from './storage';
import { FFmpegHelper } from './ffmpegHelper';
import { VideoProcessingOptions, AudioProcessingOptions, RegionRect } from '../src/types';

let mainWindow: BrowserWindow | null = null;
let floatingBarWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const storage = new StorageManager();
const ffmpegHelper = new FFmpegHelper();

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getAppIcon(): string | undefined {
  const candidates = [
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

function createMainWindow() {
  const iconPath = getAppIcon();
  mainWindow = new BrowserWindow({
    width: 980,
    height: 700,
    minWidth: 880,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0e111a',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const devUrl = 'http://localhost:5173';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(() => {
      mainWindow?.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    const settings = storage.getSettings();
    if (settings.minimizeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = getAppIcon();
  if (!iconPath) return;
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('VC-Record – Windows Screen Recorder');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open VC-Record',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Record Screen',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('shortcut:triggered', 'start-recording');
      },
    },
    {
      label: 'Take Screenshot',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('shortcut:triggered', 'take-screenshot');
      },
    },
    { type: 'separator' },
    {
      label: 'Open Recordings Folder',
      click: () => {
        shell.openPath(storage.getBaseDir());
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const settings = storage.getSettings();

  try {
    if (settings.shortcutStartStop) {
      globalShortcut.register(settings.shortcutStartStop, () => {
        mainWindow?.webContents.send('shortcut:triggered', 'toggle-recording');
      });
    }
    if (settings.shortcutPauseResume) {
      globalShortcut.register(settings.shortcutPauseResume, () => {
        mainWindow?.webContents.send('shortcut:triggered', 'pause-recording');
      });
    }
    if (settings.shortcutScreenshot) {
      globalShortcut.register(settings.shortcutScreenshot, () => {
        mainWindow?.webContents.send('shortcut:triggered', 'take-screenshot');
      });
    }
  } catch (err) {
    console.warn('Failed to register global shortcut:', err);
  }
}

// ----------------------------------------------------
// IPC Handler Registrations
// ----------------------------------------------------

function setupIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    const settings = storage.getSettings();
    if (settings.minimizeToTray) {
      mainWindow?.hide();
    } else {
      isQuitting = true;
      app.quit();
    }
  });

  ipcMain.handle('window:show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  ipcMain.handle('window:hide', () => {
    mainWindow?.hide();
  });

  // Screen sources for recording
  ipcMain.handle('sources:get-screens', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: true,
      });

      return sources.map((s) => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail.toDataURL(),
        display_id: s.display_id,
        appIcon: s.appIcon ? s.appIcon.toDataURL() : undefined,
      }));
    } catch (e) {
      console.error('Failed to get sources:', e);
      return [];
    }
  });

  // Video processing & saving
  ipcMain.handle('recording:save-video', async (_, buffer: ArrayBuffer, options: VideoProcessingOptions) => {
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `temp_rec_${Date.now()}.webm`);
    fs.writeFileSync(tempInput, Buffer.from(buffer));

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const ext = options.format || 'mp4';
    const baseName = options.customName || `VC-Record_${dateStr}_${timeStr}.${ext}`;

    const videosDir = path.join(storage.getBaseDir(), 'Videos');
    const outputPath = path.join(videosDir, baseName);
    const thumbName = `thumb_${dateStr}_${timeStr}.png`;
    const thumbPath = path.join(storage.getBaseDir(), 'Thumbnails', thumbName);

    try {
      // 1. FFmpeg conversion/remuxing with hardware or software encoder
      await ffmpegHelper.processVideo(tempInput, outputPath, options);

      // 2. Extract thumbnail
      await ffmpegHelper.generateThumbnail(outputPath, thumbPath);

      // 3. Clean up temp input
      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      } catch (e) {
        // ignore
      }

      const stat = fs.statSync(outputPath);
      const item = storage.addRecording({
        id: `rec_${Date.now()}`,
        name: baseName,
        path: outputPath,
        type: 'video',
        format: ext,
        size: stat.size,
        createdAt: Date.now(),
        duration: options.duration || 0,
        thumbnailPath: fs.existsSync(thumbPath) ? thumbPath : undefined,
      });

      // Notification
      const settings = storage.getSettings();
      if (settings.showNotifications && Notification.isSupported()) {
        new Notification({
          title: 'Recording Complete',
          body: `Saved: ${baseName}`,
          icon: path.join(__dirname, '../public/icon.png'),
        }).show();
      }

      return item;
    } catch (err: any) {
      console.error('Failed to save recording:', err);
      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      } catch (e) {
        // ignore
      }
      throw err;
    }
  });

  // Audio processing & saving
  ipcMain.handle('recording:save-audio', async (_, buffer: ArrayBuffer, options: AudioProcessingOptions) => {
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `temp_audio_${Date.now()}.webm`);
    fs.writeFileSync(tempInput, Buffer.from(buffer));

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const ext = options.format || 'mp3';
    const baseName = options.customName || `VC-Record_Audio_${dateStr}_${timeStr}.${ext}`;

    const audioDir = path.join(storage.getBaseDir(), 'Audio');
    const outputPath = path.join(audioDir, baseName);

    try {
      await ffmpegHelper.processAudio(tempInput, outputPath, options);

      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      } catch (e) {
        // ignore
      }

      const stat = fs.statSync(outputPath);
      const item = storage.addRecording({
        id: `rec_${Date.now()}`,
        name: baseName,
        path: outputPath,
        type: 'audio',
        format: ext,
        size: stat.size,
        createdAt: Date.now(),
        duration: options.duration || 0,
      });

      const settings = storage.getSettings();
      if (settings.showNotifications && Notification.isSupported()) {
        new Notification({
          title: 'Audio Recording Saved',
          body: `Saved: ${baseName}`,
          icon: path.join(__dirname, '../public/icon.png'),
        }).show();
      }

      return item;
    } catch (err: any) {
      console.error('Failed to save audio recording:', err);
      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      } catch (e) {
        // ignore
      }
      throw err;
    }
  });

  // Screenshot saving
  ipcMain.handle('screenshot:save', async (_, buffer: ArrayBuffer, format: 'png' | 'jpg') => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const baseName = `VC-Record_Screenshot_${dateStr}_${timeStr}.${ext}`;

    const screenshotsDir = path.join(storage.getBaseDir(), 'Screenshots');
    const outputPath = path.join(screenshotsDir, baseName);

    const nodeBuffer = Buffer.from(buffer);
    fs.writeFileSync(outputPath, nodeBuffer);

    // Copy to Windows clipboard
    const image = nativeImage.createFromBuffer(nodeBuffer);
    clipboard.writeImage(image);

    const stat = fs.statSync(outputPath);
    const item = storage.addRecording({
      id: `rec_${Date.now()}`,
      name: baseName,
      path: outputPath,
      type: 'screenshot',
      format: ext,
      size: stat.size,
      createdAt: Date.now(),
      thumbnailPath: outputPath,
    });

    const settings = storage.getSettings();
    if (settings.showNotifications && Notification.isSupported()) {
      new Notification({
        title: 'Screenshot Captured',
        body: `Saved & copied to clipboard: ${baseName}`,
        icon: path.join(__dirname, '../public/icon.png'),
      }).show();
    }

    return item;
  });

  // Copy image buffer directly to clipboard
  ipcMain.handle('screenshot:copy-clipboard', async (_, buffer: ArrayBuffer) => {
    try {
      const image = nativeImage.createFromBuffer(Buffer.from(buffer));
      clipboard.writeImage(image);
      return true;
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      return false;
    }
  });

  let latestDesktopSnapshot = '';

  ipcMain.handle('region:get-snapshot', () => {
    return latestDesktopSnapshot;
  });

  // Interactive Region Selection
  ipcMain.handle('region:start-selection', async () => {
    return new Promise<RegionRect | null>(async (resolve) => {
      if (overlayWindow) {
        overlayWindow.close();
      }

      // Hide main window so user has unobstructed view of the desktop
      mainWindow?.hide();

      // Small delay for main window to cleanly hide from screen
      await new Promise((r) => setTimeout(r, 120));

      // Capture full desktop snapshot
      try {
        const { screen } = require('electron');
        const primary = screen.getPrimaryDisplay();
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width: Math.round(primary.size.width * (primary.scaleFactor || 1)),
            height: Math.round(primary.size.height * (primary.scaleFactor || 1)),
          },
        });
        if (sources.length > 0) {
          latestDesktopSnapshot = sources[0].thumbnail.toDataURL();
        }
      } catch (err) {
        console.warn('Desktop snapshot capture error:', err);
      }

      overlayWindow = new BrowserWindow({
        fullscreen: true,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        enableLargerThanScreen: true,
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          sandbox: false,
        },
      });

      if (isDev && process.env.VITE_DEV_SERVER_URL) {
        overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mode=region-select`);
      } else {
        overlayWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'), {
          query: { mode: 'region-select' },
        });
      }

      const handleRegionResult = (_: any, rect: RegionRect | null) => {
        ipcMain.removeListener('region:selected', handleRegionResult);
        if (overlayWindow) {
          overlayWindow.close();
          overlayWindow = null;
        }
        mainWindow?.show();
        mainWindow?.focus();
        resolve(rect);
      };

      ipcMain.once('region:selected', handleRegionResult);

      overlayWindow.on('closed', () => {
        ipcMain.removeListener('region:selected', handleRegionResult);
        overlayWindow = null;
        mainWindow?.show();
        mainWindow?.focus();
        resolve(null);
      });
    });
  });

  // Library & File management
  ipcMain.handle('library:get-recordings', () => {
    return storage.getRecordings();
  });

  ipcMain.handle('library:open-folder', (_, filePath?: string) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    } else {
      shell.openPath(storage.getBaseDir());
    }
    return true;
  });

  ipcMain.handle('library:open-file', (_, filePath: string) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle('library:rename', (_, id: string, newName: string) => {
    return storage.renameRecording(id, newName);
  });

  ipcMain.handle('library:delete', (_, id: string) => {
    return storage.deleteRecording(id);
  });

  ipcMain.handle('library:copy-path', (_, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('library:select-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: storage.getBaseDir(),
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Settings & System
  ipcMain.handle('settings:get', () => {
    return storage.getSettings();
  });

  ipcMain.handle('settings:save', (_, newSettings: any) => {
    const updated = storage.saveSettings(newSettings);
    registerShortcuts();
    return updated;
  });

  ipcMain.handle('system:get-disk-space', () => {
    return storage.getDiskSpace();
  });

  ipcMain.handle('system:check-hw-accel', () => {
    return ffmpegHelper.checkHardwareEncoder();
  });

  ipcMain.handle('system:open-external', (_, url: string) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  });
}

// ----------------------------------------------------
// App Lifecycle
// ----------------------------------------------------

app.whenReady().then(() => {
  setupIpcHandlers();
  createMainWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  const settings = storage.getSettings();
  if (!settings.minimizeToTray || process.platform !== 'win32') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
