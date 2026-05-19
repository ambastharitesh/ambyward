/**
 * Camera and MediaRecorder utilities.
 * Wraps getUserMedia, photo capture (canvas), and video recording (MediaRecorder).
 */

export type FacingMode = 'environment' | 'user';

// ── Camera stream ─────────────────────────────────────────

export async function openCameraStream(
  facingMode: FacingMode = 'environment',
  audio = false,
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio,
  });
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

// ── Photo capture ─────────────────────────────────────────

export function capturePhotoFromVideo(videoEl: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas 2D context unavailable'));
    ctx.drawImage(videoEl, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.9,
    );
  });
}

// ── Video recording ───────────────────────────────────────

export interface RecorderHandle {
  stop: () => Promise<Blob>;
  pause: () => void;
  resume: () => void;
}

export function startRecording(stream: MediaStream): RecorderHandle {
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(1000); // emit chunks every 1 s

  const stop = (): Promise<Blob> =>
    new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        resolve(blob);
      };
      if (recorder.state !== 'inactive') recorder.stop();
    });

  return {
    stop,
    pause: () => recorder.state === 'recording' && recorder.pause(),
    resume: () => recorder.state === 'paused' && recorder.resume(),
  };
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}
