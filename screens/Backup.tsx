
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface BackupRecord {
  id: string;
  nombre: string;
  fecha: string;
  tamaño: string;
  tipo: 'local' | 'nube';
}

// --- ICONS ---
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconCloud = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconDownload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconSync = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.5" />
  </svg>
);

const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconDelete = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const BackupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, alerts, diary, syncData, isSyncing, restoreData } = useApp();
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('backup_history');
    if (savedHistory) {
      setBackupHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveHistory = (newHistory: BackupRecord[]) => {
    setBackupHistory(newHistory);
    localStorage.setItem('backup_history', JSON.stringify(newHistory));
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const fullData = {
        timestamp: new Date().toISOString(),
        plants,
        crosses,
        alerts,
        diary
      };
      const dataStr = JSON.stringify(fullData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `carnilab_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const newRecord: BackupRecord = {
        id: Date.now().toString(),
        nombre: 'Backup Local',
        fecha: new Date().toISOString(),
        tamaño: `${(dataStr.length / 1024).toFixed(1)} KB`,
        tipo: 'local'
      };
      saveHistory([newRecord, ...backupHistory]);
      setIsBackingUp(false);
      setSuccessMsg('Archivo descargado correctamente');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleSync = async () => {
    setIsBackingUp(true);
    await syncData();
    setIsBackingUp(false);
    setSuccessMsg('Sincronización Completada');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("ATENCIÓN: Restaurar agregará datos a tu colección actual. ¿Continuar?")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setIsRestoring(true);
          const success = await restoreData(json);
          setIsRestoring(false);
          if (success) {
            setSuccessMsg('Restauración Exitosa');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            alert("Error al restaurar datos.");
          }
        } catch (err) {
          console.error(err);
          alert("Archivo inválido.");
          setIsRestoring(false);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Borrar historial?')) {
      const newHistory = backupHistory.filter(b => b.id !== id);
      saveHistory(newHistory);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const planFeatures = [
    { name: "Plantas", basic: "50", pro: "Ilimitado", elite: "Ilimitado", current: user?.plan },
    { name: "Carni Bot (IA)", basic: "No", pro: "No", elite: "Sí", current: user?.plan },
    { name: "Vivero/Tienda", basic: "No", pro: "No", elite: "Sí", current: user?.plan },
    { name: "Fotos", basic: "Local", pro: "Nube HD", elite: "Nube 4K", current: user?.plan },
  ];

  return (
    <div className="min-h-screen bg-transparent flex justify-center selection:bg-[#6B8E23]/10 font-display">
      {/* Texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      <div className="relative z-10 w-full max-w-[390px] px-6 pt-10 pb-32 flex flex-col items-center">

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="text-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-[22px] font-bold text-[#2E2E2E] leading-tight tracking-tight">Configuración</h1>
            <p className="text-[11px] text-[#8E877F] font-semibold tracking-wider opacity-80 uppercase">Backup & Planes</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Cloud Status Card */}
        <div className="w-full bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFEBE4] rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none" />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isSyncing ? 'bg-[#FF7A59]/10 text-[#FF7A59]' : 'bg-[#EFEBE4] text-[#4A5D4F]'}`}>
              {isSyncing ? <div className="animate-spin text-2xl">⟳</div> : <IconCloud />}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2E2E2E] leading-tight">Sincronización</h2>
              <p className="text-xs font-bold text-[#8E877F]">{isSyncing ? 'Sincronizando...' : 'Estado: Al día'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="h-12 bg-[#4A5D4F] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#4A5D4F]/20"
            >
              <IconSync /> Sync Nube
            </button>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="h-12 bg-white border-2 border-[#EFEBE4] text-[#4A5D4F] rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#F5F1EB]"
            >
              <IconDownload /> Backup Local
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="w-full mb-8">
          <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 ml-2">Restaurar Datos</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full h-14 bg-white/60 border border-dashed border-[#8E877F]/40 rounded-2xl text-[#8E877F] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white"
          >
            <IconUpload /> Cargar archivo .JSON de respaldo
          </button>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileSelect} />
        </div>

        {/* Plan Comparison */}
        <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-white mb-6">
          <h3 className="text-sm font-black text-[#2E2E2E] mb-4 flex items-center gap-2">
            <span>Tu Plan:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#6B8E23]/10 text-[#6B8E23] uppercase text-[10px] tracking-wider">{user?.plan}</span>
          </h3>

          <div className="space-y-3">
            {planFeatures.map((feat) => (
              <div key={feat.name} className="flex items-center justify-between py-2 border-b border-[#F5F1EB] last:border-0">
                <span className="text-xs font-bold text-[#8E877F]">{feat.name}</span>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className={`${user?.plan === 'basic' ? 'text-[#2E2E2E]' : 'text-[#D0CECB]'}`}>{feat.basic}</span>
                  <span className={`${user?.plan === 'pro' ? 'text-[#2E2E2E]' : 'text-[#D0CECB]'}`}>{feat.pro}</span>
                  <span className={`${user?.plan === 'elite' ? 'text-[#2E2E2E]' : 'text-[#D0CECB]'}`}>{feat.elite}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 h-10 rounded-xl bg-[#F5F1EB] text-[#4A5D4F] text-[10px] font-black uppercase tracking-widest hover:bg-[#EFEBE4] transition-colors">
            Ver Detalles de Planes
          </button>
        </div>

        {/* History List */}
        {backupHistory.length > 0 && (
          <div className="w-full space-y-3">
            <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-1 ml-2 flex items-center gap-2">
              <IconHistory /> Historial
            </h3>
            {backupHistory.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-white">
                <div>
                  <p className="text-xs font-bold text-[#2E2E2E]">{item.nombre}</p>
                  <p className="text-[10px] font-bold text-[#8E877F] opacity-70">{formatFecha(item.fecha)} • {item.tamaño}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-[#FF7A59] bg-[#FF7A59]/10 rounded-lg active:scale-95">
                  <IconDelete />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-300">
            <div className="bg-[#4A5D4F] px-8 py-6 rounded-[30px] shadow-2xl scale-[1.1] animate-in zoom-in duration-300 flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 text-white">✓</div>
              <p className="text-white font-bold text-sm text-center">{successMsg}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BackupScreen;
