
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// --- ICONS ---
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconCloud = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

const BackupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, alerts, diary, climateLogs, seedBank, restoreData } = useApp();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildBackup = () => ({
    timestamp: new Date().toISOString(),
    version: '2.0',
    plants,
    crosses,
    alerts,
    diary,
    climateLogs,
    seedBank
  });

  const handleLocalBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const dataStr = JSON.stringify(buildBackup(), null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `carnilab_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsBackingUp(false);
      setSuccessMsg('Archivo descargado');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 300);
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

  const totalRegistros = plants.length + crosses.length + alerts.length + diary.length + climateLogs.length + seedBank.length;

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
            <h1 className="text-[22px] font-bold text-[#2E2E2E] leading-tight tracking-tight">Backup</h1>
            <p className="text-[11px] text-[#8E877F] font-semibold tracking-wider opacity-80 uppercase">Exportar e Importar</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Backup Card */}
        <div className="w-full bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFEBE4] rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none" />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isBackingUp ? 'bg-[#FF7A59]/10 text-[#FF7A59]' : 'bg-[#EFEBE4] text-[#4A5D4F]'}`}>
              {isBackingUp ? <div className="animate-spin text-2xl">⟳</div> : <IconCloud />}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2E2E2E] leading-tight">Mis Datos</h2>
              <p className="text-xs font-bold text-[#8E877F]">
                {totalRegistros} registros en este dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={handleLocalBackup}
            disabled={isBackingUp}
            className="w-full h-12 bg-[#4A5D4F] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#4A5D4F]/20 disabled:opacity-50"
          >
            <IconDownload /> Descargar Backup (.JSON)
          </button>
        </div>

        {/* Restore from File Section */}
        <div className="w-full mb-8">
          <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 ml-2">Restaurar desde Archivo</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full h-14 bg-white/60 border border-dashed border-[#8E877F]/40 rounded-2xl text-[#8E877F] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white disabled:opacity-50"
          >
            <IconUpload /> Cargar archivo .JSON
          </button>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileSelect} />
        </div>

        <p className="text-[10px] text-[#8E877F] text-center leading-relaxed px-4 opacity-70">
          Tus datos viven solo en este dispositivo. Descarga un backup cada cierto tiempo
          y guárdalo en un lugar seguro (otra carpeta, un pendrive o tu otro dispositivo).
        </p>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-300">
            <div className="bg-[#4A5D4F] px-8 py-6 rounded-[30px] shadow-2xl scale-[1.1] animate-in zoom-in duration-300 flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 text-white">✓</div>
              <p className="text-white font-bold text-sm text-center">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Restoring Overlay */}
        {isRestoring && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="bg-white px-8 py-6 rounded-[30px] shadow-2xl flex flex-col items-center">
              <div className="animate-spin text-3xl mb-3">⟳</div>
              <p className="text-[#2E2E2E] font-bold text-sm">Restaurando datos...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BackupScreen;
