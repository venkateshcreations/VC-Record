import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  AppWindow,
  Crop,
  Mic,
  Volume2,
  Video,
  X,
  Cpu
} from 'lucide-react';
import {
  ScreenSource,
  CaptureMode,
  Resolution,
  FrameRate,
  VideoFormat,
  VideoQuality,
  CountdownDuration,
  OverlayShape,
  OverlayPosition,
  OverlaySize,
  RegionRect
} from '../types';

interface ScreenRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: (config: ScreenRecordConfig) => void;
  defaultSettings: any;
}

export interface ScreenRecordConfig {
  mode: CaptureMode;
  sourceId: string;
  sourceName: string;
  region?: RegionRect;
  resolution: Resolution;
  fps: FrameRate;
  format: VideoFormat;
  quality: VideoQuality;
  hwAccel: boolean;
  showCursor: boolean;
  countdown: CountdownDuration;
  recordMic: boolean;
  micDeviceId: string;
  recordSystemAudio: boolean;
  webcamOverlay: boolean;
  webcamDeviceId: string;
  webcamShape: OverlayShape;
  webcamPosition: OverlayPosition;
  webcamSize: OverlaySize;
  webcamMirror: boolean;
}

export const ScreenRecordModal: React.FC<ScreenRecordModalProps> = ({
  isOpen,
  onClose,
  onStartRecording,
  defaultSettings,
}) => {
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [mode, setMode] = useState<CaptureMode>('fullscreen');
  const [customRegion, setCustomRegion] = useState<RegionRect | null>(null);

  // Settings
  const [resolution, setResolution] = useState<Resolution>('original');
  const [fps, setFps] = useState<FrameRate>(60);
  const [format, setFormat] = useState<VideoFormat>('mp4');
  const [quality, setQuality] = useState<VideoQuality>('high');
  const [hwAccel, setHwAccel] = useState<boolean>(true);
  const [showCursor, setShowCursor] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<CountdownDuration>(3);

  // Audio
  const [recordMic, setRecordMic] = useState<boolean>(true);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [recordSystemAudio, setRecordSystemAudio] = useState<boolean>(true);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);

  // Webcam Overlay
  const [webcamOverlay, setWebcamOverlay] = useState<boolean>(false);
  const [webcamDevices, setWebcamDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedWebcamId, setSelectedWebcamId] = useState<string>('');
  const [webcamShape, setWebcamShape] = useState<OverlayShape>('circle');
  const [webcamPosition, setWebcamPosition] = useState<OverlayPosition>('bottom-right');
  const [webcamSize, setWebcamSize] = useState<OverlaySize>('md');
  const [webcamMirror, setWebcamMirror] = useState<boolean>(true);

  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load screen sources & hardware acceleration & devices when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (defaultSettings) {
      setResolution(defaultSettings.defaultResolution || 'original');
      setFps(defaultSettings.defaultFps || 60);
      setFormat(defaultSettings.defaultVideoFormat || 'mp4');
      setQuality(defaultSettings.defaultQuality || 'high');
      setHwAccel(defaultSettings.hwAccelEnabled ?? true);
      setShowCursor(defaultSettings.showCursor ?? true);
      setCountdown(defaultSettings.countdownDuration ?? 3);
      setRecordMic(defaultSettings.micEnabled ?? true);
      setRecordSystemAudio(defaultSettings.systemAudioEnabled ?? true);
    }

    // Load screens & windows
    window.electronAPI?.getScreenSources().then((srcs) => {
      setSources(srcs);
      if (srcs.length > 0) {
        // default to first screen
        const screen = srcs.find((s) => s.id.startsWith('screen')) || srcs[0];
        setSelectedSourceId(screen.id);
      }
    });

    // Enumerate audio & video devices
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const mics = devices.filter((d) => d.kind === 'audioinput');
      const cams = devices.filter((d) => d.kind === 'videoinput');
      setMicDevices(mics);
      setWebcamDevices(cams);
      if (mics.length > 0) setSelectedMicId(mics[0].deviceId);
      if (cams.length > 0) setSelectedWebcamId(cams[0].deviceId);
    });
  }, [isOpen, defaultSettings]);

  // Handle live microphone volume meter
  useEffect(() => {
    if (!isOpen || !recordMic) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setMicVolumeLevel(0);
      return;
    }

    let isMounted = true;
    navigator.mediaDevices
      ?.getUserMedia({
        audio: selectedMicId === 'default' ? true : { deviceId: { exact: selectedMicId } },
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolumeLevel(Math.min(100, (avg / 128) * 100));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      })
      .catch((err) => {
        console.warn('Microphone meter access error:', err);
      });

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, recordMic, selectedMicId]);

  // Handle webcam preview stream
  useEffect(() => {
    if (!isOpen || !webcamOverlay || !selectedWebcamId) {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        webcamVideoRef.current.srcObject = null;
      }
      return;
    }

    let isMounted = true;
    navigator.mediaDevices
      ?.getUserMedia({
        video: { deviceId: { exact: selectedWebcamId } },
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Webcam preview error:', err);
      });

    return () => {
      isMounted = false;
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, webcamOverlay, selectedWebcamId]);

  const handleSelectCustomRegion = async () => {
    // Open region selection overlay
    const rect = await window.electronAPI?.startRegionSelection();
    if (rect) {
      setCustomRegion(rect);
      setMode('region');
    }
  };

  const handleStart = () => {
    const selectedSource = sources.find((s) => s.id === selectedSourceId) || sources[0];

    onStartRecording({
      mode,
      sourceId: selectedSource?.id || 'screen:0:0',
      sourceName: selectedSource?.name || 'Screen 1',
      region: customRegion || undefined,
      resolution,
      fps,
      format,
      quality,
      hwAccel,
      showCursor,
      countdown,
      recordMic,
      micDeviceId: selectedMicId,
      recordSystemAudio,
      webcamOverlay,
      webcamDeviceId: selectedWebcamId,
      webcamShape,
      webcamPosition,
      webcamSize,
      webcamMirror,
    });
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

  const screens = sources.filter((s) => s.id.startsWith('screen'));
  const windows = sources.filter((s) => s.id.startsWith('window'));

  const selectedSource = sources.find((s) => s.id === selectedSourceId);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            </div>
            <h2 className="text-white font-semibold text-base">Record Screen</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Capture Mode & Display Source */}
          <div>
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider block mb-2">
              Capture Source
            </label>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setMode('fullscreen')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  mode === 'fullscreen'
                    ? 'bg-[#0F7DFD]/15 border-[#0F7DFD] text-[#0F7DFD]'
                    : 'bg-[#1c1c1c] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Monitor size={15} />
                Entire Screen
              </button>

              <button
                onClick={handleSelectCustomRegion}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  mode === 'region'
                    ? 'bg-[#0F7DFD]/15 border-[#0F7DFD] text-[#0F7DFD]'
                    : 'bg-[#1c1c1c] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Crop size={15} />
                {customRegion ? `${customRegion.width}×${customRegion.height}` : 'Select Region'}
              </button>

              <button
                onClick={() => setMode('window')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  mode === 'window'
                    ? 'bg-[#0F7DFD]/15 border-[#0F7DFD] text-[#0F7DFD]'
                    : 'bg-[#1c1c1c] border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <AppWindow size={15} />
                App Window
              </button>
            </div>

            {/* Source Selector list */}
            {mode === 'fullscreen' && screens.length > 1 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {screens.map((scr) => (
                  <button
                    key={scr.id}
                    onClick={() => setSelectedSourceId(scr.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      selectedSourceId === scr.id
                        ? 'border-[#0F7DFD] bg-[#0F7DFD]/10'
                        : 'border-white/5 bg-[#1c1c1c] hover:border-white/10'
                    }`}
                  >
                    <img src={scr.thumbnail} alt="" className="w-12 h-8 object-cover rounded bg-black" />
                    <span className="text-xs text-white truncate font-medium">{scr.name}</span>
                  </button>
                ))}
              </div>
            )}

            {mode === 'window' && (
              <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-2 mt-2 pr-1">
                {windows.map((win) => (
                  <button
                    key={win.id}
                    onClick={() => setSelectedSourceId(win.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      selectedSourceId === win.id
                        ? 'border-[#0F7DFD] bg-[#0F7DFD]/10'
                        : 'border-white/5 bg-[#1c1c1c] hover:border-white/10'
                    }`}
                  >
                    <img src={win.thumbnail} alt="" className="w-12 h-8 object-cover rounded bg-black" />
                    <span className="text-xs text-white truncate font-medium">{win.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected source preview card */}
            {selectedSource && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center h-28">
                <img
                  src={selectedSource.thumbnail}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[11px] text-gray-300">
                  {selectedSource.name}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Audio Configuration */}
          <div>
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider block mb-2">
              Audio Sources
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Microphone Toggle & Meter */}
              <div className="p-3 rounded-xl bg-[#1c1c1c] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic size={15} className={recordMic ? 'text-emerald-400' : 'text-gray-500'} />
                    <span className="text-xs font-medium text-white">Microphone</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={recordMic}
                    onChange={(e) => setRecordMic(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F7DFD] accent-[#0F7DFD] cursor-pointer"
                  />
                </div>

                {recordMic && (
                  <div className="space-y-2">
                    <select
                      value={selectedMicId}
                      onChange={(e) => setSelectedMicId(e.target.value)}
                      className="w-full bg-[#252525] text-xs text-white p-1.5 rounded-lg border border-white/10 focus:outline-none"
                    >
                      {micDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>

                    {/* Live VU meter */}
                    <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                        style={{ width: `${micVolumeLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* System Audio Toggle */}
              <div className="p-3 rounded-xl bg-[#1c1c1c] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Volume2
                      size={15}
                      className={recordSystemAudio ? 'text-[#0F7DFD]' : 'text-gray-500'}
                    />
                    <span className="text-xs font-medium text-white">System Audio</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={recordSystemAudio}
                    onChange={(e) => setRecordSystemAudio(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F7DFD] accent-[#0F7DFD] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {recordSystemAudio
                    ? 'Records sound from desktop apps, games & browser'
                    : 'System audio muted in recording'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Webcam Overlay (PiP) */}
          <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video size={16} className={webcamOverlay ? 'text-blue-400' : 'text-gray-500'} />
                <div>
                  <span className="text-xs font-medium text-white block">Webcam Overlay (PiP)</span>
                  <span className="text-[11px] text-gray-400">Add camera feed onto screen recording</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={webcamOverlay}
                onChange={(e) => setWebcamOverlay(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F7DFD] accent-[#0F7DFD] cursor-pointer"
              />
            </div>

            {webcamOverlay && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400">Camera Device</label>
                  <select
                    value={selectedWebcamId}
                    onChange={(e) => setSelectedWebcamId(e.target.value)}
                    className="w-full bg-[#252525] text-xs text-white p-1.5 rounded-lg border border-white/10"
                  >
                    {webcamDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Shape</label>
                      <select
                        value={webcamShape}
                        onChange={(e) => setWebcamShape(e.target.value as any)}
                        className="w-full bg-[#252525] text-xs text-white p-1 rounded-lg border border-white/10"
                      >
                        <option value="circle">Circular</option>
                        <option value="rect">Rounded Rect</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Position</label>
                      <select
                        value={webcamPosition}
                        onChange={(e) => setWebcamPosition(e.target.value as any)}
                        className="w-full bg-[#252525] text-xs text-white p-1 rounded-lg border border-white/10"
                      >
                        <option value="bottom-right">Bottom-Right</option>
                        <option value="bottom-left">Bottom-Left</option>
                        <option value="top-right">Top-Right</option>
                        <option value="top-left">Top-Left</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Size</label>
                      <select
                        value={webcamSize}
                        onChange={(e) => setWebcamSize(e.target.value as any)}
                        className="w-full bg-[#252525] text-xs text-white p-1 rounded-lg border border-white/10"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webcamMirror}
                          onChange={(e) => setWebcamMirror(e.target.checked)}
                          className="accent-[#0F7DFD] w-3.5 h-3.5"
                        />
                        Mirror Camera
                      </label>
                    </div>
                  </div>
                </div>

                {/* Webcam Live Mini Preview */}
                <div className="flex flex-col items-center justify-center bg-black rounded-lg border border-white/10 p-2 overflow-hidden h-28 relative">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-24 h-24 object-cover ${
                      webcamShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                    } ${webcamMirror ? '-scale-x-100' : ''} border-2 border-[#0F7DFD]`}
                  />
                  <div className="absolute top-1 left-2 text-[10px] text-gray-400">Live Preview</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Video Settings (Resolution, FPS, Format, Quality, HW Accel) */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
              >
                <option value="original">Original</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Frame Rate</label>
              <select
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value) as any)}
                className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
              >
                <option value="60">60 FPS (Smooth)</option>
                <option value="30">30 FPS (Standard)</option>
                <option value="24">24 FPS (Cinematic)</option>
                <option value="15">15 FPS (Compact)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
              >
                <option value="mp4">MP4 (Standard)</option>
                <option value="mkv">MKV (Resilient)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Countdown</label>
              <select
                value={countdown}
                onChange={(e) => setCountdown(parseInt(e.target.value) as any)}
                className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10"
              >
                <option value="3">3 seconds</option>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="0">Disabled</option>
              </select>
            </div>
          </div>

          {/* Hardware acceleration & cursor toggles */}
          <div className="flex items-center justify-between text-xs text-gray-300 px-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hwAccel}
                onChange={(e) => setHwAccel(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F7DFD] accent-[#0F7DFD]"
              />
              <span className="flex items-center gap-1">
                <Cpu size={14} className="text-[#0F7DFD]" />
                Hardware Acceleration (NVENC / QSV / AMF)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCursor}
                onChange={(e) => setShowCursor(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F7DFD] accent-[#0F7DFD]"
              />
              <span>Show Mouse Cursor</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] flex items-center justify-end gap-2.5 bg-[#1f1f1f]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-lg shadow-red-500/25 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Start Recording
          </button>
        </div>
      </div>
    </div>
  );
};
