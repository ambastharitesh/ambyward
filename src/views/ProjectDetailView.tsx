import { ChevronLeft, MapPin, Calendar, Star, Camera, ClipboardList, Package, CheckCheck } from 'lucide-react';
import { useApp } from '../router';
import { STATUS_META } from '../data/projects';
import { CAMERA_STEPS } from '../data/campaign';

const TYPE_ICONS: Record<string, React.ElementType> = {
  'in-store': MapPin,
  'online': ClipboardList,
  'survey': ClipboardList,
  'survey + at-home': Package,
  'at-home': Package,
};

export default function ProjectDetailView() {
  const { selectedProjectId, projects, navigate, acceptProject, startCamera } = useApp();

  const project = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const meta = STATUS_META[project.status];
  const TypeIcon = TYPE_ICONS[project.type] ?? MapPin;

  const isNew      = project.status === 'New';
  const isAccepted = project.status === 'Accepted';

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-background-default">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="relative bg-primary-main px-5 pt-10 pb-8">
        <button
          onClick={() => navigate('projects')}
          className="mb-4 w-9 h-9 rounded-full bg-primary-dark flex items-center justify-center"
        >
          <ChevronLeft className="text-primary-light w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bgColor} ${meta.textColor}`}>
            {meta.label}
          </span>
          <span className="text-xs font-medium bg-primary-dark text-primary-light px-2.5 py-1 rounded-full flex items-center gap-1">
            <TypeIcon className="w-3 h-3" />
            {project.type}
          </span>
        </div>

        <h1 className="text-white text-xl font-bold leading-tight">
          {isNew ? 'New Project Brief' : project.name}
        </h1>

        <div className="flex items-center gap-1.5 mt-2">
          <Calendar className="text-primary-light w-3.5 h-3.5" />
          <span className="text-primary-light text-xs">Closes {project.closeDate}</span>
        </div>
      </div>

      {/* ── Points reward card ───────────────────────────── */}
      <div className="px-4 -mt-4">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg"
          style={{ backgroundColor: '#1A3828' }}
        >
          <div>
            <p className="text-primary-light text-xs mb-0.5">Points Reward</p>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-3xl font-black">{project.points.toLocaleString()}</span>
              <span className="text-primary-light text-sm">pts</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary-light text-xs mb-0.5">Est. value</p>
            <span className="text-secondary-light font-bold text-base">
              ≈ ${(project.points / 100).toFixed(2)}
            </span>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Star className="text-secondary-main w-3 h-3" fill="currentColor" />
              <span className="text-secondary-light text-xs">Gold eligible</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brief description ────────────────────────────── */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h2 className="text-text-primary font-semibold text-sm mb-2">Project Brief</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {isNew || isAccepted
              ? 'Visit your nearest participating store and document the current shelf display for this product category. Your photos help brands understand how their products are positioned at retail.'
              : `All required steps for "${project.name}" have been completed.`}
          </p>
        </div>
      </div>

      {/* ── Steps preview ────────────────────────────────── */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Camera className="text-primary-main w-4 h-4" />
            <h2 className="text-text-primary font-semibold text-sm">Photo Journey — 2 Steps</h2>
          </div>
          {CAMERA_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className={`flex items-start gap-3 px-4 py-3 ${idx < CAMERA_STEPS.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-dark text-[10px] font-bold">{step.step}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm">{step.instruction}</p>
                <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed">{step.subInstruction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Guidelines ───────────────────────────────────── */}
      <div className="px-4 mt-4">
        <div className="bg-secondary-light/30 border border-secondary-light rounded-xl p-4">
          <p className="text-secondary-dark text-xs font-semibold mb-1.5">Photo Guidelines</p>
          {[
            'Ensure good lighting — avoid shadows across products',
            'Hold phone steady and horizontally for shelf shots',
            'Include full product labels — avoid cut-off edges',
            'Keep fingers and obstructions out of frame',
          ].map((tip) => (
            <p key={tip} className="text-secondary-dark text-xs leading-relaxed flex gap-1.5 mt-1">
              <span className="mt-0.5">·</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="pb-6" />

      {/* ── Sticky CTA ───────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">

        {/* New → show Accept Project */}
        {isNew && (
          <button
            onClick={() => acceptProject(project.id)}
            className="
              w-full bg-secondary-main text-white font-bold py-4 rounded-2xl
              flex items-center justify-center gap-2.5
              shadow-[0_4px_14px_rgba(175,171,35,0.35)]
              active:scale-[0.98] active:shadow-none transition-all duration-150
            "
          >
            <CheckCheck className="w-5 h-5" />
            Accept Project
          </button>
        )}

        {/* Accepted → show Start Journey */}
        {isAccepted && (
          <button
            onClick={startCamera}
            className="
              w-full bg-primary-main text-white font-bold py-4 rounded-2xl
              flex items-center justify-center gap-2.5
              shadow-[0_4px_14px_rgba(37,83,63,0.4)]
              active:scale-[0.98] active:shadow-none transition-all duration-150
            "
          >
            <Camera className="w-5 h-5" />
            Start Journey
          </button>
        )}

        {/* Any other status → read-only */}
        {!isNew && !isAccepted && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-text-secondary text-xs">
              This project is{' '}
              <span className={`font-semibold ${meta.textColor}`}>{meta.label}</span>
              {' '}— no further action required.
            </p>
            <button
              onClick={() => navigate('projects')}
              className="w-full border border-primary-main text-primary-main font-semibold py-3.5 rounded-2xl active:bg-primary-light/30 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
