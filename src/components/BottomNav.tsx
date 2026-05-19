import { Home, FolderOpen, Plus, DollarSign, User } from 'lucide-react';
import { useApp } from '../router';
import type { AppView } from '../router';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { currentView, navigate } = useApp();

  return (
    <nav className="relative bg-white border-t border-gray-200 flex items-end justify-around px-2 pt-2 pb-5">
      {/* Left two items */}
      {NAV_ITEMS.slice(0, 2).map(({ id, label, icon: Icon }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                active ? 'text-primary-main' : 'text-text-secondary'
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                active ? 'text-primary-main' : 'text-text-secondary'
              }`}
            >
              {label}
            </span>
            {active && <span className="w-1 h-1 rounded-full bg-primary-main" />}
          </button>
        );
      })}

      {/* Center floating action button — jumps to Projects (browse new) */}
      <div className="flex flex-col items-center -mt-6">
        <button
          onClick={() => navigate('projects')}
          aria-label="Browse new projects"
          className="w-14 h-14 rounded-full bg-primary-main shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="text-white w-7 h-7" strokeWidth={2.5} />
        </button>
        <span className="text-[10px] font-medium text-text-secondary mt-1">New Video</span>
      </div>

      {/* Right two items */}
      {NAV_ITEMS.slice(2).map(({ id, label, icon: Icon }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                active ? 'text-primary-main' : 'text-text-secondary'
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                active ? 'text-primary-main' : 'text-text-secondary'
              }`}
            >
              {label}
            </span>
            {active && <span className="w-1 h-1 rounded-full bg-primary-main" />}
          </button>
        );
      })}
    </nav>
  );
}
