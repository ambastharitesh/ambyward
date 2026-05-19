import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../router';

const MENU_ITEMS = [
  { icon: Bell, label: 'Notifications', sub: 'Manage alerts' },
  { icon: Shield, label: 'Privacy & Security', sub: 'Passwords, 2FA' },
  { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs, contact us' },
];

export default function ProfileView() {
  const { logout } = useApp();

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="bg-primary-main px-5 pt-10 pb-6">
        <p className="text-primary-light text-xs font-medium uppercase tracking-widest mb-0.5">
          Account
        </p>
        <h1 className="text-white text-2xl font-bold">Profile</h1>
      </header>

      {/* Avatar card */}
      <div className="px-4 -mt-1">
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-main flex items-center justify-center flex-shrink-0">
            <User className="text-white w-7 h-7" />
          </div>
          <div>
            <p className="text-text-primary font-bold text-base">Alex Johnson</p>
            <p className="text-text-secondary text-sm">+1 (555) 000-0000</p>
            <span className="mt-1 inline-block bg-secondary-light text-secondary-dark text-xs font-semibold px-2 py-0.5 rounded-full">
              Gold Member
            </span>
          </div>
        </div>
      </div>

      {/* Settings menu */}
      <div className="px-4 mt-5">
        <h2 className="text-text-primary font-semibold text-base mb-3">Settings</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {MENU_ITEMS.map(({ icon: Icon, label, sub }) => (
            <button
              key={label}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-background-default flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-main" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm">{label}</p>
                <p className="text-text-secondary text-xs">{sub}</p>
              </div>
              <ChevronRight className="text-text-secondary w-4 h-4 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-error text-error font-semibold text-sm active:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      <div className="pb-4" />
    </div>
  );
}
