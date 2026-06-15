import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AssetIcon } from './AssetIcon';
import { Settings, Search, Menu, X, Bell, ChevronDown, CloudSun } from 'lucide-react';

interface DesktopLayoutProps {
    children: React.ReactNode;
}

interface NavItem {
    name: string;
    icon: string;        // AssetIcon name
    lucide?: React.ReactNode;
    path: string;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
    const { currentLogo } = useTheme();
    const { user } = useAuth();
    const { climateLogs, alerts } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const items: NavItem[] = [
        { name: 'Inicio', icon: 'icon-home', path: '/dashboard' },
        { name: 'Plantas', icon: 'icon-plants', path: '/plants' },
        { name: 'Diario de cultivo', icon: 'icon-diary', path: '/diary' },
        { name: 'Genética y cruces', icon: 'icon-crosses', path: '/crosses' },
        { name: 'Gen Lab', icon: 'icon-genlab', path: '/lab' },
        { name: 'Banco de semillas', icon: 'icon-bank-seed', path: '/seed-bank' },
        { name: 'Alertas', icon: 'icon-alerts', path: '/alerts' },
        { name: 'Clima', icon: 'icon-climate', path: '/climate' },
        { name: 'CarniBot', icon: 'icon-bot', path: '/ai' },
        { name: 'Backup', icon: 'icon-backup', path: '/backup' },
        { name: 'Ajustes', icon: '', lucide: <Settings size={20} className="text-[#C9A24B]" />, path: '/profile' },
    ];

    const isActive = (path: string) =>
        location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    const go = (path: string) => { navigate(path); setDrawerOpen(false); };

    const alertasPend = alerts.filter(a => !a.completada).length;
    const lastClimate = climateLogs[0];

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="flex flex-col items-center px-6 pt-7 pb-6">
                <img src={currentLogo} alt="Sarracenia MAR" className="w-[88px] h-[88px] object-contain mb-1" />
                <p className="text-[17px] font-accent font-bold tracking-[0.18em] text-[#F2EDD8]">SARRACENIA</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="h-px w-5 bg-[#C9A24B]/50" />
                    <p className="text-[9px] font-bold tracking-[0.35em] text-[#C9A24B]">M.A.R</p>
                    <span className="h-px w-5 bg-[#C9A24B]/50" />
                </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                {items.map(item => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => go(item.path)}
                            className={`relative w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 ${active
                                ? 'bg-sidebar-active text-white'
                                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                                }`}
                        >
                            {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-[#C9A24B]" />}
                            {item.icon
                                ? <AssetIcon name={item.icon} size={20} className={active ? '' : 'opacity-90'} />
                                : item.lucide}
                            <span className="flex-1 text-left">{item.name}</span>
                            {item.path === '/alerts' && alertasPend > 0 && (
                                <span className="text-[10px] font-black bg-brand-accent text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                                    {alertasPend}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Usuario */}
            <button
                onClick={() => go('/profile')}
                className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
                <div className="w-9 h-9 rounded-full bg-sidebar-active/40 border border-[#C9A24B]/30 overflow-hidden flex items-center justify-center shrink-0">
                    {user?.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-sm">{user?.label?.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="text-left min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-white truncate">{user?.label}</p>
                    <p className="text-[9.5px] text-sidebar-text/70">Coleccionista</p>
                </div>
                <ChevronDown size={15} className="text-sidebar-text/50" />
            </button>
        </>
    );

    return (
        <div className="min-h-screen bg-app-bg text-brand-dark">
            {/* Sidebar fijo (desktop) */}
            <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-sidebar z-40">
                <SidebarContent />
            </aside>

            {/* Drawer (mobile) */}
            {drawerOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
                    <aside className="relative flex flex-col w-64 max-w-[80%] bg-sidebar animate-in slide-in-from-left duration-200">
                        <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-sidebar-text z-10">
                            <X size={20} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Contenido */}
            <div className="lg:ml-60 flex flex-col min-h-screen">
                {/* Barra superior */}
                <header className="sticky top-0 z-30 bg-topbar/90 backdrop-blur-md border-b border-app-border">
                    <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
                        <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-brand-dark/70 p-1">
                            <Menu size={22} />
                        </button>

                        {/* Buscador */}
                        <div className="flex-1 max-w-sm relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                            <input
                                type="text"
                                placeholder="Buscar en mi cultivo…"
                                className="w-full bg-app-bg/60 border border-app-border rounded-full pl-9 pr-12 py-2 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-dark/30 border border-app-border rounded px-1.5 py-0.5">⌘ K</span>
                        </div>

                        <div className="flex-1" />

                        {/* Clima */}
                        <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-app-card border border-app-border">
                            <CloudSun size={18} className="text-[#E0A83E]" />
                            <div className="leading-tight">
                                <p className="text-[13px] font-black text-brand-dark">{lastClimate ? `${Math.round(lastClimate.temp_max)}°C` : '—'}</p>
                                <p className="text-[9px] text-brand-dark/45">Parcialmente nublado</p>
                            </div>
                            <ChevronDown size={14} className="text-brand-dark/30 ml-1" />
                        </div>

                        {/* Notificaciones */}
                        <button onClick={() => navigate('/alerts')} className="relative w-10 h-10 flex items-center justify-center text-[#C9A24B]">
                            <Bell size={20} />
                            {alertasPend > 0 && (
                                <span className="absolute top-1 right-1 text-[9px] font-black bg-brand-primary text-white rounded-full min-w-[16px] h-[16px] px-0.5 flex items-center justify-center">
                                    {alertasPend}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
};
