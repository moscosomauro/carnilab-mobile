import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { Cross } from '../../types';
import { polStatus, progresoCapsula, capsulaMadura, fmtDayLong, fw, ETAPAS_CAPSULA } from '../../utils/pollination';
import { Sprout, Scissors, Database, CheckCircle2, Leaf, X, Minus, Plus } from 'lucide-react';

const MobileCapsules: React.FC = () => {
  const navigate = useNavigate();
  const { crosses, updateCross, addSeedBatch } = useApp();

  const [modal, setModal] = useState<Cross | null>(null);   // cruza a cosechar
  const [cant, setCant] = useState(0);                       // semillas en el modal
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Cápsulas: cruzas ya polinizadas (hechas) con seguimiento.
  const capsulas = useMemo(
    () => crosses.filter(c => polStatus(c) === 'hecha' || c.capsula_estado),
    [crosses]
  );

  const stats = useMemo(() => {
    const activas = capsulas.filter(c => c.capsula_estado !== 'cosechada');
    return {
      activas: activas.length,
      paraCosecha: activas.filter(capsulaMadura).length,
      semillas: activas.reduce((s, c) => s + (c.semillas_estimadas || 0), 0),
    };
  }, [capsulas]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const abrirCosecha = (c: Cross, e: React.MouseEvent) => {
    e.stopPropagation();
    setCant(c.semillas_estimadas || c.semillas_obtenidas || 0);
    setModal(c);
  };

  // Guarda la cosecha; opcionalmente crea el lote en el banco de semillas.
  const cosechar = async (alBanco: boolean) => {
    if (!modal || busy) return;
    setBusy(true);
    try {
      await updateCross({ ...modal, capsula_estado: 'cosechada', semillas_obtenidas: cant, estado: 'completada' } as Cross);
      if (alBanco) await crearLote(modal, cant);
      setModal(null);
      flash(alBanco ? `Cosechada y enviada al banco (${cant} semillas)` : `Cosecha registrada (${cant} semillas)`);
    } finally { setBusy(false); }
  };

  const crearLote = async (c: Cross, cantidad: number) => {
    await addSeedBatch({
      nombre: `${fw(c.madre_nombre)} × ${fw(c.padre_nombre)}`,
      especie: c.madre_especie,
      cantidad,
      fecha_ingreso: new Date().toISOString(),
      origen: 'propia',
      cross_id: c.id,
      estado: 'almacenada',
      notas: `Cosecha de la cruza ${c.nombre}`,
    } as any);
  };

  // Para cápsulas ya cosechadas: transferir directo al banco (sin diálogo nativo).
  const transferirDirecto = async (c: Cross, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await crearLote(c, c.semillas_obtenidas || c.semillas_estimadas || 0);
      flash('Lote agregado al banco de semillas');
    } finally { setBusy(false); }
  };

  return (
    <>
      <MobileHeader title="Seguimiento de cápsulas" subtitle="Post polinización" back />
      <div className="px-5 space-y-4 pb-28">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<Sprout size={17} />} value={stats.activas} label="Cápsulas activas" tone="text-emerald-600" />
          <Stat icon={<Scissors size={17} />} value={stats.paraCosecha} label="Para cosecha" tone="text-[#9a7b2f]" />
          <Stat icon={<Leaf size={17} />} value={stats.semillas} label="Semillas estim." tone="text-brand-secondary" />
        </div>

        {capsulas.length === 0 && (
          <div className="bg-app-card border border-app-border rounded-xl py-10 text-center">
            <Sprout size={28} className="mx-auto text-brand-dark/20 mb-2" />
            <p className="text-[13px] font-bold text-brand-dark/50">Sin cápsulas en seguimiento</p>
            <p className="text-[11.5px] text-brand-dark/35">Registrá una polinización para empezar a seguir su cápsula.</p>
          </div>
        )}

        {capsulas.map(c => {
          const p = progresoCapsula(c);
          const cosechada = c.capsula_estado === 'cosechada';
          const madura = !cosechada && capsulaMadura(c);
          const etapaIdx = ETAPAS_CAPSULA.indexOf(p.etapa as any);
          return (
            <div key={c.id} onClick={() => navigate(`/crosses/${c.id}`)} className="bg-app-card border border-app-border rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                  {c.madre_imagen ? <img src={c.madre_imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={c.madre_especie} size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-brand-dark truncate">{fw(c.madre_nombre)} × {fw(c.padre_nombre)}</p>
                  <p className="text-[11px] text-brand-dark/45">Cosecha estimada: {fmtDayLong(p.cosecha)}</p>
                </div>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${cosechada ? 'bg-app-bg text-brand-dark/45' : madura ? 'bg-emerald-50 text-emerald-700' : 'bg-[#C9A24B]/15 text-[#9a7b2f]'}`}>
                  {cosechada ? 'Cosechada' : madura ? 'Maduro' : 'Desarrollo'}
                </span>
              </div>

              {/* Progreso */}
              {!cosechada && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-app-bg overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-brand-dark/55 shrink-0">{p.pct}%</span>
                    <span className="text-[11px] text-brand-dark/40 shrink-0">· {p.dias} d</span>
                  </div>
                  {/* Cronología */}
                  <div className="flex items-center justify-between">
                    {ETAPAS_CAPSULA.map((et, i) => (
                      <div key={et} className="flex flex-col items-center gap-1 flex-1">
                        <span className={i <= etapaIdx ? 'text-emerald-500' : 'text-brand-dark/20'}><CheckCircle2 size={14} /></span>
                        <span className={`text-[8.5px] text-center leading-tight ${i <= etapaIdx ? 'text-brand-dark/60 font-semibold' : 'text-brand-dark/30'}`}>{et}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Acción cuando está madura */}
              {madura && (
                <button onClick={e => abrirCosecha(c, e)} className="w-full flex items-center justify-center gap-1.5 bg-brand-primary text-white rounded-lg py-2.5 text-[12.5px] font-bold active:scale-95"><Scissors size={14} /> Registrar cosecha</button>
              )}
              {cosechada && (
                <button onClick={e => transferirDirecto(c, e)} disabled={busy} className="w-full flex items-center justify-center gap-1.5 border border-app-border text-brand-dark rounded-lg py-2.5 text-[12.5px] font-bold active:scale-95 disabled:opacity-50"><Database size={14} /> Transferir al banco ({c.semillas_obtenidas || 0} semillas)</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast de confirmación */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] bg-brand-dark text-white text-[12.5px] font-semibold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 animate-scale-in">
          <CheckCircle2 size={15} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Modal de cosecha */}
      {modal && (
        <div className="fixed inset-0 z-[110] bg-brand-dark/40 backdrop-blur-sm flex items-end" onClick={() => !busy && setModal(null)}>
          <div className="w-full bg-app-card rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-accent text-[20px] font-bold text-brand-dark">Registrar cosecha</h2>
              <button onClick={() => !busy && setModal(null)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button>
            </div>
            <p className="text-[12.5px] text-brand-dark/55 mb-4">{fw(modal.madre_nombre)} × {fw(modal.padre_nombre)}</p>

            <p className="text-[12px] font-semibold text-brand-dark/55 mb-1.5">Semillas obtenidas</p>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setCant(n => Math.max(0, n - 10))} className="w-11 h-11 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/60 active:scale-95"><Minus size={18} /></button>
              <input type="number" value={cant} onChange={e => setCant(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 h-12 rounded-xl bg-app-bg border border-app-border text-center text-[20px] font-black text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <button onClick={() => setCant(n => n + 10)} className="w-11 h-11 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/60 active:scale-95"><Plus size={18} /></button>
            </div>

            <button onClick={() => cosechar(true)} disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[14.5px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 mb-2">
              <Database size={17} /> {busy ? 'Guardando…' : 'Cosechar y enviar al banco'}
            </button>
            <button onClick={() => cosechar(false)} disabled={busy} className="w-full flex items-center justify-center gap-2 border border-app-border text-brand-dark rounded-xl py-3 text-[13.5px] font-bold active:scale-95 transition-all disabled:opacity-50">
              <Scissors size={15} /> Solo registrar cosecha
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string; tone: string }> = ({ icon, value, label, tone }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-3 text-center">
    <span className={`flex justify-center mb-1 ${tone}`}>{icon}</span>
    <p className="text-[22px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9.5px] text-brand-dark/45 mt-1 leading-tight">{label}</p>
  </div>
);

export default MobileCapsules;
