
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { hasAccess } from "../utils/planHelpers";
import { PlanComparison } from "../components/PlanComparison";
import { Icon } from "../components/Icon";
import { Pencil } from "lucide-react";

// ---------- UI helpers ----------

// Asset Icon Helper
import { AssetIcon } from "../components/AssetIcon";
import { SmartDashboardWidget } from "../components/SmartDashboardWidget";


type MenuItem = {
  title: string;
  icon: React.ReactNode;
  bg: string;
  path: string;
  plan: "basic" | "pro" | "elite";
  badge?: number;
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { plants, alerts, crosses, inbox } = useApp();
  const { user, logout, updateUserLabel, subscribeToPush } = useAuth();
  const { currentLogo } = useTheme();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState(user?.label || "");
  const [showPlans, setShowPlans] = useState(false);


  // Get additional data for badges
  useEffect(() => {
    // Attempt to subscribe to push notifications automatically
    if (user) {
      subscribeToPush().catch(err => console.error("Push subscribe failed", err));
    }
  }, [user, subscribeToPush]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const pendingAlerts = alerts.filter((a) => !a.completada).length;
  const unreadMessagesCount = inbox.filter((m) => !m.is_read).length;

  const menuItems: MenuItem[] = useMemo(() => [

    { title: t('dashboard.menu.globalNetwork'), icon: <AssetIcon name="icon-vivero" size={48} />, bg: "var(--color-brand-primary)", path: "/discovery", plan: "basic" as const },
    { title: t('dashboard.menu.myNursery'), icon: <AssetIcon name="icon-vivero" size={48} />, bg: "var(--color-brand-primary)", path: `/vivero/${user?.slug || 'demo'}`, plan: "basic" },
    { title: t('dashboard.menu.shopBeta'), icon: <AssetIcon name="icon-shop" size={48} />, bg: "var(--color-brand-secondary)", path: "/shop-manager", plan: "elite" },
    { title: t('layout.menu.messages'), icon: <AssetIcon name="icon-mensajes" size={48} />, bg: "var(--color-brand-accent)", path: "/inbox", plan: "elite", badge: unreadMessagesCount },
    { title: "CarniBot", icon: <AssetIcon name="icon-bot" size={48} />, bg: "var(--color-brand-accent)", path: "/ai", plan: "elite" },
    { title: t('layout.menu.addPlant'), icon: <AssetIcon name="icon-add" size={48} />, bg: "var(--color-brand-primary)", path: "/add", plan: "basic" },
    { title: t('layout.menu.myPlants'), icon: <AssetIcon name="icon-plants" size={48} />, bg: "var(--color-brand-primary)", path: "/plants", plan: "basic" },
    { title: t('layout.menu.diary'), icon: <AssetIcon name="icon-diary" size={48} />, bg: "var(--color-brand-secondary)", path: "/diary", plan: "basic" },
    { title: t('layout.menu.crosses'), icon: <AssetIcon name="icon-crosses" size={48} />, bg: "var(--color-brand-secondary)", path: "/crosses", plan: "basic" },
    { title: "Banco Semillas", icon: <AssetIcon name="icon-bank-seed" size={48} />, bg: "var(--color-brand-primary)", path: "/seed-bank", plan: "basic" },
    { title: t('dashboard.menu.climate'), icon: <AssetIcon name="icon-climate" size={48} />, bg: "var(--color-brand-accent)", path: "/climate", plan: "pro" },
    { title: t('dashboard.menu.alerts'), icon: <AssetIcon name="icon-alerts" size={48} />, bg: "var(--color-brand-accent)", path: "/alerts", plan: "basic", badge: pendingAlerts },
    { title: t('dashboard.menu.backup'), icon: <AssetIcon name="icon-backup" size={48} />, bg: "var(--color-brand-secondary)", path: "/backup", plan: "basic" },
    { title: t('dashboard.menu.calculator'), icon: <AssetIcon name="icon-genlab" size={48} />, bg: "var(--color-brand-accent)", path: "/lab", plan: "pro" },
    ...(user?.isAdmin ? [{
      title: t('dashboard.menu.priceControl'),
      icon: <Icon name="payments" className="text-2xl text-emerald-800" />,
      bg: "var(--color-brand-primary)", // Green to match administrative/safe
      path: "/admin/prices",
      plan: "basic" as const // Plan type hack since admins bypass anyway
    }] : []),
  ], [unreadMessagesCount, pendingAlerts, user, t]);

  const handleNavigation = (path: string, plan: string) => {
    if (hasAccess(user?.plan, plan as any)) {
      navigate(path);
    } else {
      setShowPlans(true);
    }
  };

  const handleSaveProfileName = async () => {
    if (!newProfileName.trim()) return;
    const success = await updateUserLabel(newProfileName);
    if (success) setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex justify-center font-sans lg:bg-transparent">
      {/* Paper texture */}

      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-6 pb-28 lg:pb-10">

        {/* DATE & CONNECTION STATUS */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-[#8E877F] font-medium capitalize">
            {new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          {/* Connection Status Icon */}
          <div className={`transition-opacity duration-300 ${isOnline ? 'text-[#6B8E23]' : 'text-[#FF4D4D]'}`}>
            {isOnline ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.61 7.21l-2.08-2.09a2 2 0 0 0-2.83 0L4.79 17.9a2 2 0 0 0 0 2.83l2.08 2.09a2 2 0 0 0 2.83 0L22.61 10.04a2 2 0 0 0 0-2.83z"></path>
                <line x1="2" y1="2" x2="22" y2="22"></line>
              </svg>
            )}
          </div>
        </div>

        {/* LOGO */}
        <div className="flex flex-col items-center justify-center gap-1 mb-8">
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-lg shadow-black/5 mb-3 border border-gray-50 overflow-hidden">
            <img src={currentLogo} alt="CarniLab Logo" className="w-20 h-20 object-contain scale-110" />
          </div>
          <h1 className="text-3xl font-bold text-brand-dark tracking-tight">
            CarniLab
          </h1>
          <p className="text-xs font-bold text-brand-accent uppercase tracking-[0.2em]">
            {t('dashboard.slogan')}
          </p>
        </div>

        {/* PROFILE CARD */}
        <div
          className="bg-brand-surface/90 backdrop-blur-xl shadow-soft
                             border border-brand-light/20 flex items-center gap-4 px-4 py-3 mb-8 lg:px-8 lg:py-6 rounded-blob"
        >
          <div className="w-20 h-20 rounded-full border-4 border-brand-surface shadow-md overflow-hidden bg-brand-bg/50 flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            ) : (
              <span className="text-2xl font-black text-brand-dark/40">{user?.label?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-bold text-brand-dark">
                {user?.label || "Mauro"}
              </h2>
              <button onClick={() => setIsEditingProfile(true)} className="opacity-60 hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-brand-dark" />
              </button>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-brand-dark/60 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="text-brand-accent opacity-60">🌿</span>
              <span>{t('dashboard.ownerTitle')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4 lg:grid-cols-8 lg:mb-8">
          <button onClick={() => handleNavigation('/lab', 'pro')} className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl bg-brand-surface flex items-center justify-center shadow-sm border border-brand-light/15 overflow-hidden relative">
              <AssetIcon name="icon-genlab" size={80} className="lg:scale-125" />
              {!hasAccess(user?.plan, 'pro') && (
                <div className="absolute inset-0 bg-brand-surface/60 flex items-center justify-center">
                  <Icon name="lock" className="text-brand-dark/50" />
                </div>
              )}
            </div>
            <span className="text-[10px] lg:text-xs font-bold text-brand-dark/80 leading-tight text-center">{t('dashboard.genLab')}</span>
          </button>

          <button onClick={() => handleNavigation('/qr-design', 'elite')} className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl bg-brand-surface flex items-center justify-center shadow-sm border border-brand-light/15 overflow-hidden relative">
              <AssetIcon name="icon-scanner" size={80} className="lg:scale-125" />
              {!hasAccess(user?.plan, 'elite') && (
                <div className="absolute inset-0 bg-brand-surface/60 flex items-center justify-center">
                  <Icon name="lock" className="text-brand-dark/50" />
                </div>
              )}
            </div>
            <span className="text-[10px] lg:text-xs font-bold text-brand-dark/80 leading-tight text-center">{t('dashboard.scanner')}</span>
          </button>
        </div>

        {/* STATS */}
        <div className="flex gap-3 mb-8">
          {[
            { t: "Plants", v: plants.length, s: t('dashboard.stats.plants'), bg: "var(--color-brand-primary)", tx: "text-white" },
            { t: "Cruzas", v: crosses.length, s: t('dashboard.stats.crosses'), bg: "var(--color-brand-secondary)", tx: "text-white" },
            { t: "Alerts", v: pendingAlerts, s: t('dashboard.stats.alerts'), bg: "var(--color-brand-accent)", tx: "text-white" },
          ].map((c, i) => (
            <div
              key={i}
              className="flex-1 text-center py-6 shadow-md border border-white/20 rounded-[36px]"
              style={{
                background: c.bg,
              }}
            >
              <div className={`text-[9px] uppercase tracking-[0.25em] font-black opacity-50 ${c.tx}`}>
                {c.t}
              </div>
              <div className={`text-2xl font-black mt-1 ${c.tx}`}>{c.v}</div>
              <div className={`text-[10px] font-semibold opacity-70 ${c.tx}`}>
                {c.s}
              </div>
            </div>
          ))}
        </div>



        <SmartDashboardWidget seedBank={useApp().seedBank} crosses={crosses} plants={plants} />

        {/* MENU */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
          {menuItems.map((m, i) => (
            <button
              key={i}
              onClick={() => handleNavigation(m.path, m.plan)}
              className="h-14 flex items-center px-2 shadow-md border border-white/40
                                     active:scale-[0.985] transition-transform relative group rounded-full"
              style={{
                background: m.bg,
              }}
            >
              <div className={`flex items-center justify-center ml-2 ${['var(--color-brand-primary)', 'var(--color-brand-secondary)'].includes(m.bg) ? 'text-[var(--color-brand-text-on-primary)]' : 'text-[var(--color-brand-dark)]'}`}>
                {m.icon}
              </div>
              <span className={`flex-1 text-left pl-4 font-semibold text-[15px] tracking-wide ${['var(--color-brand-primary)', 'var(--color-brand-secondary)'].includes(m.bg) ? 'text-[var(--color-brand-text-on-primary)]' : 'text-[var(--color-brand-dark)]'}`}>
                {m.title}
              </span>
              <span className={`mr-4 opacity-30 text-lg ${['var(--color-brand-primary)', 'var(--color-brand-secondary)'].includes(m.bg) ? 'text-[var(--color-brand-text-on-primary)]' : ''}`}>›</span>
              {m.badge !== undefined && m.badge > 0 && (
                <div className="absolute -top-1 right-10 bg-[#FF4D4D] text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-lg">
                  {m.badge}
                </div>
              )}
            </button>
          ))}

          {/* LOGOUT */}
          <button
            onClick={() => logout()}
            className="h-14 flex items-center px-2 bg-[#C86A67] text-white
                                   shadow-lg border border-white/20 active:scale-[0.985] transition-transform lg:hidden"
            style={{ borderRadius: "999px" }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ml-1 border border-white/10 shadow-inner">
              <AssetIcon name="icon-logout" size={24} />
            </div>
            <span className="flex-1 text-left pl-4 font-semibold text-[15px] tracking-wide">
              {t('layout.logout')}
            </span>
            <span className="mr-4 opacity-30 text-lg">›</span>
          </button>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-surface/80 backdrop-blur-xl
                            border-t border-brand-light/20 px-10 py-5 flex justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] lg:hidden">
        {[
          { l: t('dashboard.bottomNav.home'), ic: <AssetIcon name="icon-home" size={24} />, act: true, path: "/dashboard" },
          { l: t('dashboard.bottomNav.map'), ic: <AssetIcon name="icon-vivero" size={24} />, act: false, path: "/discovery" },
          { l: t('dashboard.bottomNav.messages'), ic: <AssetIcon name="icon-mensajes" size={24} />, act: false, path: "/inbox" },
          { l: t('dashboard.bottomNav.profile'), ic: <AssetIcon name="icon-profile" size={24} />, act: false, path: "/profile" },
        ].map((t, i) => (
          <div
            key={i}
            onClick={() => navigate(t.path)}
            className={`flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform
                        ${t.act ? "text-brand-primary" : "text-brand-light/50"}`}
          >
            <div className={`flex items-center justify-center scale-110 ${!t.act ? "opacity-40" : ""}`}>
              {t.ic}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.l}</span>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showPlans && user && (
        <PlanComparison currentPlan={user.plan} onClose={() => setShowPlans(false)} />
      )}


      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-brand-surface rounded-modal p-7 w-full max-w-xs shadow-float border border-brand-light/20 translate-y-[-20px]">
            <h3 className="text-xl font-bold text-brand-dark mb-4">{t('dashboard.editProfile.title')}</h3>
            <input
              autoFocus
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="w-full bg-brand-bg/50 border border-brand-light/30 rounded-2xl p-4 text-brand-dark mb-6 font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-3 text-brand-dark/60 font-bold rounded-xl hover:bg-black/5 transition-colors"
              >
                {t('dashboard.editProfile.cancel')}
              </button>
              <button
                onClick={handleSaveProfileName}
                className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:brightness-[1.03] transition"
              >
                {t('dashboard.editProfile.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
