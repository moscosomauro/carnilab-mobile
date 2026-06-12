
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/imageHelpers';
import { Icon } from '../components/Icon';
import { AssetIcon } from '../components/AssetIcon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen: React.FC = () => {
    const { t, i18n } = useTranslation('profile');
    const navigate = useNavigate();
    const { user, updateUserAvatar } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);
            const localUrl = await uploadImage(file, user.uid);
            if (localUrl) {
                await updateUserAvatar(localUrl);
            } else {
                alert("Error al procesar la imagen. Intenta nuevamente.");
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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

                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 bg-[#4A5D4F] text-white shadow-lg shadow-[#4A5D4F]/20">
                        App Personal · 100% Local
                    </span>
                </div>

                {/* Settings List */}
                <div className="w-full space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
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

                    {/* Backup */}
                    <button
                        onClick={() => navigate('/backup')}
                        className="bg-white rounded-[24px] dark:bg-slate-800 p-4 flex items-center gap-4 shadow-sm border border-white dark:border-slate-700 active:scale-95 transition-transform cursor-pointer h-fit"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#4A5D4F]">
                            <Icon name="cloud_download" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-[#2E2E2E] dark:text-white text-sm">Backup</h3>
                            <p className="text-[10px] text-[#8E877F] dark:text-slate-400 font-bold">Exportar / Importar mis datos</p>
                        </div>
                    </button>

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
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-[#8E877F] opacity-50 uppercase tracking-widest">CarniLab Local v2.0.0</p>
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
                        onClick={() => navigate('/diary')}
                        className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all"
                    >
                        <AssetIcon name="icon-diary" size={24} className="opacity-40" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Diario</span>
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
        </div >
    );
};

export default ProfileScreen;
