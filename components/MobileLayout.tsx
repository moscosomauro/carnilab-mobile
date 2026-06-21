import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Home, NotebookPen, Leaf, Sprout, Bot, Bell, Dna } from 'lucide-react';

const TABS = [
  { name: 'Inicio', icon: Home, path: '/dashboard' },
  { name: 'Bitácora', icon: NotebookPen, path: '/diary' },
  { name: 'Plantas', icon: Leaf, path: '/plants' },
  { name: 'Cruzas', icon: Dna, path: '/crosses' },
  { name: 'Semillas', icon: Sprout, path: '/seed-bank' },
  { name: 'CarniBot', icon: Bot, path: '/ai' },
];

export const MobileHeader: React.FC<{
  title: string; subtitle?: string; right?: React.ReactNode; back?: boolean;
}> = ({ title, subtitle, right, back }) => {
  const navigate = useNavigate();
  const { currentLogo } = useTheme();
  const { alerts } = useApp();
  const pend = alerts.filter(a => !a.completada).length;
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
      {back ? (
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-app-card border border-app-border flex items-center justify-center text-brand-dark/60 shrink-0">‹</button>
      ) : (
        <img src={currentLogo} alt="" className="w-10 h-10 object-contain shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-accent text-[24px] font-bold text-brand-dark leading-none truncate">{title}</h1>
        {subtitle && <p className="text-[12px] text-brand-dark/50 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right ?? (
        <button onClick={() => navigate('/alerts')} className="relative w-10 h-10 flex items-center justify-center text-[#C9A24B] shrink-0">
          <Bell size={20} />
          {pend > 0 && <span className="absolute top-1 right-1 text-[9px] font-black bg-brand-primary text-white rounded-full min-w-[16px] h-[16px] px-0.5 flex items-center justify-center">{pend}</span>}
        </button>
      )}
    </div>
  );
};

export const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-app-bg text-brand-dark flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      {/* Barra inferior */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-app-card/95 backdrop-blur-md border-t border-app-border flex items-stretch px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(tab => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${active ? 'text-brand-primary' : 'text-brand-dark/40'}`}>
              <span className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${active ? 'bg-brand-primary/10' : ''}`}><Icon size={20} /></span>
              <span className="text-[10px] font-semibold">{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
