import { Trophy, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../router';

// Confetti dot positions — purely decorative
const CONFETTI = [
  { x: '12%',  y: '18%', size: 6,  color: '#EFCE7B', rotate: 15  },
  { x: '82%',  y: '14%', size: 5,  color: '#AACC96', rotate: -20 },
  { x: '22%',  y: '28%', size: 4,  color: '#AFAB23', rotate: 30  },
  { x: '75%',  y: '22%', size: 7,  color: '#EFCE7B', rotate: -10 },
  { x: '8%',   y: '42%', size: 5,  color: '#AACC96', rotate: 25  },
  { x: '88%',  y: '38%', size: 4,  color: '#AFAB23', rotate: -35 },
  { x: '18%',  y: '55%', size: 6,  color: '#EFCE7B', rotate: 10  },
  { x: '78%',  y: '50%', size: 5,  color: '#AACC96', rotate: -15 },
  { x: '30%',  y: '12%', size: 4,  color: '#AFAB23', rotate: 40  },
  { x: '65%',  y: '10%', size: 6,  color: '#EFCE7B', rotate: -25 },
];

export default function RewardView() {
  const { selectedProjectId, projects, collectReward } = useApp();

  const project = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const estimatedValue = (project.points / 100).toFixed(2);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, #1A3828 0%, #0D1F16 40%, #070E0B 80%, #040608 100%)',
      }}
    >
      {/* ── Decorative confetti dots ──────────────────── */}
      {CONFETTI.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-sm opacity-60"
          style={{
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size * 1.6,
            background: c.color,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}

      {/* ── Step label ───────────────────────────────── */}
      <div className="px-5 pt-12">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary-main" />
          <span className="text-secondary-light text-[10px] font-bold uppercase tracking-widest">Step 6 of 6 · Complete</span>
        </div>
      </div>

      {/* ── Trophy + ping ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        <div className="flex flex-col items-center gap-3">
          {/* Ping rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full border-2 border-secondary-main/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-24 h-24 rounded-full border-2 border-secondary-main/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />

            {/* Trophy icon */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center animate-trophy-bounce"
              style={{ background: 'linear-gradient(135deg, #AFAB23 0%, #EFCE7B 60%, #D4A017 100%)' }}
            >
              <Trophy className="text-white w-10 h-10 drop-shadow-lg" fill="white" />
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-secondary-light text-xs font-semibold uppercase tracking-[0.15em] mb-1">
              Congratulations!
            </p>
            <h1 className="text-white text-3xl font-black leading-tight">Reward Unlocked!</h1>
            <p className="text-white/50 text-sm mt-1.5">
              Your submission has been verified and approved
            </p>
          </div>
        </div>

        {/* ── Reward card ──────────────────────────────── */}
        <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Card top — forest green */}
          <div
            className="px-5 py-5 relative overflow-hidden"
            style={{ backgroundColor: '#1A3828' }}
          >
            {/* Decorative circle */}
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary-light/8" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-secondary-main/8" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-primary-light text-xs font-medium mb-1">Points Credited</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-4xl font-black tabular-nums">
                    +{project.points.toLocaleString()}
                  </span>
                  <span className="text-primary-light font-medium">pts</span>
                </div>
                <p className="text-secondary-light font-semibold mt-1">≈ ${estimatedValue} value</p>
              </div>
              <div className="flex items-center gap-1 bg-secondary-main/20 border border-secondary-main/30 rounded-full px-2.5 py-1.5">
                <Star className="text-secondary-light w-3.5 h-3.5" fill="currentColor" />
                <span className="text-secondary-light text-xs font-bold">Gold</span>
              </div>
            </div>
          </div>

          {/* Card bottom — white */}
          <div className="bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs">Project</p>
                <p className="text-text-primary font-semibold text-sm mt-0.5 leading-snug">
                  {project.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-primary-light/40 rounded-full px-2.5 py-1">
                <Sparkles className="text-primary-dark w-3 h-3" />
                <span className="text-primary-dark text-[10px] font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────── */}
        <button
          onClick={collectReward}
          className="
            w-full flex items-center justify-center gap-2.5
            py-4 rounded-2xl font-bold text-base
            shadow-[0_6px_20px_rgba(175,171,35,0.35)]
            active:scale-[0.98] active:shadow-none transition-all duration-150
          "
          style={{
            background: 'linear-gradient(135deg, #AFAB23 0%, #EFCE7B 60%, #C8A816 100%)',
            color: '#1A1A1E',
          }}
        >
          <Trophy className="w-5 h-5" />
          Collect Reward
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="pb-10" />
    </div>
  );
}
