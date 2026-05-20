import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Zap, ZapOff, CheckCircle, RotateCcw, ArrowRight, CameraOff } from 'lucide-react';
import { useApp } from '../router';
import { CAMERA_STEPS, TOTAL_CAMERA_STEPS } from '../data/campaign';
import { openPhotoStream, capturePhotoFromVideo, stopStream } from '../lib/camera';
import { getPhotoUploadUrl, uploadToS3 } from '../lib/api';
import { uploadStore } from '../lib/uploadStore';

type CamState = 'viewfinder' | 'captured' | 'uploading' | 'error';

export default function CameraView() {
  const { cameraStep, advanceCameraStep, navigate, selectedProjectId } = useApp();
  const [camState, setCamState] = useState<CamState>('viewfinder');
  const [flashing, setFlashing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stepData = CAMERA_STEPS[cameraStep - 1] ?? CAMERA_STEPS[0];
  const progressPct = ((cameraStep - 1) / TOTAL_CAMERA_STEPS) * 100;

  // ── Start camera on mount / step change ──────────────────
  const startCamera = useCallback(async () => {
    stopStream(streamRef.current);
    try {
      const stream = await openPhotoStream('environment');
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setErrorMsg('');
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permission and reload.');
    }
  }, []);

  useEffect(() => {
    if (camState === 'viewfinder') startCamera();
    return () => { if (camState !== 'viewfinder') stopStream(streamRef.current); };
  }, [camState, startCamera]);

  // Stop stream when unmounted
  useEffect(() => () => stopStream(streamRef.current), []);

  // ── Shutter ───────────────────────────────────────────────
  async function handleShutter() {
    if (camState !== 'viewfinder' || !videoRef.current) return;

    setFlashing(true);
    setTimeout(() => setFlashing(false), 400);

    try {
      const blob = await capturePhotoFromVideo(videoRef.current);
      setCapturedBlob(blob);
      stopStream(streamRef.current);
      setTimeout(() => setCamState('captured'), 300);
    } catch {
      setErrorMsg('Failed to capture photo. Please try again.');
    }
  }

  function handleRetake() {
    setCapturedBlob(null);
    setCamState('viewfinder');
  }

  async function handleContinue() {
    if (!capturedBlob || !selectedProjectId) {
      advanceCameraStep();
      return;
    }

    setCamState('uploading');
    try {
      const { upload_url, key } = await getPhotoUploadUrl(selectedProjectId, cameraStep);
      await uploadToS3(upload_url, capturedBlob, undefined, 'image/jpeg');

      // Store key for later submission
      const existing = uploadStore.photos.find((p) => p.step === cameraStep);
      if (existing) {
        existing.blob = capturedBlob;
        existing.key = key;
      } else {
        uploadStore.photos.push({ step: cameraStep, blob: capturedBlob, key });
      }

      setCapturedBlob(null);
      setCamState('viewfinder');
      advanceCameraStep();
    } catch (err) {
      console.error('Photo upload error:', err);
      // Still advance — upload can be retried on submit
      uploadStore.photos.push({ step: cameraStep, blob: capturedBlob, key: `fallback-step${cameraStep}` });
      setCapturedBlob(null);
      setCamState('viewfinder');
      advanceCameraStep();
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden z-50 flex flex-col">

      {/* ── Live camera feed ─────────────────────────────── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ display: camState === 'viewfinder' ? 'block' : 'none' }}
      />

      {/* Captured preview (static frame) */}
      {camState !== 'viewfinder' && capturedBlob && (
        <img
          src={URL.createObjectURL(capturedBlob)}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Captured"
        />
      )}

      {/* Fallback dark background */}
      {camState !== 'viewfinder' && !capturedBlob && (
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* ── Error state ──────────────────────────────────── */}
      {errorMsg && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 px-8 gap-4">
          <CameraOff className="text-white/60 w-14 h-14" />
          <p className="text-white text-center text-sm">{errorMsg}</p>
          <button
            onClick={startCamera}
            className="px-6 py-2.5 rounded-2xl bg-primary-main text-white font-semibold text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Rule-of-thirds grid ──────────────────────────── */}
      {camState === 'viewfinder' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white opacity-10" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white opacity-10" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white opacity-10" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white opacity-10" />
        </div>
      )}

      {/* ── Camera brackets ──────────────────────────────── */}
      {camState === 'viewfinder' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-56 h-56">
            <div className="absolute top-0 left-0 w-9 h-9 border-t-2 border-l-2 border-white/75 rounded-tl" />
            <div className="absolute top-0 right-0 w-9 h-9 border-t-2 border-r-2 border-white/75 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-2 border-l-2 border-white/75 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-2 border-r-2 border-white/75 rounded-br" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-9 h-9 rounded-full bg-white/15 animate-ping" />
              <div className="w-3 h-3 rounded-full bg-white/60" />
            </div>
          </div>
        </div>
      )}

      {/* ── Top header ───────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-auto"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.50) 65%, transparent 100%)' }}
      >
        <div className="px-4 pt-10 pb-8">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => { stopStream(streamRef.current); navigate('projectDetail'); }}
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
            >
              <ChevronLeft className="text-white w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="flex items-center gap-1">
                {Array.from({ length: TOTAL_CAMERA_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < cameraStep - 1
                        ? 'w-4 bg-white'
                        : i === cameraStep - 1
                        ? 'w-4 bg-secondary-light'
                        : 'w-1.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-xs font-medium">{cameraStep}/{TOTAL_CAMERA_STEPS}</span>
            </div>

            <button
              onClick={() => setFlashOn((f) => !f)}
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
            >
              {flashOn
                ? <Zap className="text-secondary-light w-5 h-5" fill="currentColor" />
                : <ZapOff className="text-white/60 w-5 h-5" />}
            </button>
          </div>

          <div className="h-0.5 bg-white/15 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-secondary-light rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-base tracking-wide drop-shadow-md">
              {stepData.instruction}
            </p>
            <p className="text-white/65 text-xs mt-0.5 drop-shadow">{stepData.subInstruction}</p>
          </div>
        </div>
      </div>

      {/* ── Flash overlay ────────────────────────────────── */}
      {flashing && (
        <div className="absolute inset-0 z-40 bg-white animate-camera-flash pointer-events-none" />
      )}

      {/* ── Uploading state ──────────────────────────────── */}
      {camState === 'uploading' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <p className="text-white text-sm font-medium">Saving photo…</p>
          </div>
        </div>
      )}

      {/* ── Photo Captured state ─────────────────────────── */}
      {camState === 'captured' && (
        <div className="absolute inset-0 z-30 flex flex-col">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="text-white w-14 h-14 drop-shadow-lg" strokeWidth={1.5} />
              <p className="text-white font-bold text-lg tracking-wide">Photo Captured</p>
            </div>
          </div>
          <div
            className="relative px-5 pb-12 pt-6"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm active:bg-white/20 transition-colors"
              >
                <RotateCcw className="text-white w-4 h-4" />
                <span className="text-white font-semibold text-sm">Retake</span>
              </button>
              <button
                onClick={handleContinue}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-main active:bg-primary-dark transition-colors"
              >
                <span className="text-white font-bold text-sm">
                  {cameraStep >= TOTAL_CAMERA_STEPS ? 'Next Step →' : 'Continue'}
                </span>
                <ArrowRight className="text-white w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shutter button ───────────────────────────────── */}
      {camState === 'viewfinder' && !errorMsg && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-12 pt-8 gap-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.42) 60%, transparent 100%)' }}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5">
            <p className="text-white/70 text-xs font-medium">
              Step <span className="text-white font-bold">{cameraStep}</span> of {TOTAL_CAMERA_STEPS}
            </p>
          </div>
          <button
            onClick={handleShutter}
            className="relative flex items-center justify-center active:scale-95 transition-transform duration-100"
            aria-label="Take photo"
          >
            <div className="absolute w-20 h-20 rounded-full border-2 border-white/35 animate-shutter-ping" />
            <div
              className="rounded-full border-[3px] border-white/80 flex items-center justify-center"
              style={{ width: 72, height: 72 }}
            >
              <div
                className="rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.45)]"
                style={{ width: 56, height: 56 }}
              />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
