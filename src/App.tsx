import { AppProvider, useApp } from './router';
import MobileFrame from './components/MobileFrame';
import BottomNav from './components/BottomNav';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import DashboardView from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import ProjectDetailView from './views/ProjectDetailView';
import CameraView from './views/CameraView';
import VideoRecorderView from './views/VideoRecorderView';
import UploadView from './views/UploadView';
import AIVerificationView from './views/AIVerificationView';
import RewardView from './views/RewardView';
import EarningsView from './views/EarningsView';
import ProfileView from './views/ProfileView';

const BOTTOM_NAV_VIEWS = new Set(['dashboard', 'projects', 'earnings', 'profile']);

function Router() {
  const { currentView, isAuthenticated } = useApp();

  const showBottomNav = isAuthenticated && BOTTOM_NAV_VIEWS.has(currentView);

  function renderView() {
    switch (currentView) {
      case 'login':           return <LoginView />;
      case 'signup':          return <SignupView />;
      case 'dashboard':       return <DashboardView />;
      case 'projects':        return <ProjectsView />;
      case 'projectDetail':   return <ProjectDetailView />;
      case 'camera':          return <CameraView />;
      case 'videoRecorder':   return <VideoRecorderView />;
      case 'upload':          return <UploadView />;
      case 'aiVerification':  return <AIVerificationView />;
      case 'reward':          return <RewardView />;
      case 'earnings':        return <EarningsView />;
      case 'profile':         return <ProfileView />;
      default:                return <LoginView />;
    }
  }

  return (
    <MobileFrame>
      {renderView()}
      {showBottomNav && <BottomNav />}
    </MobileFrame>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
