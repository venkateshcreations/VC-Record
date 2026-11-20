import React, { useState, useEffect, useRef } from 'react';
import { Video, X, Square, Play, Pause, Circle } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface WebcamRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecording: (blob: Blob, duration: number) => Promise<void>;
}

export const WebcamRecordModal: React.FC<WebcamRecordModalProps> = ({
  isOpen,
  onClose,
  onSaveRecording,
}) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p'>('1080p');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setCameras(videoInputs);
      setMics(audioInputs);
      if (videoInputs.length > 0) setSelectedCamId(videoInputs[0].deviceId);
      if (audioInputs.length > 0) setSelectedMicId(audioInputs[0].deviceId);
    });
  }, [isOpen]);

  // Start preview stream
  useEffect(() => {
    if (!isOpen || !selectedCamId) return;

    let isMounted = true;
    let width = 1920;
    let height = 1080;
    if (resolution === '720p') {
      width = 1280;
      height = 720;
    } else if (resolution === '480p') {
      width = 854;
      height = 480;
    }

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          deviceId: { exact: selectedCamId },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: fps },
        },
        audio: micEnabled
          ? selectedMicId === 'default'
            ? true
            : { deviceId: { exact: selectedMicId } }
          : false,
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        mediaStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Failed to start webcam preview:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedCamId, selectedMicId, micEnabled, resolution, fps]);

  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    const recorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm',
    });

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

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const handlePauseResume = () => {
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

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    setIsProcessing(true);

    mediaRecorderRef.current.onstop = async () => {
      const finalBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      await onSaveRecording(finalBlob, duration);
      setIsProcessing(false);
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      onClose();
    };

    mediaRecorderRef.current.stop();
  };

  const handleClose = () => {
    if (isRecording) {
      if (!confirm('Recording in progress. Are you sure you want to cancel?')) return;
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Video size={16} />
            </div>
            <h2 className="text-white font-semibold text-base">Record Webcam</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative bg-black h-80 flex items-center justify-center overflow-hidden">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain -scale-x-100"
          />

          {/* Recording Timer Overlay */}
          {isRecording && (
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-mono">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span>{formatDuration(duration)}</span>
              {isPaused && <span className="text-amber-400 text-[10px] uppercase font-sans">PAUSED</span>}
            </div>
          )}
        </div>

        {/* Device Controls */}
        <div className="p-4 bg-[#1e1e1e] border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Webcam Device</label>
              <select
                value={selectedCamId}
                onChange={(e) => setSelectedCamId(e.target.value)}
                disabled={isRecording}
                className="w-full bg-[#282828] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-gray-400">Microphone</label>
                <label className="text-[11px] text-gray-400 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={micEnabled}
                    onChange={(e) => setMicEnabled(e.target.checked)}
                    disabled={isRecording}
                    className="accent-[#0F7DFD]"
                  />
                  Enable Mic
                </label>
              </div>
              <select
                value={selectedMicId}
                onChange={(e) => setSelectedMicId(e.target.value)}
                disabled={!micEnabled || isRecording}
                className="w-full bg-[#282828] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
              >
                {mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                disabled={isRecording}
                className="w-full bg-[#282828] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
              >
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Frame Rate</label>
              <select
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                disabled={isRecording}
                className="w-full bg-[#282828] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
              >
                <option value="60">60 FPS</option>
                <option value="30">30 FPS</option>
                <option value="24">24 FPS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-[#242424]">
          <span className="text-xs text-gray-400">
            {isRecording ? 'Recording active...' : 'Ready to record'}
          </span>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-lg shadow-red-500/25 transition-all"
              >
                <Circle size={14} className="fill-white" />
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#333333] hover:bg-[#3d3d3d] text-white transition-colors"
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={handleStopRecording}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <Square size={14} className="fill-white" />
                  {isProcessing ? 'Saving Video...' : 'Stop & Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
