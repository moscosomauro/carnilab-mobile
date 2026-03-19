
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../components/usePushNotifications';
import { uploadImage } from '../utils/imageHelpers';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icon';
import { AssetIcon } from '../components/AssetIcon';

// ICONS
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen: React.FC = () => {
    const { t, i18n } = useTranslation('profile');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, logout, updateUserAvatar, updateUserPlan } = useAuth();
    const { isSubscribed, loading, permissionStatus, subscribeToPush, unsubscribeFromPush, sendTestNotification, sendLocalNotification } = usePushNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    const [showPlanModal, setShowPlanModal] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();

    // NEW ALGORITHMIC PRICING & ANNUAL BILLING
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        // Fetch dynamic pricing
        const fetchPlans = async () => {
            const { data } = await supabase.from('plans').select('*');
            if (data) setPlans(data);
        };
        fetchPlans();
    }, []);

    const getPrice = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return { monthly: 0, annual: 0, display: 0 };
        return {
            monthly: plan.price_monthly,
            annual: plan.price_annual,
            display: billingCycle === 'monthly' ? plan.price_monthly : Math.floor(plan.price_annual / 12) // Show equivalent monthly price for comparison? Or total annual? Usually Total Annual or /mo billed annually. Let's show Total Annual for clarity on payment.
        };
    };

    // Detectar retorno de Mercado Pago
    useEffect(() => {
        const payment = searchParams.get('payment');
        const plan = searchParams.get('plan');

        if (payment === 'success') {
            alert(`¡Pago exitoso! Tu cuenta está siendo actualizada al plan ${plan?.toUpperCase()}. Reinicia la app si no ves los cambios.`);
            // Limpiar URL params (manteniendo el hash)
            window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
        } else if (payment === 'failure') {
            alert('El pago no pudo completarse. Intenta nuevamente o contacta a soporte.');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
        }
    }, [searchParams]);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);
            // 1. Subir imagen
            const publicUrl = await uploadImage(file, user.uid);

            if (publicUrl) {
                // 2. Actualizar avatar en contexto y DB
                await updateUserAvatar(publicUrl);
            } else {
                alert("Error al subir la imagen. Intenta nuevamente.");
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error detallado: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
            // Limpiar input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpgrade = async (planId: 'pro' | 'elite') => {
        if (!user) return;

        try {
            setIsPaymentLoading(true);
            const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
                body: {
                    plan_id: billingCycle === 'annual' ? `${planId}-annual` : planId,
                    user_id: user.uid,
                    user_email: user.email
                }
            });

            if (error) throw error;
            if (data?.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("No se recibió el punto de inicio de Mercado Pago");
            }
        } catch (error: any) {

            console.error(error);
            alert(`Error al iniciar el pago: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsPaymentLoading(false);
            setShowPlanModal(false);
        }
    };

    const handleDowngradeToBasic = async () => {
        if (!user) return;
        const confirm = window.confirm("¿Estás seguro de que quieres volver al Plan Básico? Perderás acceso a las funciones avanzadas y el límite de 50 plantas volverá a aplicar.");

        if (confirm) {
            try {
                setIsPaymentLoading(true);
                const success = await updateUserPlan('basic');
                if (success) {
                    alert("Tu plan ha sido cambiado a Básico con éxito.");
                } else {
                    alert("Error al cambiar de plan. Por favor contacta a soporte.");
                }
            } catch (error) {
                console.error(error);
                alert("Error técnico al procesar el cambio.");
            } finally {
                setIsPaymentLoading(false);
                setShowPlanModal(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB] flex justify-center selection:bg-[#6B8E23]/10 font-display lg:bg-transparent">
            {/* Texture */}
            <div className="fixed inset-0 opacity-20 pointer-events-none lg:hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

            <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-10 pb-32 lg:pb-10 flex flex-col items-center">

                {/* Header */}
                <div className="w-full flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform text-[#4A5D4F]">
                        <Icon name="arrow_back" />
                    </button>
                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                        <h1 className="text-[22px] font-bold text-[#2E2E2E] leading-tight tracking-tight">Perfil</h1>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Hero Profile Card */}
                <div className="w-full bg-white rounded-card p-6 shadow-sm border border-white mb-6 flex flex-col items-center relative overflow-hidden">
                    {/* Background Blob */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-[#EFEBE4]" />

                    {/* Avatar */}
                    <div className="relative z-10 -mt-2 mb-3 group">
                        <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#F5F1EB] flex items-center justify-center relative">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-[#8E877F] opacity-50">{user?.label?.charAt(0).toUpperCase()}</span>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-[#4A5D4F] rounded-full text-white flex items-center justify-center border-2 border-white shadow-md active:scale-90 transition-transform"
                        >
                            <Icon name="photo_camera" className="text-base" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                    </div>


                    <h2 className="text-xl font-black text-[#2E2E2E] mb-1 text-center">{user?.label}</h2>
                    <p className="text-xs font-bold text-[#8E877F] mb-4 text-center">{user?.email}</p>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4
                        ${user?.plan === 'elite' ? 'bg-[#4A5D4F] text-white shadow-lg shadow-[#4A5D4F]/20' :
                            user?.plan === 'pro' ? 'bg-[#8E877F] text-white' :
                                'bg-[#CDE8B5] text-[#4A5D4F]'}`}>
                        Plan {user?.plan}
                    </span>

                    {/* MANAGE PLAN BUTTON */}
                    <button
                        onClick={() => setShowPlanModal(true)}
                        className="w-full mt-2 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">💳</span> {t('managePlan')}
                    </button>
                </div>

                {/* Settings List */}
                <div className="w-full space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                    {/* Licencia */}
                    <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-white h-fit">
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#4A5D4F]">
                            <Icon name="vpn_key" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-[#2E2E2E] text-sm">{t('activeLicense')}</h3>
                            <p className="text-[10px] font-mono text-[#8E877F] truncate">{user?.key}</p>
                        </div>
                    </div>

                    {/* Selector de Idioma */}
                    <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-white h-fit">
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#4A5D4F]">
                            <Icon name="language" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-[#2E2E2E] text-sm">{t('language')}</h3>
                            <select
                                value={i18n.language}
                                onChange={(e) => i18n.changeLanguage(e.target.value)}
                                className="w-full mt-1 bg-transparent text-[12px] font-bold text-[#8E877F] focus:outline-none cursor-pointer uppercase tracking-wider"
                            >
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="pt">Português</option>
                                <option value="fr">Français</option>
                                <option value="it">Italiano</option>
                            </select>
                        </div>
                    </div>

                    {/* Modo Oscuro */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-white dark:border-slate-700 h-fit">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#4A5D4F] text-white' : 'bg-[#EFEBE4] text-[#4A5D4F]'}`}>
                                    <Icon name={isDarkMode ? "dark_mode" : "light_mode"} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#2E2E2E] dark:text-white text-sm">Tema Visual</h3>
                                    <p className="text-[10px] text-[#8E877F] dark:text-slate-400 font-bold">
                                        {isDarkMode ? 'Oscuro Activado' : 'Claro Activado'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-[#4A5D4F]' : 'bg-[#E1DED9]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notificaciones */}
                    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-white h-fit">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSubscribed ? 'bg-[#CDE8B5] text-[#4A5D4F]' : 'bg-[#EFEBE4] text-[#8E877F]'}`}>
                                    <Icon name={isSubscribed ? "notifications_active" : "notifications"} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#2E2E2E] text-sm">{t('notifications')}</h3>
                                    <p className="text-[10px] text-[#8E877F] font-bold">
                                        {permissionStatus === 'denied' ? t('notificationsBlocked') : (isSubscribed ? t('notificationsActive') : t('notificationsInactive'))}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                                disabled={loading || permissionStatus === 'denied'}
                                className={`w-12 h-7 rounded-full transition-colors relative ${isSubscribed ? 'bg-[#4A5D4F]' : 'bg-[#E1DED9]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isSubscribed ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        {isSubscribed && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => sendLocalNotification()}
                                    className="flex-1 py-2 rounded-xl bg-[#EFEBE4] text-[#4A5D4F] text-[10px] font-black uppercase tracking-wider hover:bg-[#E1DED9]"
                                >
                                    {t('localTest')}
                                </button>
                                <button
                                    onClick={() => sendTestNotification()}
                                    disabled={loading}
                                    className="flex-1 py-2 rounded-xl bg-[#F5F1EB] text-[#4A5D4F] text-[10px] font-black uppercase tracking-wider hover:bg-[#EFEBE4]"
                                >
                                    {t('serverTest')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Estado del Sistema */}
                    <button
                        onClick={() => navigate('/system-status')}
                        className="bg-white rounded-[24px] dark:bg-slate-800 p-4 flex items-center gap-4 shadow-sm border border-white dark:border-slate-700 active:scale-95 transition-transform cursor-pointer h-fit"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#4A5D4F]">
                            <Icon name="info" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-[#2E2E2E] dark:text-white text-sm">Estado del Sistema</h3>
                            <p className="text-[10px] text-[#8E877F] dark:text-slate-400 font-bold">Diagnóstico, Offline y Memoria</p>
                        </div>
                    </button>

                    {/* Vivero Link */}
                    {user?.slug && (
                        <div
                            onClick={() => window.open(`#/vivero/${user.slug}`, '_blank')}
                            className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-white active:scale-95 transition-transform cursor-pointer h-fit"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#FFB59E]/20 flex items-center justify-center text-[#FF7A59] font-black text-xs">
                                ↗
                            </div>
                            <div>
                                <h3 className="font-bold text-[#2E2E2E] text-sm">{t('publicNursery')}</h3>
                                <p className="text-[10px] text-[#8E877F] font-bold">{window.location.origin}/#/vivero/{user.slug}</p>
                            </div>
                        </div>
                    )}

                    {/* Reload App */}
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-white active:scale-95 transition-transform cursor-pointer h-fit"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#4A5D4F]">
                            <Icon name="refresh" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-[#2E2E2E] text-sm">{t('reloadApp')}</h3>
                            <p className="text-[10px] text-[#8E877F] font-bold">{t('reloadProblem')}</p>
                        </div>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full bg-[#FF7A59]/10 rounded-[24px] p-4 flex items-center justify-center gap-2 text-[#FF7A59] font-black text-xs active:scale-90 transition-transform h-fit lg:col-span-2 lg:max-w-xs lg:mx-auto"
                    >
                        <Icon name="logout" /> {t('logout')}
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-[#8E877F] opacity-50 uppercase tracking-widest">CarniLab Mobile v1.2.0</p>
                </div>

                <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-[#F5F1EB] flex justify-around items-center px-10 z-50 lg:hidden">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all"
                    >
                        <AssetIcon name="icon-home" size={24} className="opacity-40" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Home</span>
                    </button>

                    <button
                        onClick={() => navigate('/discovery')}
                        className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all"
                    >
                        <AssetIcon name="icon-vivero" size={24} className="opacity-40" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Mapa</span>
                    </button>

                    <button
                        onClick={() => navigate('/plants')}
                        className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all"
                    >
                        <AssetIcon name="icon-plants" size={24} className="opacity-40" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Plantas</span>
                    </button>

                    <button
                        onClick={() => navigate('/profile')}
                        className="flex flex-col items-center gap-1.5 text-[#4A5D4F] active:scale-95 transition-all relative"
                    >
                        <div className="absolute -top-12 w-1.5 h-1.5 rounded-full bg-[#4A5D4F]" />
                        <AssetIcon name="icon-profile" size={24} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Perfil</span>
                    </button>
                </div>
            </div>

            {/* PLAN MODAL */}
            {showPlanModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />

                    <div className="bg-white w-full max-w-md rounded-modal p-8 relative z-10 shadow-float animate-in fade-in slide-in-from-bottom-8 duration-300">
                        {/* Drag Handle for mobile */}
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 mb-2">{t('planModal.title')}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t('planModal.subtitle')}</p>

                            {/* BILLING TOGGLE */}
                            <div className="bg-slate-100 p-1 rounded-xl inline-flex relative">
                                <div className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-lg shadow-sm transition-all duration-300 ${billingCycle === 'annual' ? 'left-[49%]' : 'left-[1%]'}`} />
                                <button onClick={() => setBillingCycle('monthly')} className={`relative z-10 px-6 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {t('planModal.monthly')}
                                </button>
                                <button onClick={() => setBillingCycle('annual')} className={`relative z-10 px-6 py-2 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${billingCycle === 'annual' ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {t('planModal.annual')} <span className="text-[8px] bg-[#6B8E23] text-white px-1.5 py-0.5 rounded ml-1">-10%</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
                            {/* Basic Card */}
                            <div className={`p-4 rounded-[24px] border-2 transition-all relative
                                ${user?.plan === 'basic' ? 'border-slate-800 bg-slate-50' : 'border-slate-100 opacity-60'}
                            `}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold italic">B</div>
                                        <span className="font-black text-slate-800">{t('planModal.basic')}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-400">{t('planModal.free')}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tight">{t('planModal.basicDesc')}</p>
                                {user?.plan === 'basic' ? (
                                    <div className="w-full py-2 text-center text-slate-400 font-black text-[10px] uppercase border border-slate-200 rounded-xl">{t('planModal.currentPlan')}</div>
                                ) : (
                                    <button
                                        onClick={handleDowngradeToBasic}
                                        className="w-full py-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-400 rounded-xl font-black text-[10px] uppercase transition-colors"
                                    >
                                        {t('planModal.downgradeBasic')}
                                    </button>
                                )}
                            </div>

                            {/* Pro Card */}
                            <div className={`p-5 rounded-[28px] border-2 transition-all relative
                                ${user?.plan === 'pro' ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100'}
                                ${user?.plan !== 'pro' && !isPaymentLoading ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : (user?.plan === 'pro' ? '' : 'opacity-60 pointer-events-none')}
                            `} onClick={() => user?.plan !== 'pro' && !isPaymentLoading && handleUpgrade('pro')}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">P</div>
                                        <span className="font-black text-slate-800">{t('planModal.pro')}</span>
                                    </div>
                                    <div className="text-right">
                                        {billingCycle === 'annual' && <span className="block text-[10px] text-slate-400 line-through decoration-red-400 decoration-2">${(getPrice('pro').monthly * 12).toLocaleString()}</span>}
                                        <span className="text-lg font-black text-teal-600">${billingCycle === 'monthly' ? (getPrice('pro').monthly || 0).toLocaleString() : (getPrice('pro').annual || 0).toLocaleString()}
                                            <span className="text-[10px] text-slate-400">{billingCycle === 'monthly' ? t('planModal.month') : t('planModal.year')}</span>
                                        </span>
                                    </div>
                                </div>
                                <ul className="space-y-1.5 mb-4">
                                    <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.proFeatures.unlimited')}
                                    </li>
                                    <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.proFeatures.nursery')}
                                    </li>
                                    <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.proFeatures.genealogy')}
                                    </li>
                                </ul>
                                {user?.plan === 'pro' ? (
                                    <div className="w-full py-2.5 text-center text-teal-600 font-black text-[10px] uppercase border-2 border-teal-500 rounded-2xl bg-white">{t('planModal.registered')}</div>
                                ) : (
                                    <button disabled={isPaymentLoading} className="w-full py-2.5 bg-teal-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider disabled:opacity-50">
                                        {isPaymentLoading ? t('planModal.processing') : (user?.plan === 'elite' ? t('planModal.upgradePro') : t('planModal.choosePro'))}
                                    </button>
                                )}
                            </div>

                            {/* Elite Card */}
                            <div className={`p-5 rounded-[28px] border-2 transition-all relative shadow-sm
                                ${user?.plan === 'elite' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100'}
                                ${user?.plan !== 'elite' && !isPaymentLoading ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : (user?.plan === 'elite' ? '' : 'opacity-60 pointer-events-none')}
                            `} onClick={() => user?.plan !== 'elite' && !isPaymentLoading && handleUpgrade('elite')}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold font-serif">E</div>
                                        <span className="font-black text-slate-800">{t('planModal.elite')}</span>
                                    </div>
                                    <div className="text-right">
                                        {billingCycle === 'annual' && <span className="block text-[10px] text-slate-400 line-through decoration-red-400 decoration-2">${(getPrice('elite').monthly * 12).toLocaleString()}</span>}
                                        <span className="text-lg font-black text-indigo-600">${billingCycle === 'monthly' ? (getPrice('elite').monthly || 0).toLocaleString() : (getPrice('elite').annual || 0).toLocaleString()}
                                            <span className="text-[10px] text-slate-400">{billingCycle === 'monthly' ? t('planModal.month') : t('planModal.year')}</span>
                                        </span>
                                    </div>
                                </div>
                                <ul className="space-y-1.5 mb-4">
                                    <li className="text-[10px] font-bold text-indigo-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.eliteFeatures.ai')}
                                    </li>
                                    <li className="text-[10px] font-bold text-indigo-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.eliteFeatures.shop')}
                                    </li>
                                    <li className="text-[10px] font-bold text-indigo-500 flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white">✓</span>
                                        {t('planModal.eliteFeatures.tree')}
                                    </li>
                                </ul>
                                {user?.plan === 'elite' ? (
                                    <div className="w-full py-2.5 text-center text-indigo-600 font-black text-[10px] uppercase border-2 border-indigo-500 rounded-2xl bg-white">{t('planModal.registered')}</div>
                                ) : (
                                    <button disabled={isPaymentLoading} className="w-full py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider disabled:opacity-50">
                                        {isPaymentLoading ? t('planModal.processing') : (user?.plan === 'pro' ? t('planModal.upgradeElite') : t('planModal.chooseElite'))}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPlanModal(false)}
                            disabled={isPaymentLoading}
                            className={`w-full text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest py-2 hover:text-slate-600 transition-colors ${isPaymentLoading ? 'opacity-0' : 'opacity-100'}`}
                        >
                            {t('planModal.maybeLater')}
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ProfileScreen;
