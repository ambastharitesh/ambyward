import type { Project } from '../data/projects';
import { STATUS_META } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { name, status, type, closeDate, points } = project;
  const meta = STATUS_META[status];
  const isNew = status === 'New';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className="
        bg-white rounded-xl border border-gray-100 shadow-sm
        px-4 py-3.5 flex items-center gap-3
        transition-all duration-150 ease-out
        hover:-translate-y-0.5 hover:shadow-md
        active:scale-[0.98] active:shadow-sm
        cursor-pointer select-none
      "
    >
      {/* ── Left content ────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {isNew ? (
          /* New status: show "New Project" as heading, type + date below */
          <>
            <p className="text-text-primary font-semibold text-sm">New Project</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-medium bg-secondary-light text-secondary-dark px-2 py-0.5 rounded-full">
                {type}
              </span>
              <span className="text-text-secondary text-[11px]">· Closes {closeDate}</span>
            </div>
          </>
        ) : (
          /* Other statuses: type badge on top, real name below */
          <>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${meta.bgColor} ${meta.textColor}`}>
              {type}
            </span>
            <p className="text-text-primary font-semibold text-sm leading-snug truncate">
              {name}
            </p>
            <p className="text-text-secondary text-[11px] mt-0.5">Closes {closeDate}</p>
          </>
        )}
      </div>

      {/* ── Right content: points + status ──────────────── */}
      <div className="flex flex-col items-end flex-shrink-0 gap-1">
        <span className="text-primary-main font-bold text-lg leading-none tabular-nums">
          {points.toLocaleString()}
        </span>
        <span className="text-text-secondary text-[10px] font-medium -mt-0.5">pts</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dotColor}`} />
          <span className={`text-[10px] font-semibold ${meta.textColor}`}>{meta.label}</span>
        </div>
      </div>
    </div>
  );
}
