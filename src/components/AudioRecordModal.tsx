import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Square, Play, Pause, Circle } from 'lucide-react';
import { AudioFormat } from '../types';
import { formatDuration } from '../utils/formatters';

interface AudioRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecording: (blob: Blob, format: AudioFormat, duration: number) => Promise<void>;
}

export const AudioRecordModal: React.FC<AudioRecordModalProps> = ({
  isOpen,
  onClose,
  onSaveRecording,
}) => {
  const [sourceMode, setSourceMode] = useState<'both' | 'mic' | 'system'>('both');
  const [format, setFormat] = useState<AudioFormat>('mp3');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(24).fill(10));

  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setMics(audioInputs);
      if (audioInputs.length > 0) setSelectedMicId(audioInputs[0].deviceId);
    });
  }, [isOpen]);

  // Set up live audio analyser for visualizer
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (sourceMode !== 'system') {
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
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const updateVisualizer = () => {
            if (!isMounted) return;
            analyser.getByteFrequencyData(dataArray);

            const bars: number[] = [];
            for (let i = 0; i < 24; i++) {
              const val = dataArray[i % bufferLength];
              bars.push(Math.max(8, (val / 255) * 100));
            }
            setVisualizerBars(bars);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        })
        .catch((err) => {
          console.warn('Audio input error:', err);
        });
    }

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
  }, [isOpen, sourceMode, selectedMicId]);

  const handleStartRecording = async () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // 1. Microphone source
      if (sourceMode === 'both' || sourceMode === 'mic') {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicId === 'default' ? true : { deviceId: { exact: selectedMicId } },
        });
        micStreamRef.current = micStream;
        const micSource = audioCtx.createMediaStreamSource(micStream);
        const micGain = audioCtx.createGain();
        micGain.gain.value = isMicMuted ? 0 : 1;
        micSource.connect(micGain);
        micGain.connect(dest);
      }

      // 2. System audio source
      if (sourceMode === 'both' || sourceMode === 'system') {
        try {
          const sysStream = await (navigator.mediaDevices as any).getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'desktop',
              },
            },
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
              },
            },
          });
          // remove dummy video track
          sysStream.getVideoTracks().forEach((t: any) => t.stop());
          systemStreamRef.current = sysStream;

          if (sysStream.getAudioTracks().length > 0) {
            const sysSource = audioCtx.createMediaStreamSource(sysStream);
            sysSource.connect(dest);
          }
        } catch (e) {
          console.warn('System audio capture note:', e);
        }
      }

      const mixedStream = dest.stream;
      combinedStreamRef.current = mixedStream;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(mixedStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
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
    } catch (err) {
      console.error('Failed to start audio recording:', err);
    }
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
      const finalBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      await onSaveRecording(finalBlob, format, duration);

      // Stop streams
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
      if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach((t) => t.stop());

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
      if (!confirm('Audio recording is active. Are you sure you want to cancel?')) return;
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach((t) => t.stop());
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
        className="bg-[#242424] border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Mic size={16} />
            </div>
            <h2 className="text-white font-semibold text-base">Record Audio</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visualizer Display Area */}
        <div className="bg-[#181818] p-6 flex flex-col items-center justify-center border-b border-white/5">
          {/* Animated waveform bars */}
          <div className="flex items-center justify-center gap-1.5 h-28 w-full max-w-xs">
            {visualizerBars.map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: isRecording
                    ? isPaused
                      ? '#F59E0B'
                      : '#22C55E'
                    : '#3B82F6',
                }}
              />
            ))}
          </div>

          {/* Recording Timer */}
          <div className="mt-4 flex items-center gap-2 font-mono text-2xl text-white font-semibold tracking-wider">
            {isRecording && (
              <div
                className={`w-3 h-3 rounded-full ${
                  isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                }`}
              />
            )}
            <span>{formatDuration(duration)}</span>
          </div>

          <div className="text-xs text-gray-400 mt-1">
            {isRecording
              ? isPaused
                ? 'Recording paused'
                : 'Recording audio live...'
              : 'Configure inputs and press Start'}
          </div>
        </div>

        {/* Configuration Body */}
        <div className="p-5 space-y-4">
          {/* Audio Source Modes */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1.5 uppercase font-medium">
              Audio Sources
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSourceMode('both')}
                disabled={isRecording}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  sourceMode === 'both'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/5 bg-[#1c1c1c] text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                Mic + System
              </button>

              <button
                onClick={() => setSourceMode('mic')}
                disabled={isRecording}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  sourceMode === 'mic'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/5 bg-[#1c1c1c] text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                Mic Only
              </button>

              <button
                onClick={() => setSourceMode('system')}
                disabled={isRecording}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  sourceMode === 'system'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/5 bg-[#1c1c1c] text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                System Only
              </button>
            </div>
          </div>

          {/* Microphone Selector & Format */}
          <div className="grid grid-cols-2 gap-3">
            {sourceMode !== 'system' && (
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Microphone Device</label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  disabled={isRecording}
                  className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
                >
                  {mics.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Output Audio Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                disabled={isRecording}
                className="w-full bg-[#1c1c1c] text-xs text-white p-2 rounded-xl border border-white/10 disabled:opacity-50"
              >
                <option value="mp3">MP3 (Compressed 192kbps)</option>
                <option value="wav">WAV (Lossless PCM 48kHz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] flex items-center justify-end gap-2.5 bg-[#1f1f1f]">
          {!isRecording ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Circle size={14} className="fill-white" />
                Start Recording
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isMicMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#333333] hover:bg-[#3d3d3d] text-white'
                }`}
              >
                {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
                {isMicMuted ? 'Unmute' : 'Mute'}
              </button>

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
                {isProcessing ? 'Saving Audio...' : 'Stop & Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
