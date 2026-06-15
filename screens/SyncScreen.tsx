import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '../components/Icon';
import { useApp } from '../context/AppContext';
import { isElectron, syncNow, savePairToken, getPairToken, getPairLink, getLastSync } from '../db/syncClient';

const SyncScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchData, plants, crosses, diary } = useApp();

  const electron = isElectron();
  const [pairLink, setPairLink] = useState<{ link: string; ip: string; port: number } | null>(null);
  const [paired, setPaired] = useState<boolean>(electron || !!getPairToken());
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [lastSync, setLastSync] = useState<number>(getLastSync());

  // iPhone: si llegó con ?pairToken (escaneó el QR), guardar y emparejar
  useEffect(() => {
    const token = searchParams.get('pairToken');
    if (token && !electron) {
      savePairToken(token);
      setPaired(true);
      searchParams.delete('pairToken');
      setSearchParams(searchParams, { replace: true });
      // Sincronizar automáticamente al emparejar
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PC: generar el QR de emparejamiento
  useEffect(() => {
    if (electron) getPairLink().then(setPairLink);
  }, [electron]);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    const r = await syncNow();
    if (r.ok) {
      await fetchData();
      setLastSync(Date.now());
      setResult({ ok: true, msg: 'Sincronización completa' });
    } else {
      setResult({ ok: false, msg: r.error || 'Error al sincronizar' });
    }
    setSyncing(false);
  };

  const fmtLast = (t: number) => t ? new Date(t).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca';

  return (
    <div className="min-h-screen bg-transparent flex justify-center font-display">
      <div className="relative z-10 w-full max-w-[390px] lg:max-w-2xl px-6 pt-10 pb-32 flex flex-col items-center">

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform text-brand-dark">
            <Icon name="arrow_back" />
          </button>
          <h1 className="text-[22px] font-bold text-brand-dark absolute left-1/2 -translate-x-1/2">Sincronizar</h1>
          <div className="w-10" />
        </div>

        {/* Estado */}
        <div className="w-full bg-brand-surface rounded-card p-5 shadow-soft border border-brand-light/20 mb-6 text-center">
          <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${paired ? 'bg-[#4A5D4F]/10 text-[#4A5D4F]' : 'bg-[#EFEBE4] text-brand-light'}`}>
            <Icon name={paired ? 'sync' : 'sync_disabled'} className="text-2xl" />
          </div>
          <p className="text-sm font-black text-brand-dark">
            {electron ? 'Esta PC es el centro de datos' : paired ? 'iPhone emparejado' : 'iPhone sin emparejar'}
          </p>
          <p className="text-[11px] text-brand-light font-bold mt-1">
            {plants.length} plantas · {crosses.length} cruzas · {diary.length} diario
          </p>
          <p className="text-[10px] text-brand-light/70 mt-1">Última sync: {fmtLast(lastSync)}</p>
        </div>

        {/* PC: muestra el QR para que el iPhone lo escanee */}
        {electron && (
          <div className="w-full bg-white rounded-card p-6 shadow-soft border border-brand-light/20 mb-6 flex flex-col items-center">
            <p className="text-xs font-bold text-brand-dark/70 mb-4 text-center leading-relaxed">
              Escaneá este código con la <strong>cámara del iPhone</strong> (la app Cámara normal).<br />
              Se abrirá CarniLab en Safari, ya emparejado.
            </p>
            {pairLink ? (
              <div className="bg-white p-4 rounded-2xl border border-brand-light/10">
                <QRCodeSVG value={pairLink.link} size={200} level="M" />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-brand-light text-xs">Generando…</div>
            )}
            {pairLink && (
              <p className="text-[10px] text-brand-light font-mono mt-3 text-center break-all">
                {pairLink.ip}:{pairLink.port}
              </p>
            )}
            <p className="text-[10px] text-brand-light/70 mt-2 text-center">
              El iPhone tiene que estar en la misma red Wi-Fi.
            </p>
          </div>
        )}

        {/* Botón sincronizar (ambos) */}
        {(paired || electron) && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full h-14 bg-[#4A5D4F] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#4A5D4F]/20 disabled:opacity-50"
          >
            {syncing ? <span className="animate-spin text-lg">⟳</span> : <Icon name="sync" className="text-lg" />}
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        )}

        {!electron && !paired && (
          <p className="text-xs text-brand-light text-center px-4 leading-relaxed">
            Abrí CarniLab en la PC, andá a <strong>Sincronizar</strong> y escaneá el QR con la cámara de tu iPhone para emparejar.
          </p>
        )}

        {result && (
          <div className={`mt-4 w-full text-center text-xs font-bold px-4 py-3 rounded-xl ${result.ok ? 'bg-[#4A5D4F]/10 text-[#4A5D4F]' : 'bg-[#C0392B]/10 text-[#C0392B]'}`}>
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncScreen;
