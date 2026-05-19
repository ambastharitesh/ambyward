import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { TOTAL_CAMERA_STEPS } from './data/campaign';
import { PROJECTS } from './data/projects';
import type { Project } from './data/projects';
import { acceptProject as apiAccept, completeProject as apiComplete, clearToken } from './lib/api';
import { clearUploadStore } from './lib/uploadStore';

export type AppView =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'projects'
  | 'earnings'
  | 'profile'
  | 'projectDetail'
  | 'camera'
  | 'videoRecorder'
  | 'upload'
  | 'aiVerification'
  | 'reward';

interface AppContextValue {
  currentView: AppView;
  isAuthenticated: boolean;
  selectedProjectId: string | null;
  cameraStep: number;
  projects: Project[];
  totalPoints: number;
  justAcceptedId: string | null;
  navigate: (view: AppView) => void;
  login: (initialPoints?: number) => void;
  logout: () => void;
  openProject: (id: string) => void;
  acceptProject: (id: string) => void;
  startCamera: () => void;
  advanceCameraStep: () => void;
  collectReward: () => void;
  clearJustAccepted: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [cameraStep, setCameraStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([...PROJECTS]);
  const [totalPoints, setTotalPoints] = useState(32450);
  const [justAcceptedId, setJustAcceptedId] = useState<string | null>(null);

  function navigate(view: AppView) {
    setCurrentView(view);
  }

  function login(initialPoints = 32450) {
    setTotalPoints(initialPoints);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  }

  function logout() {
    clearToken();
    setIsAuthenticated(false);
    setCurrentView('login');
  }

  function openProject(id: string) {
    setSelectedProjectId(id);
    setCurrentView('projectDetail');
  }

  function acceptProject(id: string) {
    // Optimistic local update
    setProjects((ps) =>
      ps.map((p) => (p.id === id ? { ...p, status: 'Accepted' } : p))
    );
    setJustAcceptedId(id);
    setCurrentView('projects');
    // Background sync with backend
    apiAccept(id).catch(() => { /* ignore — local state is source of truth */ });
  }

  function startCamera() {
    clearUploadStore();
    setCameraStep(1);
    setCurrentView('camera');
  }

  function advanceCameraStep() {
    if (cameraStep >= TOTAL_CAMERA_STEPS) {
      setCameraStep(1);
      setCurrentView('videoRecorder');
    } else {
      setCameraStep((s) => s + 1);
    }
  }

  function collectReward() {
    if (selectedProjectId) {
      const proj = projects.find((p) => p.id === selectedProjectId);
      // Optimistic local update
      if (proj) setTotalPoints((t) => t + proj.points);
      setProjects((ps) =>
        ps.map((p) =>
          p.id === selectedProjectId ? { ...p, status: 'Completed' } : p
        )
      );
      // Background sync — update total_points from server response when available
      apiComplete(selectedProjectId)
        .then((res) => setTotalPoints(res.total_points))
        .catch(() => { /* local optimistic update stays */ });
    }
    clearUploadStore();
    setCurrentView('dashboard');
  }

  function clearJustAccepted() {
    setJustAcceptedId(null);
  }

  return (
    <AppContext.Provider
      value={{
        currentView,
        isAuthenticated,
        selectedProjectId,
        cameraStep,
        projects,
        totalPoints,
        justAcceptedId,
        navigate,
        login,
        logout,
        openProject,
        acceptProject,
        startCamera,
        advanceCameraStep,
        collectReward,
        clearJustAccepted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
