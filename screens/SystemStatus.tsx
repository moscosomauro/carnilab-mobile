import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '../components/usePushNotifications';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';

const SystemStatus: React.FC = () => {
    const navigate = useNavigate();
    const { permissionStatus, isSubscribed, subscribeToPush, unsubscribeFromPush, sendTestNotification, sendLocalNotification, loading } = usePushNotifications();
    const { offlineMode, pendingQueueLength, syncPendingActions } = useApp();

    const [storageUsage, setStorageUsage] = useState<number | null>(null);
    const [storageQuota, setStorageQuota] = useState<number | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Check if PWA is installed (Standalone mode)
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

        // Check Storage Quota
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                if (estimate.usage) setStorageUsage(estimate.usage);
                if (estimate.quota) setStorageQuota(estimate.quota);
            });
        }
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const decimals = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB] dark:bg-slate-900 flex justify-center selection:bg-[#6B8E23]/10 font-display transition-colors">
            <div className="relative z-10 w-full max-w-[390px] lg:max-w-4xl px-6 pt-10 pb-32 flex flex-col items-center">
                
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform text-[#4A5D4F] dark:text-slate-300">
                        <Icon name="arrow_back" />
                    </button>
                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                        <h1 className="text-[22px] font-bold text-[#2E2E2E] dark:text-white leading-tight tracking-tight">Estado del Sistema</h1>
                    </div>
                    <div className="w-10"></div>
                </div>

                <div className="w-full space-y-4">
                    
                    {/* Push Notifications Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-white dark:border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${permissionStatus === 'granted' ? 'bg-[#CDE8B5]/50 text-[#4A5D4F]' : permissionStatus === 'denied' ? 'bg-red-100/50 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                <Icon name="notifications_active" />
                            </div>
                            <div>
                                <h3 className="font-black text-[#2E2E2E] dark:text-white text-[16px]">Notificaciones Push</h3>
                                <div className="text-[12px] font-bold text-[#8E877F] dark:text-slate-400">
                                    Estado: <span className={permissionStatus === 'granted' ? 'text-green-500' : 'text-orange-400'}>{permissionStatus === 'granted' ? 'Permitido' : permissionStatus === 'denied' ? 'Bloqueado' : 'Pedir Permiso'}</span>
                                </div>
                            </div>
                        </div>

                        {isIOS && !isStandalone && (
                            <div className="mb-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 p-4 rounded-2xl text-[12px] text-orange-800 dark:text-orange-300 font-bold">
                                <p className="mb-2">⚠️ <strong>Estás usando iOS Safari:</strong> Para recibir notificaciones, primero debes instalar la app en tu pantalla de inicio.</p>
                                <ol className="list-decimal list-inside opacity-90 space-y-1 ml-1">
                                    <li>Pulsa el botón <strong>Compartir</strong> <Icon name="ios_share" className="text-[14px] inline align-text-bottom" /> abajo.</li>
                                    <li>Selecciona <strong>"Agregar a inicio"</strong>.</li>
                                    <li>Abre la app desde tu inicio.</li>
                                </ol>
                            </div>
                        )}

                        <div className="flex gap-2 mb-2">
                             <button
                                onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                                disabled={loading || (isIOS && !isStandalone) || permissionStatus === 'denied'}
                                className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors ${
                                    isSubscribed ? 'bg-[#FF7A59]/10 text-[#FF7A59] hover:bg-[#FF7A59]/20' : 
                                    'bg-[#4A5D4F] text-white hover:bg-[#4A5D4F]/90 disabled:opacity-50'
                                }`}
                            >
                                {loading ? '...' : isSubscribed ? 'Desactivar Push' : 'Activar Push'}
                            </button>
                        </div>
                        {isSubscribed && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => sendLocalNotification()}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    Test Local
                                </button>
                                <button
                                    onClick={() => sendTestNotification()}
                                    disabled={loading}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    Test Servidor
                                </button>
                            </div>
                        )}
                        {permissionStatus === 'denied' && (
                             <p className="mt-3 text-[10px] text-slate-400 font-bold text-center">Debes habilitar las notificaciones desde la configuración de tu navegador/dispositivo.</p>
                        )}
                    </div>

                    {/* Sincronización y Offline */}
                    <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-white dark:border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${offlineMode ? 'bg-[#FF7A59]/10 text-[#FF7A59]' : 'bg-[#CDE8B5]/50 text-[#4A5D4F]'}`}>
                                <Icon name={offlineMode ? "cloud_off" : "cloud_done"} />
                            </div>
                            <div>
                                <h3 className="font-black text-[#2E2E2E] dark:text-white text-[16px]">Red & Sincronización</h3>
                                <div className="text-[12px] font-bold text-[#8E877F] dark:text-slate-400">
                                    Modo: <span className={offlineMode ? 'text-[#FF7A59]' : 'text-[#4A5D4F]'}>{offlineMode ? 'Offline Activo' : 'Online En Vivo'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-3">
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-300">Datos pendientes por subir:</span>
                            <span className={`font-black text-[14px] ${pendingQueueLength > 0 ? 'text-[#FF7A59]' : 'text-slate-400'}`}>
                                {pendingQueueLength} items
                            </span>
                        </div>

                        {pendingQueueLength > 0 && (
                            <button
                                onClick={syncPendingActions}
                                disabled={offlineMode}
                                className="w-full py-3 bg-[#4A5D4F] text-white rounded-xl font-black text-[11px] uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Icon name="sync" className="text-[16px]" /> Forzar Sincronización
                            </button>
                        )}
                         {offlineMode && pendingQueueLength > 0 && (
                            <p className="mt-2 text-[10px] text-orange-500 font-bold text-center">Desactiva el Modo Offline para sincronizar tus cambios locales.</p>
                        )}
                    </div>

                    {/* Almacenamiento Local */}
                    <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-white dark:border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                                <Icon name="storage" />
                            </div>
                            <div>
                                <h3 className="font-black text-[#2E2E2E] dark:text-white text-[16px]">Caché y Almacenamiento</h3>
                                <div className="text-[12px] font-bold text-[#8E877F] dark:text-slate-400">
                                    Datos locales (Imágenes, Base de Datos offline)
                                </div>
                            </div>
                        </div>

                        {storageUsage !== null && storageQuota !== null ? (
                            <div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    <span>{formatBytes(storageUsage)} usados</span>
                                    <span>{formatBytes(storageQuota)} disponibles</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${Math.min((storageUsage / storageQuota) * 100, 100)}%` }}
                                     />
                                </div>
                            </div>
                        ) : (
                            <div className="text-[11px] font-bold text-slate-400 text-center">Calculando almacenamiento...</div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button className="w-full py-2 flex items-center justify-center gap-2 text-red-400 text-[11px] font-black uppercase hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                                onClick={() => {
                                    if(window.confirm('¿Borrar caché local? Cerrarás sesión y se perderán los datos en la cola de sincronización offline.')) {
                                        localStorage.clear();
                                        window.location.href = '/';
                                    }
                                }}
                            >
                                Borrar Datos y Caché Local
                            </button>
                        </div>
                    </div>

                </div>

                <div className="mt-12 text-center pb-8 opacity-50">
                    <Icon name="verified_user" className="text-[#8E877F] mb-1" />
                    <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-widest">CarniLab Mobile System v1.2.0</p>
                    <p className="text-[9px] font-bold text-[#8E877F] uppercase tracking-wider mt-1">Status: OK</p>
                </div>
            </div>
        </div>
    );
};

export default SystemStatus;
