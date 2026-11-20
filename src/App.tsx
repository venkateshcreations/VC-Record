import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { ActionCards } from './components/ActionCards';
import { RecordingsSection } from './components/RecordingsSection';
import { ScreenRecordModal, ScreenRecordConfig } from './components/ScreenRecordModal';
import { WebcamRecordModal } from './components/WebcamRecordModal';
import { AudioRecordModal } from './components/AudioRecordModal';
import { ScreenshotModal } from './components/ScreenshotModal';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { FloatingControlBar } from './components/FloatingControlBar';
import { CountdownOverlay } from './components/CountdownOverlay';
import { RegionSelectOverlay } from './components/RegionSelectOverlay';
import { RecordingItem, AppSettings, RegionRect } from './types';

export const App: React.FC = () => {
  // Check if running as region selection window
  const urlParams = new URLSearchParams(window.location.search);
  const isRegionSelectMode = urlParams.get('mode') === 'region-select';

  if (isRegionSelectMode) {
    return (
      <RegionSelectOverlay
        onConfirm={(rect) => {
          window.electronAPI?.sendRegionResult(rect);
        }}
        onCancel={() => {
          window.electronAPI?.sendRegionResult(null);
        }}
      />
    );
  }

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Application State
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modals
  const [screenModalOpen, setScreenModalOpen] = useState<boolean>(false);
  const [webcamModalOpen, setWebcamModalOpen] = useState<boolean>(false);
  const [audioModalOpen, setAudioModalOpen] = useState<boolean>(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);
  const [mediaPlayerItem, setMediaPlayerItem] = useState<RecordingItem | null>(null);

  // Active Screen Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isSystemMuted, setIsSystemMuted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [activeConfig, setActiveConfig] = useState<ScreenRecordConfig | null>(null);

  // Internal streams and recorders
  const desktopStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const sysGainRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const compositorAnimRef = useRef<number | null>(null);

  // Load initial settings and recordings
  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => setSettings(s));
    loadRecordings();

    // Listen for global keyboard shortcuts
    const cleanup = window.electronAPI?.onShortcut((action) => {
      if (action === 'toggle-recording') {
        if (isRecording) {
          handleStopScreenRecording();
        } else {
          setScreenModalOpen(true);
        }
      } else if (action === 'pause-recording') {
        handlePauseResumeScreenRecording();
      } else if (action === 'take-screenshot') {
        setScreenshotModalOpen(true);
      }
    });

    return () => {
      cleanup?.();
    };
  }, [isRecording, isPaused]);

  const loadRecordings = () => {
    window.electronAPI?.getRecordings().then((recs) => {
      setRecordings(recs || []);
    });
  };

  // ----------------------------------------------------
  // Screen Recording Engine
  // ----------------------------------------------------

  const handleStartScreenRecordingFromModal = (config: ScreenRecordConfig) => {
    setScreenModalOpen(false);
    setActiveConfig(config);

    if (config.countdown > 0) {
      setCountdownSeconds(config.countdown);
    } else {
      executeStartScreenRecording(config);
    }
  };

  const executeStartScreenRecording = async (config: ScreenRecordConfig) => {
    try {
      recordedChunksRef.current = [];

      // 1. Capture Desktop Screen
      const desktopStream = await (navigator.mediaDevices as any).getUserMedia({
        audio: config.recordSystemAudio
          ? {
              mandatory: {
                chromeMediaSource: 'desktop',
              },
            }
          : false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: config.sourceId,
            minWidth: 1280,
            maxWidth: 3840,
            minHeight: 720,
            maxHeight: 2160,
            minFrameRate: config.fps || 30,
            maxFrameRate: config.fps || 60,
          },
        },
      });
      desktopStreamRef.current = desktopStream;

      // 2. Audio mixing via Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const audioDest = audioCtx.createMediaStreamDestination();

      // System audio track connection
      const sysTracks = desktopStream.getAudioTracks();
      if (sysTracks.length > 0 && config.recordSystemAudio) {
        const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysTracks[0]]));
        const sysGain = audioCtx.createGain();
        sysGain.gain.value = 1;
        sysSource.connect(sysGain);
        sysGain.connect(audioDest);
        sysGainRef.current = sysGain;
      }

      // Microphone track connection
      if (config.recordMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio:
              config.micDeviceId === 'default'
                ? true
                : { deviceId: { exact: config.micDeviceId } },
          });
          micStreamRef.current = micStream;
          const micSource = audioCtx.createMediaStreamSource(micStream);
          const micGain = audioCtx.createGain();
          micGain.gain.value = 1;
          micSource.connect(micGain);
          micGain.connect(audioDest);
          micGainRef.current = micGain;
        } catch (e) {
          console.warn('Microphone error in screen record:', e);
        }
      }

      // 3. Video processing: direct stream OR Canvas Compositor (for PiP Webcam or custom Region)
      let outputVideoStream: MediaStream = desktopStream;

      if (config.webcamOverlay || config.mode === 'region') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const screenVideo = document.createElement('video');
        screenVideo.srcObject = desktopStream;
        screenVideo.muted = true;
        await screenVideo.play();

        let webcamVideo: HTMLVideoElement | null = null;
        if (config.webcamOverlay && config.webcamDeviceId) {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: config.webcamDeviceId } },
            });
            webcamStreamRef.current = camStream;
            webcamVideo = document.createElement('video');
            webcamVideo.srcObject = camStream;
            webcamVideo.muted = true;
            await webcamVideo.play();
          } catch (e) {
            console.warn('Webcam overlay stream error:', e);
          }
        }

        const targetW = config.region ? config.region.width : screenVideo.videoWidth || 1920;
        const targetH = config.region ? config.region.height : screenVideo.videoHeight || 1080;
        canvas.width = targetW;
        canvas.height = targetH;

        const drawFrame = () => {
          if (!ctx) return;

          // Draw screen cropped or full
          if (config.region) {
            ctx.drawImage(
              screenVideo,
              config.region.x,
              config.region.y,
              config.region.width,
              config.region.height,
              0,
              0,
              targetW,
              targetH
            );
          } else {
            ctx.drawImage(screenVideo, 0, 0, targetW, targetH);
          }

          // Composite Webcam PiP
          if (webcamVideo && webcamVideo.readyState >= 2) {
            const pipSize =
              config.webcamSize === 'lg' ? 280 : config.webcamSize === 'sm' ? 160 : 220;
            let px = targetW - pipSize - 24;
            let py = targetH - pipSize - 24;

            if (config.webcamPosition === 'bottom-left') {
              px = 24;
              py = targetH - pipSize - 24;
            } else if (config.webcamPosition === 'top-right') {
              px = targetW - pipSize - 24;
              py = 24;
            } else if (config.webcamPosition === 'top-left') {
              px = 24;
              py = 24;
            }

            ctx.save();
            if (config.webcamShape === 'circle') {
              ctx.beginPath();
              ctx.arc(px + pipSize / 2, py + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
              ctx.clip();
            } else {
              const r = 16;
              ctx.beginPath();
              ctx.roundRect(px, py, pipSize, pipSize, r);
              ctx.clip();
            }

            if (config.webcamMirror) {
              ctx.translate(px + pipSize, py);
              ctx.scale(-1, 1);
              ctx.drawImage(webcamVideo, 0, 0, pipSize, pipSize);
            } else {
              ctx.drawImage(webcamVideo, px, py, pipSize, pipSize);
            }
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 3;
            if (config.webcamShape === 'circle') {
              ctx.beginPath();
              ctx.arc(px + pipSize / 2, py + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.roundRect(px, py, pipSize, pipSize, 16);
              ctx.stroke();
            }
            ctx.restore();
          }

          compositorAnimRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();
        outputVideoStream = canvas.captureStream(config.fps || 60);
      }

      // 4. Combine video + audio
      const finalTracks: MediaStreamTrack[] = [
        ...outputVideoStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const finalStream = new MediaStream(finalTracks);

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(finalStream, { mimeType: mime });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setIsMicMuted(false);
      setIsSystemMuted(false);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start screen recording:', err);
      alert('Could not start screen recording: ' + (err as any).message);
    }
  };

  const handlePauseResumeScreenRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const handleToggleMic = () => {
    if (micGainRef.current) {
      const newMuted = !isMicMuted;
      micGainRef.current.gain.value = newMuted ? 0 : 1;
      setIsMicMuted(newMuted);
    }
  };

  const handleToggleSystemAudio = () => {
    if (sysGainRef.current) {
      const newMuted = !isSystemMuted;
      sysGainRef.current.gain.value = newMuted ? 0 : 1;
      setIsSystemMuted(newMuted);
    }
  };

  const handleStopScreenRecording = async () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    if (compositorAnimRef.current) cancelAnimationFrame(compositorAnimRef.current);

    setIsSaving(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const arrayBuffer = await webmBlob.arrayBuffer();

        const item = await window.electronAPI?.saveVideoRecording(arrayBuffer, {
          format: activeConfig?.format || 'mp4',
          quality: activeConfig?.quality || 'high',
          hwAccel: activeConfig?.hwAccel ?? true,
          fps: activeConfig?.fps || 60,
          resolution: activeConfig?.resolution || 'original',
          duration,
        });

        // Clean up all streams
        desktopStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }

        setIsSaving(false);
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        loadRecordings();

        if (item) {
          setMediaPlayerItem(item);
        }
      } catch (err) {
        console.error('Save recording error:', err);
        setIsSaving(false);
        setIsRecording(false);
        alert('Failed to process and save video: ' + (err as any).message);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // ----------------------------------------------------
  // Handlers for Webcam, Audio & Screenshot Saves
  // ----------------------------------------------------

  const handleSaveWebcamBlob = async (blob: Blob, recDuration: number) => {
    const arrayBuffer = await blob.arrayBuffer();
    const item = await window.electronAPI?.saveVideoRecording(arrayBuffer, {
      format: 'mp4',
      quality: 'high',
      hwAccel: true,
      fps: 30,
      resolution: 'original',
      duration: recDuration,
    });
    loadRecordings();
    if (item) setMediaPlayerItem(item);
  };

  const handleSaveAudioBlob = async (blob: Blob, audioFormat: any, recDuration: number) => {
    const arrayBuffer = await blob.arrayBuffer();
    const item = await window.electronAPI?.saveAudioRecording(arrayBuffer, {
      format: audioFormat,
      quality: 'high',
      duration: recDuration,
    });
    loadRecordings();
    if (item) setMediaPlayerItem(item);
  };

  const handleSaveScreenshot = async (
    buffer: ArrayBuffer,
    format: 'png' | 'jpg',
    rect?: RegionRect
  ) => {
    const item = await window.electronAPI?.saveScreenshot(buffer, format, rect);
    loadRecordings();
    return item;
  };

  const handleRenameRecording = async (item: RecordingItem, newName: string) => {
    await window.electronAPI?.renameRecording(item.id, newName);
    loadRecordings();
  };

  const handleDeleteRecording = async (item: RecordingItem) => {
    await window.electronAPI?.deleteRecording(item.id);
    loadRecordings();
  };

  const handleOpenFolder = (item?: RecordingItem) => {
    window.electronAPI?.openInFolder(item?.path);
  };

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await window.electronAPI?.saveSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0e111a] text-white overflow-hidden font-sans relative select-none">
      {/* Ambient Cosmic Lights matching screenshot */}
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header (Full Width) */}
      <Header
        onOpenFolder={() => handleOpenFolder()}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* 2. Body: Left Navigation Sidebar + Right Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'settings') {
              setSettingsModalOpen(true);
            } else if (tab === 'about') {
              setAboutModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
        />

        {/* Right Main Container */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#101322]/40 to-[#0e111a]/80 backdrop-blur-md">
          {activeTab === 'home' && (
            <>
              {/* 4 Action Cards */}
              <ActionCards
                onRecordScreen={() => setScreenModalOpen(true)}
                onRecordWebcam={() => setWebcamModalOpen(true)}
                onRecordAudio={() => setAudioModalOpen(true)}
                onScreenshot={() => setScreenshotModalOpen(true)}
                shortcutScreen={settings?.shortcutStartStop}
              />

              {/* Recordings Section */}
              <RecordingsSection
                recordings={recordings}
                saveDirectory={settings?.recordingsDir || ''}
                onPlay={(item) => setMediaPlayerItem(item)}
                onOpenFolder={(item) => handleOpenFolder(item)}
                onRename={handleRenameRecording}
                onDelete={handleDeleteRecording}
              />
            </>
          )}

          {activeTab === 'recordings' && (
            <RecordingsSection
              recordings={recordings}
              saveDirectory={settings?.recordingsDir || ''}
              onPlay={(item) => setMediaPlayerItem(item)}
              onOpenFolder={(item) => handleOpenFolder(item)}
              onRename={handleRenameRecording}
              onDelete={handleDeleteRecording}
            />
          )}
        </main>
      </div>

      {/* 3. Floating Recording Control Bar */}
      <FloatingControlBar
        isRecording={isRecording}
        isPaused={isPaused}
        duration={duration}
        isMicMuted={isMicMuted}
        isSystemMuted={isSystemMuted}
        onPauseResume={handlePauseResumeScreenRecording}
        onStop={handleStopScreenRecording}
        onToggleMic={handleToggleMic}
        onToggleSystemAudio={handleToggleSystemAudio}
        isSaving={isSaving}
      />

      {/* 4. Animated Countdown Overlay */}
      {countdownSeconds > 0 && activeConfig && (
        <CountdownOverlay
          initialSeconds={countdownSeconds}
          onComplete={() => {
            setCountdownSeconds(0);
            executeStartScreenRecording(activeConfig);
          }}
        />
      )}

      {/* 5. Screen Record Modal */}
      <ScreenRecordModal
        isOpen={screenModalOpen}
        onClose={() => setScreenModalOpen(false)}
        onStartRecording={handleStartScreenRecordingFromModal}
        defaultSettings={settings}
      />

      {/* 6. Webcam Record Modal */}
      <WebcamRecordModal
        isOpen={webcamModalOpen}
        onClose={() => setWebcamModalOpen(false)}
        onSaveRecording={handleSaveWebcamBlob}
      />

      {/* 7. Audio Record Modal */}
      <AudioRecordModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
        onSaveRecording={handleSaveAudioBlob}
      />

      {/* 8. Screenshot Modal */}
      <ScreenshotModal
        isOpen={screenshotModalOpen}
        onClose={() => setScreenshotModalOpen(false)}
        onSaveScreenshot={handleSaveScreenshot}
      />

      {/* 9. Settings Modal */}
      {settings && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* 10. About Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* 11. Media Player Preview Modal */}
      <MediaPlayerModal
        item={mediaPlayerItem}
        onClose={() => setMediaPlayerItem(null)}
        onOpenFolder={(item) => handleOpenFolder(item)}
        onDelete={(item) => {
          handleDeleteRecording(item);
          setMediaPlayerItem(null);
        }}
      />
    </div>
  );
};
