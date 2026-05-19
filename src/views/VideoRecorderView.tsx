import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  Video,
  CheckCircle2,
  Circle,
  Play,
  StopCircle,
  ChevronRight,
  BadgeCheck,
  ListChecks,
  MicOff,
  Mic,
  FlipHorizontal,
  CameraOff,
} from 'lucide-react';
import { useApp } from '../router';
import { VIDEO_QUESTIONS, TOTAL_VIDEO_QUESTIONS } from '../data/videoQuestions';
import { openCameraStream, startRecording, stopStream } from '../lib/camera';
import type { RecorderHandle } from '../lib/camera';
import { uploadStore } from '../lib/uploadStore';

type RecordState = 'idle' | 'recording' | 'preview';

// ── Timer formatter ────────────────────────────────────────────────────────
function formatTime(secs: number) {
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── Idle checklist ─────────────────────────────────────────────────────────
const CHECKLIST = [
  'Answer each question naturally and honestly',
  'Speak clearly in a quiet environment',
  'Recording continues until you tap "Next Question"',
  'You can re-record before submitting',
  'Estimated time: 3–5 minutes',
];

// ── Main component ─────────────────────────────────────────────────────────
export default function VideoRecorderView() {
  const { navigate } = useApp();

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<RecorderHandle | null>(null);
  const facingRef = useRef<'user' | 'environment'>('user');

  const currentQuestion = VIDEO_QUESTIONS[questionIdx];
  const isLastQuestion = questionIdx === TOTAL_VIDEO_QUESTIONS - 1;

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (recordState !== 'recording') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recordState]);

  // ── Start real camera ─────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    stopStream(streamRef.current);
    setCameraError('');
    try {
      const stream = await openCameraStream(facing, true); // audio=true for recording
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      recorderRef.current = startRecording(stream);
    } catch {
      setCameraError('Camera/microphone access denied. Please allow permissions and retry.');
    }
  }, []);

  // Mount camera when recording starts
  useEffect(() => {
    if (recordState !== 'recording') return;
    startCamera(facingRef.current);
    return () => {
      // Don't stop stream here — we stop it in finishRecording
    };
  }, [recordState, startCamera]);

  // Mute / unmute audio tracks
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micMuted; });
  }, [micMuted]);

  // Stop stream when component unmounts
  useEffect(() => () => {
    stopStream(streamRef.current);
  }, []);

  // ── Finish recording ──────────────────────────────────────────────────────
  async function finishRecording() {
    if (!recorderRef.current) {
      setRecordState('preview');
      return;
    }
    const blob = await recorderRef.current.stop();
    stopStream(streamRef.current);

    uploadStore.videoBlob = blob;
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setRecordState('preview');
  }

  // ── Question advance ──────────────────────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    if (isLastQuestion) {
      finishRecording();
      return;
    }
    setQuestionIdx((i) => i + 1);
    setQuestionKey((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastQuestion]);

  // ── Flip camera ───────────────────────────────────────────────────────────
  async function flipCamera() {
    const next = facingRef.current === 'user' ? 'environment' : 'user';
    facingRef.current = next;
    // Restart the recorder so it captures from the new stream
    if (recorderRef.current) {
      recorderRef.current.stop(); // discard this partial chunk
    }
    await startCamera(next);
    recorderRef.current = startRecording(streamRef.current!);
  }

  // ── Re-record ─────────────────────────────────────────────────────────────
  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    uploadStore.videoBlob = null;
    setQuestionIdx(0);
    setQuestionKey(0);
    setElapsed(0);
    setRecordState('recording');
  }

  // ── Submit: navigate to upload screen ─────────────────────────────────────
  function submitVideo() {
    navigate('upload');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IDLE SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (recordState === 'idle') {
    return (
      <div className="flex flex-col flex-1 overflow-y-auto bg-background-default">
        <div className="bg-primary-main px-5 pt-10 pb-6">
          <button
            onClick={() => navigate('projectDetail')}
            className="mb-4 w-9 h-9 rounded-full bg-primary-dark flex items-center justify-center"
          >
            <ChevronLeft className="text-primary-light w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Video className="text-secondary-light w-4 h-4" />
            <span className="text-primary-light text-xs font-medium uppercase tracking-widest">Step 3</span>
          </div>
          <h1 className="text-white text-xl font-bold">Experience Video</h1>
          <p className="text-primary-light text-sm mt-1">
            Q&amp;A Recording · {TOTAL_VIDEO_QUESTIONS} Questions
          </p>
        </div>

        <div className="px-4 mt-4 flex flex-col gap-4">
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg"
            style={{ backgroundColor: '#1A3828' }}
          >
            <div>
              <p className="text-primary-light text-xs mb-0.5">Total Questions</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white text-4xl font-black">{TOTAL_VIDEO_QUESTIONS}</span>
                <span className="text-primary-light text-sm">questions</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-dark flex items-center justify-center">
              <ListChecks className="text-secondary-light w-7 h-7" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-text-primary font-semibold text-sm">How this works</p>
            </div>
            <div className="px-4 py-2">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <CheckCircle2 className="text-primary-main w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-text-secondary text-sm leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-text-primary font-semibold text-sm">Questions at a Glance</p>
            </div>
            <div className="px-4 py-2">
              {VIDEO_QUESTIONS.map((q) => (
                <div key={q.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Circle className="text-gray-300 w-2.5 h-2.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-primary-main bg-primary-light/30 px-1.5 py-0.5 rounded mr-1.5">
                      {q.category}
                    </span>
                    <span className="text-text-secondary text-xs line-clamp-1">{q.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-6" />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button
            onClick={() => { setElapsed(0); setQuestionIdx(0); setQuestionKey(0); setRecordState('recording'); }}
            className="
              w-full bg-primary-main text-white font-bold py-4 rounded-2xl
              flex items-center justify-center gap-2.5
              shadow-[0_4px_14px_rgba(37,83,63,0.4)]
              active:scale-[0.98] active:shadow-none transition-all duration-150
            "
          >
            <Video className="w-5 h-5" />
            Start Video Recording Now
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECORDING SCREEN — real camera feed
  // ══════════════════════════════════════════════════════════════════════════
  if (recordState === 'recording') {
    return (
      <div className="absolute inset-0 z-50 overflow-hidden flex flex-col bg-black">

        {/* Live camera feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: facingRef.current === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.60) 100%)' }}
        />

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 px-8 gap-4">
            <CameraOff className="text-white/60 w-14 h-14" />
            <p className="text-white text-center text-sm">{cameraError}</p>
            <button
              onClick={() => startCamera(facingRef.current)}
              className="px-6 py-2.5 rounded-2xl bg-primary-main text-white font-semibold text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="px-4 pt-10 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-rec-blink" />
              <span className="text-white font-bold text-xs tracking-widest">REC</span>
              <span className="text-white/70 text-xs font-mono ml-1">{formatTime(elapsed)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-secondary-light font-bold text-xs">Q {questionIdx + 1}</span>
              <span className="text-white/50 text-xs">of {TOTAL_VIDEO_QUESTIONS}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicMuted((m) => !m)}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                {micMuted
                  ? <MicOff className="text-red-400 w-4 h-4" />
                  : <Mic className="text-white/70 w-4 h-4" />
                }
              </button>
              <button
                onClick={flipCamera}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                <FlipHorizontal className="text-white/70 w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mx-4 mb-1 h-0.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary-light rounded-full transition-all duration-500"
              style={{ width: `${((questionIdx + 1) / TOTAL_VIDEO_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="absolute inset-0 flex items-center justify-center px-5" style={{ paddingTop: 130 }}>
          <div key={questionKey} className="w-full max-w-sm animate-question-in">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="bg-primary-main px-4 py-2.5 flex items-center justify-between">
                <span className="text-primary-light text-[10px] font-bold tracking-[0.12em] uppercase">
                  {currentQuestion.category}
                </span>
                <span className="text-primary-light/60 text-[10px] font-medium">
                  Question {currentQuestion.id} of {TOTAL_VIDEO_QUESTIONS}
                </span>
              </div>
              <div className="px-4 py-4">
                <p className="text-text-primary font-semibold text-[15px] leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-10 pt-6"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 65%, transparent 100%)' }}
        >
          {isLastQuestion ? (
            <button
              onClick={advanceQuestion}
              className="
                w-full flex items-center justify-center gap-2.5
                bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl
                shadow-[0_4px_16px_rgba(220,38,38,0.45)]
                active:scale-[0.98] transition-all duration-150
              "
            >
              <StopCircle className="w-5 h-5" />
              Finish Recording ⏺
            </button>
          ) : (
            <button
              onClick={advanceQuestion}
              className="
                w-full flex items-center justify-center gap-2.5
                bg-white/15 backdrop-blur-sm border border-white/25
                text-white font-semibold py-4 rounded-2xl
                active:bg-white/25 active:scale-[0.98] transition-all duration-150
              "
            >
              Next Question
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PREVIEW SCREEN — shows recorded video
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="absolute inset-0 z-50 overflow-hidden flex flex-col bg-[#0A0A10]">
      <div
        className="px-5 pt-10 pb-5 flex items-center gap-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
      >
        <button
          onClick={reRecord}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ChevronLeft className="text-white w-5 h-5" />
        </button>
        <div>
          <p className="text-white/60 text-xs">Review your recording</p>
          <p className="text-white font-bold text-base">Experience Video</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
        <div className="w-full rounded-3xl overflow-hidden relative aspect-[9/16] max-h-[52vh] shadow-[0_12px_48px_rgba(0,0,0,0.7)] bg-black">
          {previewUrl ? (
            <video
              src={previewUrl}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="text-white/40 w-14 h-14" />
            </div>
          )}

          {/* Metadata overlay */}
          {!previewUrl && (
            <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between">
              <span className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-white/80 text-[10px] font-mono">
                {formatTime(elapsed)}
              </span>
              <div className="flex items-center gap-1.5 bg-primary-main/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                <BadgeCheck className="text-secondary-light w-3 h-3" />
                <span className="text-white text-[10px] font-bold">{TOTAL_VIDEO_QUESTIONS} Answers</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={reRecord}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/20 bg-white/8 active:bg-white/15 transition-colors"
          >
            <Video className="text-white/70 w-4 h-4" />
            <span className="text-white/80 font-semibold text-sm">Re-record</span>
          </button>
          <button
            onClick={submitVideo}
            className="
              w-full flex items-center justify-center gap-2 py-4 rounded-2xl
              bg-primary-main active:bg-primary-dark text-white font-bold
              shadow-[0_4px_14px_rgba(37,83,63,0.5)]
              active:scale-[0.98] transition-all duration-150
            "
          >
            <BadgeCheck className="w-5 h-5" />
            Submit &amp; Continue
          </button>
        </div>
      </div>

      <div className="pb-6" />
    </div>
  );
}
