

import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './screens/Dashboard';
import AddPlant from './screens/AddPlant';
import Alerts from './screens/Alerts';
import PlantDetails from './screens/PlantDetails';
import Diary from './screens/Diary';
import PlantList from './screens/PlantList';
import CrossesScreen from './screens/Crosses';
import GenealogyScreen from './screens/GenealogyScreen';
import BackupScreen from './screens/Backup';
import AIAssistant from './screens/AIAssistant';
import LoginScreen from './screens/LoginScreen';
import AdminKeys from './screens/AdminKeys';
import AdminPrices from './screens/AdminPrices';
import AdminDashboard from './screens/admin/AdminDashboard'; // Web Admin
import AdminThemeScreen from './screens/admin/AdminThemeScreen';
import AdminUsers from './screens/admin/AdminUsers'; // Web Admin
import LandingPage from './screens/LandingPage'; // Landing Publica
import PublicGallery from './screens/PublicGallery'; // Galería Pública (Fase 2)
import ClimateScreen from './screens/ClimateScreen'; // Fase 2 Clima
import InboxScreen from './screens/InboxScreen'; // Nueva Pantalla Inbox
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import SystemStatus from './screens/SystemStatus';
import DesignConcept from './screens/DesignConcept'; // Mockup de Diseño
import GeneticCalculatorScreen from './screens/GeneticCalculatorScreen';
import CultivarGeneratorScreen from './screens/CultivarGeneratorScreen';
import ShopManager from './screens/shop/ShopManager';
import ShopPublic from './screens/shop/ShopPublic';
import { QRDesignShowcase } from './screens/QRDesignShowcase';
import DiscoveryPrototype from './screens/DiscoveryPrototype';
import SeedBankScreen from './screens/SeedBankScreen';
import { NotificationToast } from './components/NotificationToast';
import { DesktopLayout } from './components/DesktopLayout';
import { CarniBotIcon } from './components/CarniBotIcon';
import { BroadcastProvider } from './context/BroadcastContext';
import { BroadcastBanner } from './components/BroadcastBanner';
import { ThemeParticles } from './components/ThemeParticles';
import { ThemeDecorations } from './components/ThemeDecorations';



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
            <p className="font-black text-[13px] uppercase tracking-wide mb-1">Error de Sincronización</p>
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

// Componente para proteger rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Componente para proteger rutas de Admin Web
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <div className="flex h-screen items-center justify-center bg-[#0F172A] text-white">Cargando acceso...</div>;

  if (!user?.isAuthenticated || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Componente para proteger por PLAN (Basic < Pro < Elite)
// Import helpers explicitly if needed or use inline logic since we have access to user.plan
const PlanRoute: React.FC<{ children: React.ReactNode, requiredPlan: 'pro' | 'elite' }> = ({ children, requiredPlan }) => {
  const { user } = useAuth();
  const PLAN_LEVELS = { basic: 0, pro: 1, elite: 2 };

  const userLevel = PLAN_LEVELS[user?.plan || 'basic'];
  const requiredLevel = PLAN_LEVELS[requiredPlan];

  if (userLevel < requiredLevel) {
    // Si no tiene nivel, redirigir al dashboard (allí se puede mostrar modal si intentan entrar por menú)
    // O idealmente mostrar la pantalla de UpSell aquí mismo. Por simplicidad, redirect a Dash.
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Ruta Raíz - Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Ruta Pública - Galería de Vivero (Fase 2) */}
      <Route path="/vivero/:slug" element={<PublicGallery />} />
      <Route path="/shop/:slug" element={<ShopPublic />} />

      {/* Login */}
      <Route path="/login" element={<LoginScreen />} />

      {/* Rutas App Móvil (Protegidas) */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><AddPlant /></ProtectedRoute>} />
      <Route path="/plants" element={<ProtectedRoute><PlantList /></ProtectedRoute>} />
      <Route path="/plant/:id" element={<ProtectedRoute><PlantDetails /></ProtectedRoute>} />

      {/* BASIC Routes */}
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
      <Route path="/crosses" element={<ProtectedRoute><CrossesScreen /></ProtectedRoute>} />
      <Route path="/seed-bank" element={<ProtectedRoute><SeedBankScreen /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute><BackupScreen /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
      <Route path="/system-status" element={<ProtectedRoute><SystemStatus /></ProtectedRoute>} />

      {/* PRO Routes */}
      <Route path="/ai" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><AIAssistant /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/climate" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="pro"><ClimateScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/calculator" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="pro"><GeneticCalculatorScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/cultivar-gen" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="pro"><CultivarGeneratorScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/shop-manager" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><ShopManager /></PlanRoute>
        </ProtectedRoute>
      } />

      {/* ELITE Routes */}
      <Route path="/inbox" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><InboxScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/chat/:conversationId" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><ChatScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/genealogy/:id" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><GenealogyScreen /></PlanRoute>
        </ProtectedRoute>
      } />
      <Route path="/qr-design" element={
        <ProtectedRoute>
          <PlanRoute requiredPlan="elite"><QRDesignShowcase /></PlanRoute>
        </ProtectedRoute>
      } />

      {/* Ruta Admin Móvil (Legacy/Rápido) */}
      <Route path="/admin-keys" element={<ProtectedRoute><AdminKeys /></ProtectedRoute>} />

      {/* Rutas Admin Web (Escritorio) - MOVED TO TOP LEVEL */}
      {/* <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> */}
      {/* <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} /> */}

      {/* RUTA DE DISEÑO (SOLO LOCAL) */}
      <Route path="/design" element={<DesignConcept />} />
      <Route path="/discovery" element={<DiscoveryPrototype />} />
    </Routes>
  );
};

import { DynamicBackground } from './components/DynamicBackground';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <BroadcastProvider>
            <AppContent />
          </BroadcastProvider>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#12122e] flex flex-col items-center justify-center p-6 font-sans">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CarniBotIcon className="w-10 h-10 text-teal-400 opacity-60 animate-pulse" />
          </div>
        </div>
        <p className="text-teal-400/40 text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Initializing Lab</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <BroadcastBanner />
      <NotificationContainer />
      <ErrorToastContainer />

      {/* Custom Dynamic Background Texture */}
      <DynamicBackground />

      {/* Theme-specific animated particles */}
      <ThemeParticles />

      {/* Theme-specific decorations (webs, lights, etc) */}
      <ThemeDecorations />

      <div className="min-h-screen w-full bg-transparent text-slate-100 font-sans selection:bg-teal-500/30 selection:text-white">
        <Routes>
          {/* Admin Routes - Standalone Layout */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/keys" element={<AdminRoute><AdminKeys /></AdminRoute>} />
          <Route path="/admin/prices" element={<AdminRoute><AdminPrices /></AdminRoute>} />
          <Route path="/admin/theme" element={<AdminRoute><AdminThemeScreen /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

          {/* Main App Routes - Wrapped in DesktopLayout */}
          <Route path="/*" element={
            <DesktopLayout>
              <AppRoutes />
            </DesktopLayout>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;