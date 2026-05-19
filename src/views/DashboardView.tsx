import { Bell, Menu, TrendingUp, ChevronRight } from 'lucide-react';
import { STATUS_META } from '../data/projects';
import type { ProjectStatus } from '../data/projects';
import ProjectCard from '../components/ProjectCard';
import { useApp } from '../router';

const OPEN_STATUSES: ProjectStatus[] = ['New', 'Accepted', 'Submitted'];

const SUMMARY_STATUSES: ProjectStatus[] = ['Submitted', 'Accepted', 'New'];

export default function DashboardView() {
  const { projects, totalPoints, openProject, navigate } = useApp();

  const statusSummary = SUMMARY_STATUSES.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  const recentProjects = projects
    .filter((p) => OPEN_STATUSES.includes(p.status))
    .slice(0, 3);

  const estimatedValue = (totalPoints / 100).toFixed(2);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-background-default">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="bg-primary-main px-5 pt-10 pb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-dark border-2 border-primary-light flex items-center justify-center flex-shrink-0">
          <span className="text-secondary-light text-sm font-bold">AJ</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary-light text-xs font-medium">Good morning</p>
          <p className="text-white text-base font-semibold leading-tight truncate">Alex Johnson</p>
        </div>
        <button className="relative p-2.5 rounded-full bg-primary-dark">
          <Bell className="text-primary-light w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-error flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-bold leading-none">3</span>
          </span>
        </button>
        <button className="p-2.5 rounded-full bg-primary-dark">
          <Menu className="text-primary-light w-5 h-5" />
        </button>
      </header>

      {/* ── Points Balance Card ──────────────────────────── */}
      <div className="px-4 mt-4">
        <div
          className="rounded-2xl px-5 py-5 shadow-lg overflow-hidden relative"
          style={{ backgroundColor: '#1A3828' }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 bg-primary-light" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10 bg-secondary-main" />

          <div className="relative">
            <p className="text-primary-light text-xs font-medium uppercase tracking-widest mb-1">
              Points Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-4xl font-black tracking-tight tabular-nums">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-primary-light text-sm font-medium">pts</span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-primary-light text-xs mb-0.5">Estimated value</p>
                <p className="text-secondary-light font-bold text-base">≈ ${estimatedValue}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-light text-xs mb-0.5">Tier</p>
                <span className="bg-secondary-main text-primary-dark text-xs font-bold px-2.5 py-1 rounded-full">
                  Gold ✦
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-secondary-light" />
              <p className="text-primary-light text-xs">
                <span className="text-secondary-light font-semibold">+1,240 pts</span> earned this month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Cards Grid ────────────────────────────── */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2.5">
        {statusSummary.map(({ status, count }) => {
          const meta = STATUS_META[status];
          return (
            <button
              key={status}
              onClick={() => navigate('projects')}
              className="
                bg-white rounded-xl px-3 py-3.5 border border-gray-100 shadow-sm
                flex flex-col items-center gap-1
                transition-all duration-150
                hover:-translate-y-0.5 hover:shadow-md
                active:scale-[0.98] active:shadow-sm
              "
            >
              <span className={`text-2xl font-black ${meta.textColor}`}>{count}</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                <span className="text-text-secondary text-[11px] font-medium">{meta.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active Projects Preview ──────────────────────── */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary font-semibold text-base">Active Projects</h2>
          <button
            onClick={() => navigate('projects')}
            className="flex items-center gap-0.5 text-primary-main text-xs font-semibold"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {recentProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
            <p className="text-text-secondary text-sm">No active projects</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => openProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}
