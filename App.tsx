import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Lazy loaded screens - reduces initial bundle size significantly
const Dashboard = lazy(() => import('./screens/Dashboard'));
const AddPlant = lazy(() => import('./screens/AddPlant'));
const Alerts = lazy(() => import('./screens/Alerts'));
const PlantDetails = lazy(() => import('./screens/PlantDetails'));
const Diary = lazy(() => import('./screens/Diary'));
const PlantList = lazy(() => import('./screens/PlantList'));
const CrossesScreen = lazy(() => import('./screens/Crosses'));
const GenealogyScreen = lazy(() => import('./screens/GenealogyScreen'));
const BackupScreen = lazy(() => import('./screens/Backup'));
const AIAssistant = lazy(() => import('./screens/AIAssistant'));
const ClimateScreen = lazy(() => import('./screens/ClimateScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const CultivarGeneratorScreen = lazy(() => import('./screens/CultivarGeneratorScreen'));
const QRDesignShowcase = lazy(() => import('./screens/QRDesignShowcase').then(m => ({ default: m.QRDesignShowcase })));
const SeedBankScreen = lazy(() => import('./screens/SeedBankScreen'));
const LabScreen = lazy(() => import('./screens/Lab'));
const SyncScreen = lazy(() => import('./screens/SyncScreen'));

// Non-lazy components (always needed)
import { NotificationToast } from './components/NotificationToast';
import { DesktopLayout } from './components/DesktopLayout';
import { ThemeParticles } from './components/ThemeParticles';
import { ThemeDecorations } from './components/ThemeDecorations';
import { DynamicBackground } from './components/DynamicBackground';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400">Cargando...</span>
    </div>
  </div>
);

// Helper for scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Component that consumes context to display notifications overlay
const NotificationContainer: React.FC = () => {
  const { activeNotification, dismissNotification, completeAlert } = useApp();

  if (!activeNotification) return null;

  return (
    <NotificationToast
      alert={activeNotification}
      onDismiss={dismissNotification}
      onComplete={() => {
        completeAlert(activeNotification.id);
        dismissNotification();
      }}
    />
  );
};

// Component for sync error toast
const ErrorToastContainer: React.FC = () => {
  const { errorToast, dismissErrorToast } = useApp();

  if (!errorToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-red-400">
        <div className="flex items-start gap-3">
          <div className="text-[24px] mt-0.5">⚠️</div>
          <div className="flex-1">
            <p className="font-black text-[13px] uppercase tracking-wide mb-1">Error</p>
            <p className="text-[12px] font-medium opacity-95 leading-relaxed">{errorToast}</p>
          </div>
          <button
            onClick={dismissErrorToast}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
          >
            <span className="text-[14px] font-bold">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* La app arranca directo en el Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddPlant />} />
        <Route path="/plants" element={<PlantList />} />
        <Route path="/plant/:id" element={<PlantDetails />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/crosses" element={<CrossesScreen />} />
        <Route path="/seed-bank" element={<SeedBankScreen />} />
        <Route path="/backup" element={<BackupScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/climate" element={<ClimateScreen />} />
        <Route path="/cultivar-gen" element={<CultivarGeneratorScreen />} />
        <Route path="/lab" element={<LabScreen />} />
        <Route path="/genealogy/:id" element={<GenealogyScreen />} />
        <Route path="/qr-design" element={<QRDesignShowcase />} />
        <Route path="/sync" element={<SyncScreen />} />

        {/* Cualquier ruta desconocida vuelve al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <NotificationContainer />
      <ErrorToastContainer />

      {/* Custom Dynamic Background Texture */}
      <DynamicBackground />

      {/* Theme-specific animated particles */}
      <ThemeParticles />

      {/* Theme-specific decorations (webs, lights, etc) */}
      <ThemeDecorations />

      <div className="min-h-screen w-full bg-transparent text-slate-100 font-sans selection:bg-teal-500/30 selection:text-white">
        <DesktopLayout>
          <AppRoutes />
        </DesktopLayout>
      </div>
    </HashRouter>
  );
};

export default App;
