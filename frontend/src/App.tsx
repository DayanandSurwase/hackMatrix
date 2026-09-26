import { RouterProvider, Routes, useNavigate } from './lib/router';
import { CaseProvider } from './lib/context/CaseContext';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider, Icon, Button } from './components/ui';
import { AIAssistant } from './components/ui/AIAssistant';
import { SignInCard } from './components/ui/sign-in-card';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';
import { NewAssessment, Upload, Processing, ExtractionReview } from './pages/Assessment';
import { SchemeResults } from './pages/SchemeResults';
import { SchemeDetail } from './pages/SchemeDetail';
import { Reviews } from './pages/Reviews';
import { Guidance } from './pages/Guidance';

function Shell404() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-faint">
        <Icon name="alert" size={26} />
      </span>
      <p className="font-display text-xl font-bold text-ink">Page not found</p>
      <p className="mt-2 text-sm text-muted">The route you requested doesn't exist in this prototype.</p>
      <Button variant="secondary" className="mt-5" onClick={() => navigate('/dashboard')}>
        Go to dashboard
      </Button>
    </div>
  );
}

const SHELL_ROUTES = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/settings', element: <Settings /> },
  { path: '/assessment/new', element: <NewAssessment /> },
  { path: '/assessment/:id/upload', element: <Upload /> },
  { path: '/assessment/:id/processing', element: <Processing /> },
  { path: '/assessment/:id/extraction', element: <ExtractionReview /> },
  { path: '/assessment/:id/schemes', element: <SchemeResults /> },
  { path: '/assessment/:id/schemes/:sid', element: <SchemeDetail /> },
  { path: '/assessment/:id/guidance', element: <Guidance /> },
  { path: '/reviews', element: <Reviews /> },
];

function AuthedApp() {
  return (
    <AppShell>
      <Routes routes={SHELL_ROUTES} fallback={<Shell404 />} />
    </AppShell>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <CaseProvider>
          <Routes
            routes={[
              { path: '/', element: <SignInCard /> },
              { path: '/onboarding', element: <Onboarding /> },
            ]}
            fallback={<AuthedApp />}
          />
          <AIAssistant />
        </CaseProvider>
      </ToastProvider>
    </RouterProvider>
  );
}
