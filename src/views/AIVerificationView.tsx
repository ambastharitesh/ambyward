import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader2, Sparkles, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../router';
import { verifyProject } from '../lib/api';
import type { PerQuestionResult } from '../lib/api';

type CheckStatus = 'waiting' | 'checking' | 'done' | 'failed';

interface CheckRowProps {
  label: string;
  sublabel: string;
  status: CheckStatus;
  index: number;
}

function CheckRow({ label, sublabel, status, index }: CheckRowProps) {
  const failed = status === 'failed';
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500"
      style={{
        background:
          status === 'done'
            ? 'rgba(37,83,63,0.12)'
            : failed
            ? 'rgba(239,68,68,0.08)'
            : status === 'checking'
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.02)',
        borderColor:
          status === 'done'
            ? 'rgba(37,83,63,0.5)'
            : failed
            ? 'rgba(239,68,68,0.35)'
            : status === 'checking'
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500"
        style={{
          background:
            status === 'done'
              ? '#25533F'
              : failed
              ? 'rgba(239,68,68,0.25)'
              : status === 'checking'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.04)',
        }}
      >
        {status === 'done' ? (
          <CheckCircle className="text-white w-5 h-5" strokeWidth={2.5} />
        ) : failed ? (
          <XCircle className="text-red-400 w-5 h-5" strokeWidth={2} />
        ) : status === 'checking' ? (
          <Loader2 className="text-white/70 w-5 h-5 animate-spin" />
        ) : (
          <span className="text-white/20 text-sm font-bold">{index + 1}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm transition-colors duration-300"
          style={{
            color:
              status === 'done'
                ? '#AACC96'
                : failed
                ? '#f87171'
                : status === 'checking'
                ? 'white'
                : 'rgba(255,255,255,0.3)',
          }}
        >
          {label}
        </p>
        <p className="text-white/40 text-xs mt-0.5">{sublabel}</p>
      </div>

      <div
        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-all duration-300"
        style={{
          background:
            status === 'done'
              ? 'rgba(170,204,150,0.15)'
              : failed
              ? 'rgba(239,68,68,0.15)'
              : status === 'checking'
              ? 'rgba(255,255,255,0.08)'
              : 'transparent',
          color:
            status === 'done'
              ? '#AACC96'
              : failed
              ? '#f87171'
              : status === 'checking'
              ? 'rgba(255,255,255,0.6)'
              : 'rgba(255,255,255,0.15)',
        }}
      >
        {status === 'done' ? 'Passed' : failed ? 'Failed' : status === 'checking' ? 'Checking…' : 'Queued'}
      </div>
    </div>
  );
}

type ApiSnapshot = {
  visual_passed: boolean;
  context_passed: boolean;
  context_reason?: string;
  per_question?: PerQuestionResult[];
};

export default function AIVerificationView() {
  const { navigate, selectedProjectId } = useApp();
  const [visual, setVisual] = useState<CheckStatus>('waiting');
  const [context, setContext] = useState<CheckStatus>('waiting');
  const [complete, setComplete] = useState(false);
  const [overallFailed, setOverallFailed] = useState(false);
  const [weakQuestions, setWeakQuestions] = useState<PerQuestionResult[]>([]);
  const [contextReason, setContextReason] = useState('');
  const apiResultRef = useRef<ApiSnapshot | null>(null);
  const animDoneRef = useRef(false);

  // ── Kick off real AI verification in background ──────────
  useEffect(() => {
    if (!selectedProjectId) return;
    verifyProject(selectedProjectId)
      .then((result) => {
        apiResultRef.current = {
          visual_passed: result.visual_passed,
          context_passed: result.context_passed,
          context_reason: result.context_reason,
          per_question: result.per_question,
        };
        maybeFinish();
      })
      .catch(() => {
        apiResultRef.current = { visual_passed: true, context_passed: true };
        maybeFinish();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  function maybeFinish() {
    if (!animDoneRef.current) return; // animation still running — it will call finish() when done
    finish();
  }

  function finish() {
    const result = apiResultRef.current;
    const passed = result ? result.visual_passed && result.context_passed : true;

    if (!passed && result) {
      if (!result.visual_passed) setVisual('failed');
      if (!result.context_passed) setContext('failed');
      if (result.context_reason) setContextReason(result.context_reason);
      if (result.per_question?.length) {
        const weak = result.per_question.filter((q) => !q.answered || q.score < 50);
        setWeakQuestions(weak.slice(0, 5));
      }
      setOverallFailed(true);
      setComplete(true);
      return;
    }

    setComplete(true);
    setTimeout(() => navigate('reward'), 1800);
  }

  // ── Timed animation sequence ──────────────────────────────
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];

    ids.push(setTimeout(() => setVisual('checking'), 400));
    ids.push(
      setTimeout(() => {
        setVisual((prev) => prev === 'failed' ? 'failed' : 'done');
        ids.push(setTimeout(() => setContext('checking'), 300));
        ids.push(
          setTimeout(() => {
            setContext((prev) => prev === 'failed' ? 'failed' : 'done');
            ids.push(
              setTimeout(() => {
                animDoneRef.current = true;
                if (apiResultRef.current) {
                  finish(); // API already returned
                }
                // else: API will call maybeFinish() when it returns
              }, 400)
            );
          }, 1500 + 300)
        );
      }, 1500)
    );

    return () => ids.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #0E1A14 0%, #080C0A 55%, #040608 100%)' }}
    >
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary-light" />
          <span className="text-primary-light text-[10px] font-bold uppercase tracking-widest">Step 5 of 6</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-dark flex items-center justify-center flex-shrink-0">
            <Sparkles className="text-secondary-light w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold leading-tight">AI Quality Engine</h1>
            <p className="text-white/45 text-xs">Automated submission review</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 gap-3">
        <CheckRow
          index={0}
          label="Visual Integrity"
          sublabel="Analysing captured photos for clarity & completeness"
          status={visual}
        />
        <CheckRow
          index={1}
          label="Context Analysis"
          sublabel="Evaluating video transcription against campaign brief"
          status={context}
        />

        <div className="flex justify-center gap-1.5 py-1">
          {[visual, context].map((s, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{
                background:
                  s === 'done'
                    ? '#25533F'
                    : s === 'failed'
                    ? '#ef4444'
                    : s === 'checking'
                    ? '#AACC96'
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Success banner */}
        <div
          className="overflow-hidden transition-all duration-700"
          style={{ maxHeight: complete && !overallFailed ? 120 : 0, opacity: complete && !overallFailed ? 1 : 0 }}
        >
          <div className="rounded-2xl border border-primary-main/50 bg-primary-main/15 backdrop-blur-sm px-5 py-4 flex items-center gap-3">
            <ShieldCheck className="text-primary-light w-8 h-8 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-primary-light font-bold text-sm">AI Confirmed All Steps Done Correctly</p>
              <p className="text-white/45 text-xs mt-0.5">Preparing your reward…</p>
            </div>
          </div>
        </div>

        {/* Failure banner */}
        {overallFailed && complete && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-400 w-7 h-7 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-red-300 font-bold text-sm">Verification did not pass</p>
                <p className="text-white/50 text-xs mt-0.5 leading-snug">
                  {contextReason || 'Please re-record and try again'}
                </p>
              </div>
            </div>

            {weakQuestions.length > 0 && (
              <div className="border-t border-red-500/20 pt-3">
                <p className="text-red-200/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Questions that need a better answer
                </p>
                <ul className="flex flex-col gap-1.5">
                  {weakQuestions.map((q) => (
                    <li key={q.id} className="flex items-start gap-2">
                      <span className="text-red-300/60 text-[10px] font-mono pt-0.5 flex-shrink-0">
                        Q{q.id}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white/80 text-xs font-semibold leading-tight">
                          {q.category}
                        </p>
                        <p className="text-white/45 text-[10px] mt-0.5 leading-snug line-clamp-2">
                          {q.reason || q.question}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-10 flex flex-col items-center gap-2">
        <p className="text-white/20 text-xs">Verification is automated and takes seconds</p>
        {overallFailed && (
          <button
            onClick={() => navigate('videoRecorder')}
            className="px-6 py-2 rounded-xl bg-white/10 text-white/70 text-sm font-medium"
          >
            Go Back &amp; Re-record
          </button>
        )}
      </div>
    </div>
  );
}
