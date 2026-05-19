import { useState, useEffect, useRef } from 'react';
import { Upload, Wifi } from 'lucide-react';
import { useApp } from '../router';
import { uploadStore } from '../lib/uploadStore';
import { getPhotoUploadUrl, getVideoUploadUrl, uploadToS3, submitProject } from '../lib/api';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function uploadLabel(pct: number) {
  if (pct < 30) return 'Compressing photos…';
  if (pct < 70) return 'Uploading video…';
  if (pct < 95) return 'Finalising…';
  return 'Upload complete!';
}

export default function UploadView() {
  const { navigate, selectedProjectId } = useApp();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    doUpload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doUpload() {
    try {
      const projectId = selectedProjectId ?? 'unknown';
      const photos = uploadStore.photos;
      const videoBlob = uploadStore.videoBlob;
      const totalParts = photos.length + (videoBlob ? 1 : 0) || 1;
      let completedParts = 0;

      const onPartProgress = (partFraction: number) => {
        const pct = Math.round(((completedParts + partFraction) / totalParts) * 100);
        setProgress(Math.min(pct, 99));
      };

      // Upload photos
      for (const photo of photos) {
        try {
          const { upload_url, key } = await getPhotoUploadUrl(projectId, photo.step);
          await uploadToS3(upload_url, photo.blob, (p) => onPartProgress(p / 100));
          photo.key = key;
        } catch (e) {
          console.warn('Photo upload failed, continuing:', e);
        }
        completedParts++;
        setProgress(Math.round((completedParts / totalParts) * 100));
      }

      // Upload video
      if (videoBlob) {
        const { upload_url, key } = await getVideoUploadUrl(projectId);
        await uploadToS3(upload_url, videoBlob, (p) => onPartProgress(p / 100));
        uploadStore.videoKey = key;
        completedParts++;
        setProgress(Math.round((completedParts / totalParts) * 100));
      }

      // Submit to backend with collected keys
      const photoKeys = photos.map((p) => p.key).filter(Boolean);
      await submitProject(projectId, photoKeys, uploadStore.videoKey || '');

      setProgress(100);
      setDone(true);
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: simulate completion so the user can continue
      setError('Upload issue — proceeding to verification.');
      setProgress(100);
      setDone(true);
    }
  }

  // Auto-transition after brief pause at 100%
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => navigate('aiVerification'), 900);
    return () => clearTimeout(id);
  }, [done, navigate]);

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const pct = Math.min(progress, 100);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #12181E 0%, #080C10 60%, #040608 100%)' }}
    >
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-primary-main" />
          <span className="text-primary-light text-[10px] font-bold uppercase tracking-widest">Step 4 of 6</span>
        </div>
        <h1 className="text-white text-xl font-bold">Uploading</h1>
        <p className="text-white/50 text-sm mt-0.5">Photos &amp; Experience Video</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
        <div className="relative flex items-center justify-center">
          {done && (
            <div className="absolute w-44 h-44 rounded-full bg-primary-main/10 animate-ping" />
          )}
          <svg width="168" height="168" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#1A2A20" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke={done ? '#AACC96' : '#25533F'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.4s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center gap-1">
            {done
              ? <Upload className="text-primary-light w-8 h-8" />
              : <Wifi className="text-primary-main w-7 h-7" />
            }
            <span className="text-white font-black text-2xl tabular-nums">{pct}%</span>
          </div>
        </div>

        <p className="text-white/70 text-sm font-medium text-center">
          {error || uploadLabel(pct)}
        </p>

        <div className="w-full">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: done
                  ? 'linear-gradient(to right, #25533F, #AACC96)'
                  : 'linear-gradient(to right, #1A3828, #25533F)',
                transition: 'width 0.12s linear',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: 'Photos',   threshold: 0,  width: 30 },
            { label: 'Video',    threshold: 30, width: 40 },
            { label: 'Finalise', threshold: 70, width: 30 },
          ].map(({ label, threshold, width }) => {
            const complete = pct >= threshold + width;
            const active = pct >= threshold && !complete;
            return (
              <div
                key={label}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-500 ${
                  complete
                    ? 'bg-primary-main/20 border-primary-main text-primary-light'
                    : active
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-transparent border-white/10 text-white/30'
                }`}
              >
                {complete ? '✓ ' : ''}{label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pb-10 flex flex-col items-center gap-1">
        <p className="text-white/25 text-xs">Do not close this screen</p>
      </div>
    </div>
  );
}
