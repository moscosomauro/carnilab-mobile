
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from './Icon';



interface DesktopLayoutProps {
    children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { currentLogo } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: t('layout.menu.dashboard'), icon: 'dashboard', path: '/dashboard' },
        { name: t('layout.menu.addPlant'), icon: 'add_circle', path: '/add' },
        { name: t('layout.menu.myPlants'), icon: 'potted_plant', path: '/plants' },
        { name: t('layout.menu.shop'), icon: 'storefront', path: '/shop-manager' },
        { name: t('layout.menu.diary'), icon: 'menu_book', path: '/diary' },
        { name: t('layout.menu.crosses'), icon: 'hub', path: '/crosses' },
        { name: t('layout.menu.messages'), icon: 'mail', path: '/inbox' },
        { name: t('layout.menu.ai'), icon: 'auto_awesome', path: '/ai' },
    ];


    if (!user || !user.isAuthenticated) return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-transparent">
            {/* Sidebar - Only visible on LG screens (PC) */}
            <aside className="hidden lg:flex flex-col w-72 border-r border-white/10 fixed h-screen z-50 overflow-y-auto transition-colors duration-500" style={{ backgroundColor: 'var(--color-brand-secondary)' }}>
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shadow-sm border border-white/10 overflow-hidden backdrop-blur-sm">
                            <img src={currentLogo} alt="CarniLab Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">CarniLab</h1>
                            <p className="text-[10px] font-bold text-[#F2EDD8] uppercase tracking-[0.2em]">{t('layout.slogan')}</p>
                        </div>
                    </div>


                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon
                                        name={item.icon}
                                        className={`text-4xl ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`}
                                    />
                                    <span className="font-bold text-sm">{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/10">
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 flex items-center gap-3 border border-white/5">
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm overflow-hidden bg-white/10 flex items-center justify-center">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="person" className="text-white/50" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate uppercase">{user.label}</p>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                <p className="text-[9px] font-bold text-[#F2EDD8] uppercase opacity-60 tracking-wider">
                                    {t('layout.plan')} {user.plan}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
                        >
                            <Icon name="settings" className="text-xl" />
                        </button>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[#EF4444] font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <Icon name="logout" className="text-xl" />
                        {t('layout.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 min-h-screen relative">
                {children}
            </main>
        </div>
    );
};
