import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { VideoProcessingOptions, AudioProcessingOptions } from '../src/types';

const execFileAsync = promisify(execFile);

export class FFmpegHelper {
  private ffmpegPath: string;
  private hwAccelChecked = false;
  private availableHwEncoder: string | null = null;

  constructor() {
    this.ffmpegPath = this.resolveFFmpegPath();
    console.log('[FFmpegHelper] Resolved FFmpeg path:', this.ffmpegPath);
  }

  private resolveFFmpegPath(): string {
    const resources = process.resourcesPath || '';

    const candidates = [
      // 1. Extra resources directly placed in resources/ffmpeg.exe
      resources ? path.join(resources, 'ffmpeg.exe') : null,

      // 2. Unpacked asar path in electron-builder resources
      resources
        ? path.join(
            resources,
            'app.asar.unpacked',
            'node_modules',
            '@ffmpeg-installer',
            'win32-x64',
            'ffmpeg.exe'
          )
        : null,

      // 3. @ffmpeg-installer package path with app.asar replaced by app.asar.unpacked
      (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const installer = require('@ffmpeg-installer/ffmpeg');
          if (installer && installer.path) {
            return installer.path.replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
          }
          return null;
        } catch {
          return null;
        }
      })(),

      // 4. In app path with app.asar replaced
      path.join(
        app.getAppPath().replace(/app\.asar([\\/])/, 'app.asar.unpacked$1'),
        'node_modules',
        '@ffmpeg-installer',
        'win32-x64',
        'ffmpeg.exe'
      ),

      // 5. In local development directory
      path.join(__dirname, '..', '..', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
      path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    ];

    for (const cand of candidates) {
      // CRITICAL: An executable cannot be spawned from inside app.asar virtual archive on Windows
      if (
        cand &&
        !cand.includes('app.asar\\') &&
        !cand.includes('app.asar/') &&
        fs.existsSync(cand)
      ) {
        return cand;
      }
    }

    return 'ffmpeg';
  }

  public getFFmpegPath(): string {
    return this.ffmpegPath;
  }

  public async checkHardwareEncoder(): Promise<string | null> {
    if (this.hwAccelChecked) {
      return this.availableHwEncoder;
    }

    try {
      const { stdout } = await execFileAsync(this.ffmpegPath, ['-encoders']);
      if (stdout.includes('h264_nvenc')) {
        this.availableHwEncoder = 'h264_nvenc';
      } else if (stdout.includes('h264_qsv')) {
        this.availableHwEncoder = 'h264_qsv';
      } else if (stdout.includes('h264_amf')) {
        this.availableHwEncoder = 'h264_amf';
      } else {
        this.availableHwEncoder = null;
      }
    } catch (err) {
      console.warn('Could not query FFmpeg encoders:', err);
      this.availableHwEncoder = null;
    }

    this.hwAccelChecked = true;
    return this.availableHwEncoder;
  }

  public async processVideo(
    tempInputPath: string,
    outputPath: string,
    options: VideoProcessingOptions
  ): Promise<void> {
    const hwEncoder = options.hwAccel ? await this.checkHardwareEncoder() : null;
    const encoder = hwEncoder || 'libx264';

    const args: string[] = ['-y', '-i', tempInputPath];

    // FPS configuration
    if (options.fps) {
      args.push('-r', options.fps.toString());
    }

    // Resolution scaling
    if (options.resolution && options.resolution !== 'original') {
      let targetH = 1080;
      if (options.resolution === '720p') targetH = 720;
      if (options.resolution === '480p') targetH = 480;
      args.push('-vf', `scale=-2:${targetH}`);
    }

    // Video encoder & quality
    args.push('-c:v', encoder);

    if (encoder === 'libx264') {
      args.push('-preset', 'veryfast');
      const crf = options.quality === 'high' ? '18' : options.quality === 'low' ? '28' : '23';
      args.push('-crf', crf);
      args.push('-pix_fmt', 'yuv420p');
    } else if (encoder === 'h264_nvenc') {
      args.push('-preset', 'p4');
      const qp = options.quality === 'high' ? '19' : options.quality === 'low' ? '28' : '23';
      args.push('-cq', qp);
      args.push('-pix_fmt', 'yuv420p');
    }

    // Audio encoding
    args.push('-c:a', 'aac', '-b:a', '192k');

    // MP4 faststart for instant streaming/playback
    if (outputPath.endsWith('.mp4')) {
      args.push('-movflags', '+faststart');
    }

    args.push(outputPath);

    return new Promise((resolve, reject) => {
      const child = spawn(this.ffmpegPath, args);
      let stderr = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // If hardware encoder failed, retry with libx264 fallback
          if (hwEncoder) {
            console.warn(`Hardware encoder ${hwEncoder} failed, falling back to libx264:`, stderr);
            this.processVideo(tempInputPath, outputPath, { ...options, hwAccel: false })
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(`FFmpeg processVideo failed with exit code ${code}: ${stderr}`));
          }
        }
      });

      child.on('error', reject);
    });
  }

  public async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    try {
      // Seek to 1 second (or 0.1s if short) to capture a representative thumbnail frame
      const args = [
        '-y',
        '-ss', '00:00:01',
        '-i', videoPath,
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-q:v', '2',
        thumbnailPath
      ];

      await execFileAsync(this.ffmpegPath, args);
      return fs.existsSync(thumbnailPath);
    } catch (e) {
      // Fallback try at 00:00:00
      try {
        const argsFallback = [
          '-y',
          '-ss', '00:00:00',
          '-i', videoPath,
          '-vframes', '1',
          '-vf', 'scale=320:-1',
          '-q:v', '2',
          thumbnailPath
        ];
        await execFileAsync(this.ffmpegPath, argsFallback);
        return fs.existsSync(thumbnailPath);
      } catch (err) {
        console.warn('Failed to generate thumbnail for:', videoPath, err);
        return false;
      }
    }
  }

  public async processAudio(
    tempInputPath: string,
    outputPath: string,
    options: AudioProcessingOptions
  ): Promise<void> {
    const args: string[] = ['-y', '-i', tempInputPath];

    if (options.format === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    } else {
      args.push('-c:a', 'libmp3lame', '-b:a', '192k');
    }

    args.push(outputPath);

    return new Promise((resolve, reject) => {
      const child = spawn(this.ffmpegPath, args);
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg audio encoding failed: ${stderr}`));
        }
      });

      child.on('error', reject);
    });
  }
}
