import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
    LayoutDashboard, Sprout, NotebookPen, Network, FlaskConical,
    Package, Bell, CloudSun, Bot, DatabaseBackup, Settings,
    Search, Menu, X
} from 'lucide-react';

interface DesktopLayoutProps {
    children: React.ReactNode;
}

interface NavItem {
    name: string;
    icon: React.ReactNode;
    path: string;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
    const { currentLogo } = useTheme();
    const { user } = useAuth();
    const { climateLogs } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const items: NavItem[] = [
        { name: 'Inicio', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Plantas', icon: <Sprout size={20} />, path: '/plants' },
        { name: 'Diario de cultivo', icon: <NotebookPen size={20} />, path: '/diary' },
        { name: 'Genética y cruzas', icon: <Network size={20} />, path: '/crosses' },
        { name: 'Gen Lab', icon: <FlaskConical size={20} />, path: '/lab' },
        { name: 'Banco de semillas', icon: <Package size={20} />, path: '/seed-bank' },
        { name: 'Alertas', icon: <Bell size={20} />, path: '/alerts' },
        { name: 'Clima', icon: <CloudSun size={20} />, path: '/climate' },
        { name: 'CarniBot', icon: <Bot size={20} />, path: '/ai' },
        { name: 'Backup', icon: <DatabaseBackup size={20} />, path: '/backup' },
        { name: 'Ajustes', icon: <Settings size={20} />, path: '/profile' },
    ];

    const isActive = (path: string) =>
        location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    const go = (path: string) => { navigate(path); setDrawerOpen(false); };

    // Último registro de clima (para el widget de la barra superior)
    const lastClimate = climateLogs[0];

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="flex flex-col items-center px-6 pt-7 pb-5">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden mb-2">
                    <img src={currentLogo} alt="CarniLab" className="w-12 h-12 object-contain" />
                </div>
                <p className="text-[11px] font-black tracking-[0.25em] text-white uppercase">Sarracenia</p>
                <p className="text-[8px] font-bold tracking-[0.4em] text-sidebar-text/60 uppercase">MAR</p>
            </div>

            {/* Navegación */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
                {items.map(item => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => go(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${active
                                ? 'bg-sidebar-active text-white shadow-lg shadow-black/20'
                                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                                }`}
                        >
                            <span className={active ? 'text-white' : 'text-sidebar-text'}>{item.icon}</span>
                            {item.name}
                        </button>
                    );
                })}
            </nav>

            {/* Usuario */}
            <button
                onClick={() => go('/profile')}
                className="m-3 mt-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
                <div className="w-9 h-9 rounded-full bg-sidebar-active/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {user?.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-sm">{user?.label?.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="text-left min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{user?.label}</p>
                    <p className="text-[9px] text-sidebar-text/70 uppercase tracking-wider">Mi colección</p>
                </div>
            </button>
        </>
    );

    return (
        <div className="min-h-screen bg-app-bg text-brand-dark">
            {/* === Sidebar fijo (desktop) === */}
            <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-sidebar z-40">
                <SidebarContent />
            </aside>

            {/* === Drawer (mobile) === */}
            {drawerOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
                    <aside className="relative flex flex-col w-64 max-w-[80%] bg-sidebar animate-in slide-in-from-left duration-200">
                        <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-sidebar-text">
                            <X size={20} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* === Contenido === */}
            <div className="lg:ml-60 flex flex-col min-h-screen">
                {/* Barra superior */}
                <header className="sticky top-0 z-30 bg-topbar/90 backdrop-blur-md border-b border-app-border">
                    <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
                        <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-brand-dark/70 p-1">
                            <Menu size={22} />
                        </button>

                        {/* Buscador */}
                        <div className="flex-1 max-w-md relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                            <input
                                type="text"
                                placeholder="Buscar en tu colección…"
                                className="w-full bg-app-bg/60 border border-app-border rounded-full pl-9 pr-4 py-2 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>

                        <div className="flex-1" />

                        {/* Widget de clima */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-bg/60 border border-app-border">
                            <CloudSun size={16} className="text-brand-secondary" />
                            <span className="text-[12px] font-bold text-brand-dark">
                                {lastClimate ? `${Math.round(lastClimate.temp_max)}°C` : '—'}
                            </span>
                            {lastClimate && (
                                <span className="text-[11px] text-brand-dark/50">{lastClimate.humidity}%</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Pantalla */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};
