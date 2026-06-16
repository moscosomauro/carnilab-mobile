import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { savePairToken, getPairToken, getLastSync, syncNow } from '../../db/syncClient';
import { useApp } from '../../context/AppContext';
import { ScanLine, Keyboard, Wifi, RefreshCw, Check } from 'lucide-react';

// react-qr-scanner se carga solo al activar la cámara (evita romper el render inicial)
const QrReader: any = lazy(() => import('react-qr-scanner').then(m => ({ default: (m as any).default })));

const fmt = (t: number) => t ? new Date(t).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca';

const MobileSync: React.FC<{ onPaired?: () => void }> = ({ onPaired }) => {
  const { currentLogo } = useTheme();
  const { fetchData } = useApp();
  const [params, setParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState(false);
  const [ip, setIp] = useState('');
  const [paired, setPaired] = useState(!!getPairToken());
  const [error, setError] = useState<string | null>(null);

  // Si llegó con ?pairToken (escaneó el QR de la PC), guardar y emparejar
  useEffect(() => {
    const token = params.get('pairToken');
    if (token) {
      savePairToken(token); setPaired(true);
      params.delete('pairToken'); setParams(params, { replace: true });
      syncNow().then(r => { if (r.ok) fetchData(); }).finally(() => onPaired?.());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScan = (data: any) => {
    const text = data?.text || (typeof data === 'string' ? data : null);
    if (text) { window.location.href = text; }
  };

  const goManual = () => {
    const v = ip.trim();
    if (!v) return;
    const url = v.startsWith('http') ? v : `http://${v}${v.includes(':') ? '' : ':8787'}/`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-app-bg text-brand-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <img src={currentLogo} alt="" className="w-11 h-11 object-contain" />
        <div className="flex-1">
          <h1 className="font-accent text-[26px] font-bold text-brand-dark leading-none">Sinc</h1>
          <p className="text-[12px] text-brand-dark/50 mt-0.5">Escaneá el código QR para sincronizar</p>
        </div>
      </div>

      <div className="px-5 space-y-4 flex-1">
        {/* Visor de cámara */}
        <div className="relative rounded-2xl overflow-hidden border border-app-border bg-brand-dark/90 aspect-[4/3]">
          {scanning ? (
            <Suspense fallback={<Center>Iniciando cámara…</Center>}>
              <QrReader delay={300} onError={() => setError('No se pudo acceder a la cámara.')} onScan={onScan}
                constraints={{ video: { facingMode: 'environment' } }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Suspense>
          ) : (
            <Center><ScanLine size={40} className="text-[#C9A24B] mb-2" /><span>Apuntá la cámara al QR que aparece en la PC</span></Center>
          )}
          {/* Marco dorado */}
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-[#C9A24B]/70" style={{ clipPath: 'polygon(0 0,30px 0,30px 4px,4px 4px,4px 30px,0 30px,0 0,0 100%,30px 100%,30px calc(100% - 4px),4px calc(100% - 4px),4px calc(100% - 30px),0 calc(100% - 30px),0 100%,100% 100%,100% calc(100% - 30px),calc(100% - 4px) calc(100% - 30px),calc(100% - 4px) calc(100% - 4px),calc(100% - 30px) calc(100% - 4px),calc(100% - 30px) 100%,100% 100%,100% 0,calc(100% - 30px) 0,calc(100% - 30px) 4px,calc(100% - 4px) 4px,calc(100% - 4px) 30px,100% 30px,100% 0)' }} />
        </div>

        {error && <p className="text-[12.5px] font-semibold text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        {/* Estado */}
        <div className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-4 py-3">
          <RefreshCw size={18} className={`text-[#C9A24B] ${scanning ? 'animate-spin' : ''}`} />
          <div>
            <p className="text-[13px] font-bold text-brand-dark">{scanning ? 'Esperando código de sincronización…' : 'Listo para escanear'}</p>
            <p className="text-[11px] text-brand-dark/45">{paired ? 'Dispositivo emparejado' : 'Sin emparejar'}</p>
          </div>
        </div>

        {/* Botones */}
        <button onClick={() => { setScanning(true); setError(null); }} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all">
          <ScanLine size={18} /> Escanear
        </button>
        <button onClick={() => setManual(m => !m)} className="w-full flex items-center justify-center gap-2 bg-app-card border border-app-border rounded-xl py-3 text-[14px] font-bold text-brand-dark active:scale-95 transition-all">
          <Keyboard size={16} /> Ingresar IP manualmente
        </button>
        {manual && (
          <div className="flex gap-2">
            <input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.235:8787" className="flex-1 h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <button onClick={goManual} className="rounded-xl bg-brand-primary text-white px-4 text-[13px] font-bold">Conectar</button>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-brand-dark/45"><Wifi size={13} /> Ambos dispositivos deben estar en la misma red Wi-Fi</p>

        {/* Sincronización reciente */}
        <div className="bg-app-card border border-app-border rounded-xl px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-brand-primary mb-2">Sincronización reciente</p>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-brand-dark/55">Última conexión</span>
            <span className="font-semibold text-brand-dark">{fmt(getLastSync())}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] mt-1">
            <span className="text-brand-dark/55">Estado</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${paired ? 'text-emerald-600' : 'text-brand-dark/40'}`}>{paired && <Check size={13} />}{paired ? 'Emparejado' : 'No emparejado'}</span>
          </div>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
};

const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[12.5px] text-[#F2EDD8]/80 px-6">{children}</div>
);

export default MobileSync;
