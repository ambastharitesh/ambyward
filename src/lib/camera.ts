/**
 * Camera and MediaRecorder utilities.
 * Wraps getUserMedia, photo capture (canvas), and video recording (MediaRecorder).
 */

export type FacingMode = 'environment' | 'user';

// ── Camera stream ─────────────────────────────────────────

export interface OpenStreamOptions {
  facingMode?: FacingMode;
  audio?: boolean;
  /** Ideal capture width in pixels. Default 854 (SD 16:9) for smaller uploads. */
  width?: number;
  /** Ideal capture height in pixels. Default 480 (SD 16:9) for smaller uploads. */
  height?: number;
  /** Ideal frame rate. Lowering to 24 fps shaves more bytes with little perceptual loss. */
  frameRate?: number;
}

export async function openCameraStream(
  facingOrOpts: FacingMode | OpenStreamOptions = 'environment',
  audio = false,
): Promise<MediaStream> {
  // Backwards-compatible: caller can still pass a plain facing string.
  const opts: OpenStreamOptions =
    typeof facingOrOpts === 'string'
      ? { facingMode: facingOrOpts, audio }
      : { audio, ...facingOrOpts };

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: opts.facingMode ?? 'environment',
      width: { ideal: opts.width ?? 854 },
      height: { ideal: opts.height ?? 480 },
      frameRate: { ideal: opts.frameRate ?? 24 },
    },
    audio: opts.audio ?? false,
  });
}

/**
 * Higher-resolution stream for still-photo capture.
 * Photos compress per-file so we keep them sharp; only video uses the SD profile.
 */
export async function openPhotoStream(
  facingMode: FacingMode = 'environment',
): Promise<MediaStream> {
  return openCameraStream({ facingMode, width: 1280, height: 720, frameRate: 30, audio: false });
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

export interface RecordingOptions {
  /** Video bitrate in bits/sec. Default 800 Kbps — ~60% smaller than browser defaults, still clean SD. */
  videoBitsPerSecond?: number;
  /** Audio bitrate in bits/sec. Default 64 Kbps — plenty for Whisper transcription. */
  audioBitsPerSecond?: number;
}

export function startRecording(
  stream: MediaStream,
  options: RecordingOptions = {},
): RecorderHandle {
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: options.videoBitsPerSecond ?? 800_000,
    audioBitsPerSecond: options.audioBitsPerSecond ?? 64_000,
  });
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

/**
 * Pick the best MediaRecorder MIME type the current browser supports.
 *
 * Order:
 *   1. webm/vp9 (Chrome/Edge/Firefox desktop & Android)
 *   2. webm/vp8 (broad webm fallback)
 *   3. webm (any codec the UA chooses)
 *   4. mp4   (iOS Safari 14.5+ — the only option there)
 */
export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * Normalise a MIME type by stripping codec params.
 *   "video/webm;codecs=vp8,opus" → "video/webm"
 *   "video/mp4"                  → "video/mp4"
 */
export function baseMimeType(mime: string): string {
  return (mime || '').split(';')[0].trim().toLowerCase() || 'video/webm';
}

/**
 * Map a base MIME type to a sensible file extension.
 *   "video/webm" → "webm"
 *   "video/mp4"  → "mp4"
 */
export function extensionForMime(mime: string): string {
  const base = baseMimeType(mime);
  if (base === 'video/mp4') return 'mp4';
  return 'webm';
}
