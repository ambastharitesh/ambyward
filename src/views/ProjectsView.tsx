import { useState, useEffect } from 'react';
import { useApp } from '../router';
import type { ProjectStatus } from '../data/projects';
import ProjectCard from '../components/ProjectCard';

type Tab = 'open' | 'closed';

const OPEN_STATUSES: ProjectStatus[] = ['New', 'Accepted', 'Submitted'];
const CLOSED_STATUSES: ProjectStatus[] = ['Completed', 'Expired'];

export default function ProjectsView() {
  const { projects, openProject, justAcceptedId, clearJustAccepted } = useApp();
  const [tab, setTab] = useState<Tab>('open');

  // Auto-clear the "Just Accepted" highlight after 4 s
  useEffect(() => {
    if (!justAcceptedId) return;
    const id = setTimeout(() => clearJustAccepted(), 4000);
    return () => clearTimeout(id);
  }, [justAcceptedId, clearJustAccepted]);

  const visibleProjects = projects.filter((p) =>
    tab === 'open' ? OPEN_STATUSES.includes(p.status) : CLOSED_STATUSES.includes(p.status)
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-background-default">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="bg-primary-main px-5 pt-10 pb-5">
        <p className="text-primary-light text-xs font-medium uppercase tracking-widest mb-0.5">Your work</p>
        <h1 className="text-white text-2xl font-bold">Projects</h1>
      </header>

      {/* ── Segment Toggle ───────────────────────────────── */}
      <div className="px-4 mt-4 flex justify-center">
        <div className="bg-white border border-gray-200 rounded-full p-1 flex gap-1 shadow-sm w-full max-w-xs">
          {(['open', 'closed'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize
                ${tab === t ? 'bg-primary-main text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}
              `}
            >
              {t === 'open' ? 'Open' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project List ─────────────────────────────────── */}
      <div className="px-4 mt-4 flex flex-col gap-2.5">
        {visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-4xl">📂</span>
            <p className="text-text-secondary text-sm">No {tab} projects</p>
          </div>
        ) : (
          visibleProjects.map((project) => {
            const isHighlighted = project.id === justAcceptedId;
            return (
              <div key={project.id} className="relative">
                {/* ── Accepted highlight wrapper ─────────── */}
                {isHighlighted && (
                  <>
                    {/* Pulsing border ring */}
                    <div className="absolute inset-0 rounded-xl border-2 border-primary-main animate-accepted-pulse pointer-events-none z-10" />
                    {/* Floating "Just Accepted!" badge */}
                    <div className="absolute -top-3 left-3 z-20 animate-badge-pop">
                      <span className="bg-primary-main text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-light inline-block" />
                        Just Accepted!
                      </span>
                    </div>
                  </>
                )}

                {/* Card with lift when highlighted */}
                <div
                  className="transition-all duration-500"
                  style={{
                    transform: isHighlighted ? 'translateY(-2px)' : 'translateY(0)',
                    filter: isHighlighted ? 'drop-shadow(0 6px 16px rgba(37,83,63,0.2))' : 'none',
                  }}
                >
                  <ProjectCard
                    project={project}
                    onClick={() => openProject(project.id)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}
