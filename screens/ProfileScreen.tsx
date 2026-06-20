import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { uploadImage } from '../utils/imageHelpers';
import { AssetIcon } from '../components/AssetIcon';
import {
  Settings, Camera, Check, Sun, Moon, Palette, Languages, Database,
  Download, Upload, Trash2, Info, Smartphone, RefreshCw, Wifi, ChevronRight,
  Bell, BellOff, BellRing
} from 'lucide-react';
import {
  isElectron, notificationsSupported, notificationPermission,
  requestNotificationPermission, notifyOS
} from '../utils/notifications';
import {
  cloudConfigured, cloudReady, getSpaceId, setSpaceId, generateSpaceId,
  getCloudLastSync, syncCloudNow
} from '../db/syncCloud';
import { Cloud, CloudOff, Copy } from 'lucide-react';

const THEMES: { id: any; label: string; sw: string }[] = [
  { id: 'default', label: 'Default', sw: '#7A1E2C' },
  { id: 'christmas', label: 'Navidad', sw: '#0f7a3d' },
  { id: 'halloween', label: 'Halloween', sw: '#e6731a' },
  { id: 'spring', label: 'Primavera', sw: '#ec4899' },
  { id: 'autumn', label: 'Otoño', sw: '#b8860b' },
  { id: 'winter', label: 'Invierno', sw: '#0284c7' },
];
const LANGS = [['es', 'Español'], ['en', 'English'], ['pt', 'Português'], ['fr', 'Français'], ['it', 'Italiano']];

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, updateUserAvatar, updateUserLabel } = useAuth();
  const { currentTheme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(user?.label || '');
  const [savedName, setSavedName] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(notificationPermission());

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      notifyOS('Notificaciones activadas', 'Te avisaré cuando venza una alerta de tus plantas.', 'notif-test');
    }
  };
  const testNotification = () =>
    notifyOS('CarniLab', 'Esto es una notificación de prueba 🌱', 'notif-test');

  // --- Nube (Supabase) ---
  const [spaceCode, setSpaceCode] = useState(getSpaceId() || '');
  const [cloudMsg, setCloudMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [lastSync, setLastSync] = useState(getCloudLastSync());

  const saveSpace = () => {
    const clean = spaceCode.trim();
    if (!clean) return;
    setSpaceId(clean);
    setSpaceCode(clean);
    setCloudMsg({ ok: true, text: 'Código guardado. Usá el MISMO código en la PC y en el iPhone.' });
  };
  const genSpace = () => {
    const id = generateSpaceId();
    setSpaceCode(id);
    setSpaceId(id);
    setCloudMsg({ ok: true, text: 'Código generado. Copialo y ponelo igual en el iPhone.' });
  };
  const copySpace = () => { if (spaceCode) navigator.clipboard?.writeText(spaceCode); };
  const runCloudSync = async () => {
    setCloudBusy(true); setCloudMsg(null);
    const r = await syncCloudNow();
    setCloudBusy(false);
    setLastSync(getCloudLastSync());
    setCloudMsg(r.ok ? { ok: true, text: 'Sincronizado con la nube.' } : { ok: false, text: r.error || 'Error al sincronizar.' });
  };
  const fmtLast = (t: number) => t ? new Date(t).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca';

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    try { setUploading(true); const url = await uploadImage(f, user.uid); if (url) await updateUserAvatar(url); }
    catch (err: any) { alert('Error: ' + (err.message || err)); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };
  const saveName = async () => { await updateUserLabel(name.trim() || 'Coleccionista'); setSavedName(true); setTimeout(() => setSavedName(false), 1500); };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onPhoto} />
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><Settings size={24} className="text-[#C9A24B]" /></div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Ajustes</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Preferencias y datos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Izquierda */}
        <div className="xl:col-span-8 space-y-5">
          {/* Perfil */}
          <Card icon={<AssetIcon name="icon-profile" size={15} />} title="Perfil">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-app-bg border border-app-border flex items-center justify-center">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-brand-dark/30">{user?.label?.charAt(0).toUpperCase()}</span>}
                  {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><RefreshCw size={18} className="text-white animate-spin" /></div>}
                </div>
                <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center border-2 border-app-card"><Camera size={13} /></button>
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Nombre</label>
                <div className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value)} className="flex-1 h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13.5px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  <button onClick={saveName} className="flex items-center gap-1.5 rounded-xl bg-brand-primary text-white px-4 text-[13px] font-bold hover:brightness-110">{savedName ? <Check size={15} /> : 'Guardar'}</button>
                </div>
              </div>
            </div>
          </Card>

          {/* Apariencia */}
          <Card icon={<Palette size={15} />} title="Apariencia">
            <p className="text-[12px] font-semibold text-brand-dark/55 mb-2">Modo</p>
            <div className="inline-flex items-center gap-1 bg-app-bg rounded-xl p-1 mb-4">
              <button onClick={() => isDarkMode && toggleDarkMode()} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold ${!isDarkMode ? 'bg-app-card text-brand-dark shadow-sm' : 'text-brand-dark/50'}`}><Sun size={14} /> Claro</button>
              <button onClick={() => !isDarkMode && toggleDarkMode()} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold ${isDarkMode ? 'bg-app-card text-brand-dark shadow-sm' : 'text-brand-dark/50'}`}><Moon size={14} /> Oscuro</button>
            </div>
            <p className="text-[12px] font-semibold text-brand-dark/55 mb-2">Tema</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition-all ${currentTheme === t.id ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-app-border text-brand-dark/60 hover:bg-app-bg'}`}>
                  <span className="w-3 h-3 rounded-full" style={{ background: t.sw }} /> {t.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Idioma */}
          <Card icon={<Languages size={15} />} title="Idioma">
            <div className="flex flex-wrap gap-2">
              {LANGS.map(([code, label]) => (
                <button key={code} onClick={() => i18n.changeLanguage(code)} className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition-all ${i18n.language?.startsWith(code) ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-app-border text-brand-dark/60 hover:bg-app-bg'}`}>{label}</button>
              ))}
            </div>
          </Card>

          {/* Notificaciones */}
          <Card icon={<Bell size={15} />} title="Notificaciones">
            {!notificationsSupported() ? (
              <p className="text-[13px] text-brand-dark/55">Este dispositivo no soporta notificaciones locales.</p>
            ) : isElectron() ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BellRing size={17} /></span>
                  <div>
                    <p className="text-[13.5px] font-bold text-brand-dark">Activadas en Windows</p>
                    <p className="text-[11.5px] text-brand-dark/45">Recibirás un aviso del sistema cuando venza una alerta.</p>
                  </div>
                </div>
                <button onClick={testNotification} className="shrink-0 rounded-xl border border-app-border px-3.5 py-2 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg">Probar</button>
              </div>
            ) : notifPerm === 'granted' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BellRing size={17} /></span>
                  <div>
                    <p className="text-[13.5px] font-bold text-brand-dark">Notificaciones activadas</p>
                    <p className="text-[11.5px] text-brand-dark/45">Avisos mientras CarniLab esté abierto. En iPhone, instala la app en la pantalla de inicio.</p>
                  </div>
                </div>
                <button onClick={testNotification} className="shrink-0 rounded-xl border border-app-border px-3.5 py-2 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg">Probar</button>
              </div>
            ) : notifPerm === 'denied' ? (
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><BellOff size={17} /></span>
                <div>
                  <p className="text-[13.5px] font-bold text-brand-dark">Bloqueadas</p>
                  <p className="text-[11.5px] text-brand-dark/45">Permite las notificaciones de CarniLab en los ajustes del navegador para reactivarlas.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-[#C9A24B]/12 text-[#C9A24B] flex items-center justify-center"><Bell size={17} /></span>
                  <div>
                    <p className="text-[13.5px] font-bold text-brand-dark">Avisos de alertas</p>
                    <p className="text-[11.5px] text-brand-dark/45">Recibe un aviso cuando venza una tarea de tus plantas.</p>
                  </div>
                </div>
                <button onClick={enableNotifications} className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-primary text-white px-4 py-2 text-[12.5px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110"><Bell size={14} /> Activar</button>
              </div>
            )}
          </Card>

          {/* Nube (campo ↔ escritorio) */}
          <Card icon={<Cloud size={15} />} title="Nube · campo ↔ escritorio">
            {!cloudConfigured ? (
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><CloudOff size={17} /></span>
                <div>
                  <p className="text-[13.5px] font-bold text-brand-dark">Nube no configurada</p>
                  <p className="text-[11.5px] text-brand-dark/45">Faltan las claves de Supabase (VITE_SUPABASE_URL / ANON_KEY) en el build.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-brand-dark/55 mb-3">
                  Usá el <b className="text-brand-dark">mismo código de espacio</b> en la PC y en el iPhone. El teléfono captura en el campo sin la PC; al prender la PC, todo baja al escritorio.
                </p>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Código de espacio</label>
                <div className="flex gap-2 mb-2">
                  <input value={spaceCode} onChange={e => setSpaceCode(e.target.value)} placeholder="ej: carni-mi-codigo-secreto" className="flex-1 h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  <button onClick={copySpace} title="Copiar" className="w-11 h-11 shrink-0 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/60 hover:bg-app-bg"><Copy size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button onClick={saveSpace} className="rounded-xl bg-brand-primary text-white px-4 py-2 text-[12.5px] font-bold hover:brightness-110">Guardar código</button>
                  <button onClick={genSpace} className="rounded-xl border border-app-border px-4 py-2 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg">Generar uno nuevo</button>
                </div>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-app-border">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cloudReady() ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span className="text-[12px] text-brand-dark/55">{cloudReady() ? 'Listo' : 'Falta el código'} · última sync: {fmtLast(lastSync)}</span>
                  </div>
                  <button onClick={runCloudSync} disabled={cloudBusy || !cloudReady()} className="flex items-center gap-1.5 rounded-xl bg-brand-secondary text-white px-4 py-2 text-[12.5px] font-bold hover:brightness-110 disabled:opacity-50">
                    <RefreshCw size={14} className={cloudBusy ? 'animate-spin' : ''} /> Sincronizar ahora
                  </button>
                </div>
                {cloudMsg && (
                  <p className={`mt-2 text-[12px] font-semibold ${cloudMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{cloudMsg.text}</p>
                )}
              </>
            )}
          </Card>

          {/* Datos / Backup */}
          <Card icon={<Database size={15} />} title="Datos / Backup">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => navigate('/backup')} className="flex items-center justify-center gap-2 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg"><Download size={15} className="text-emerald-600" /> Exportar JSON</button>
              <button onClick={() => navigate('/backup')} className="flex items-center justify-center gap-2 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg"><Upload size={15} className="text-amber-600" /> Importar JSON</button>
              <button onClick={() => navigate('/backup')} className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-[13px] font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={15} /> Borrar todo</button>
            </div>
          </Card>

          {/* Acerca de */}
          <Card icon={<Info size={15} />} title="Acerca de">
            <p className="text-[13px] text-brand-dark/60">CarniLab Local · v2.0 · <b className="text-brand-dark">100% local y sin nube</b></p>
            <button onClick={() => window.location.reload()} className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary/70 hover:text-brand-primary"><RefreshCw size={13} /> Recargar la app</button>
          </Card>
        </div>

        {/* Derecha: Sincronizar */}
        <div className="xl:col-span-4">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 xl:sticky xl:top-20">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-1"><span className="text-[#C9A24B]"><Smartphone size={15} /></span> Sincronizar con el iPhone</h3>
            <p className="text-[12px] text-brand-dark/50 mb-4">Sincroniza tus datos entre la PC y el iPhone por Wi-Fi, sin nube.</p>
            <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#C9A24B]/12 text-[#C9A24B] flex items-center justify-center mb-3"><Wifi size={26} /></div>
              <p className="text-[13px] font-semibold text-brand-dark">Emparejamiento por Wi-Fi local</p>
              <p className="text-[11.5px] text-brand-dark/45 mt-1">Escanea el QR desde el iPhone y mantené ambos dispositivos en la misma red.</p>
            </div>
            <button onClick={() => navigate('/sync')} className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3 text-[13.5px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95">Abrir sincronización <ChevronRight size={16} /></button>
            <p className="text-[11px] text-brand-dark/40 mt-3 text-center">Se abrirá la pantalla de emparejamiento y sincronización.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
    <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-4"><span className="text-[#C9A24B]">{icon}</span> {title}</h3>
    {children}
  </div>
);

export default ProfileScreen;
