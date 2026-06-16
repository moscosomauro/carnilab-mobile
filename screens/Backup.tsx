import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { clearAllData } from '../db/localDb';
import { AssetIcon } from '../components/AssetIcon';
import {
  Download, Upload, Trash2, ShieldAlert, CheckCircle2, RefreshCw, Database,
  FileJson, AlertTriangle, Clock
} from 'lucide-react';

interface BackupHist { ts: string; file: string; size: string; registros: number; }
const HIST_KEY = 'carnilab_backup_history';
const loadHist = (): BackupHist[] => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } };
const fmtDT = (f: string) => new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

const BackupScreen: React.FC = () => {
  const { plants, crosses, alerts, diary, climateLogs, seedBank, restoreData, fetchData } = useApp();
  const [busy, setBusy] = useState<'' | 'export' | 'import' | 'clear'>('');
  const [toast, setToast] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [hist, setHist] = useState<BackupHist[]>(loadHist());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); } }, [toast]);

  const total = plants.length + crosses.length + alerts.length + diary.length + climateLogs.length + seedBank.length;

  const exportJSON = () => {
    setBusy('export');
    const data = { timestamp: new Date().toISOString(), version: '2.0', plants, crosses, alerts, diary, climateLogs, seedBank };
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const file = `carnilab_backup_${new Date().toISOString().split('T')[0]}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    const entry: BackupHist = { ts: new Date().toISOString(), file, size: `${(blob.size / 1024).toFixed(1)} KB`, registros: total };
    const next = [entry, ...hist].slice(0, 50);
    setHist(next); localStorage.setItem(HIST_KEY, JSON.stringify(next));
    setBusy(''); setToast('Backup descargado');
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!window.confirm('Restaurar agregará los datos del archivo a tu colección actual. ¿Continuar?')) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      try { const json = JSON.parse(ev.target?.result as string); setBusy('import'); const ok = await restoreData(json); setBusy(''); setToast(ok ? 'Restauración exitosa' : 'Error al restaurar'); }
      catch { setBusy(''); alert('Archivo inválido.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const clearAll = async () => {
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') { alert('Escribe ELIMINAR para confirmar.'); return; }
    if (!window.confirm(`Esto borrará TODOS tus datos (${total} registros). Esta acción no se puede deshacer. ¿Continuar?`)) return;
    setBusy('clear');
    try { await clearAllData(); await fetchData(); setToast('Todos los datos fueron eliminados'); setConfirmText(''); }
    catch { alert('Error al borrar los datos.'); } finally { setBusy(''); }
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      <input type="file" ref={fileRef} accept=".json" className="hidden" onChange={onFile} />
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-backup" size={26} /></div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Backup</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Respaldo, exporta, importa o restaura tus datos de Sarracenia M.A.R</p>
        </div>
      </div>

      {/* 3 acciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <ActionCard tone="emerald" icon={<Download size={22} />} title="Exportar JSON" desc="Crea un archivo .JSON con toda tu colección y configuración actual."
          bullets={['Incluye plantas, cruzas, diario y más', 'Formato compatible con Sarracenia M.A.R', 'Ideal para copias de seguridad locales']}
          action={<button onClick={exportJSON} disabled={busy === 'export'} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl py-2.5 text-[13px] font-bold hover:brightness-110 disabled:opacity-50"><Download size={15} /> Exportar JSON</button>} />

        <ActionCard tone="amber" icon={<Upload size={22} />} title="Importar JSON" desc="Restaura datos desde un archivo .JSON previamente exportado."
          bullets={['Agrega a la colección actual', 'No reemplaza ni borra lo existente', 'Verifica el origen del archivo']}
          action={<div className="flex gap-2"><button onClick={() => fileRef.current?.click()} disabled={busy === 'import'} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white rounded-xl py-2.5 text-[13px] font-bold hover:brightness-110 disabled:opacity-50"><Upload size={15} /> Importar JSON</button><button onClick={() => fetchData()} title="Actualizar" className="rounded-xl border border-app-border px-3 text-brand-dark/60 hover:bg-app-bg"><RefreshCw size={15} /></button></div>} />

        <ActionCard tone="rose" icon={<Trash2 size={22} />} title="Borrar todos los datos" desc="Elimina permanentemente todos los datos de este dispositivo."
          bullets={['Acción irreversible', 'Requiere confirmación por texto', 'Exporta un backup antes']}
          action={<div className="text-[12px] text-rose-600/80 font-semibold flex items-center gap-1.5"><ShieldAlert size={15} /> Usa la zona de peligro abajo →</div>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Historial */}
        <div className="xl:col-span-8">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <p className="px-5 pt-4 pb-2 flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><Clock size={14} /></span> Historial de backups</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase tracking-wider text-brand-dark/40 border-y border-app-border">
                  <th className="font-bold px-5 py-2.5">Fecha y hora</th><th className="font-bold px-3 py-2.5">Archivo</th><th className="font-bold px-3 py-2.5">Tamaño</th><th className="font-bold px-3 py-2.5">Registros</th><th className="font-bold px-3 py-2.5">Estado</th>
                </tr></thead>
                <tbody className="divide-y divide-app-border">
                  {hist.map((h, i) => (
                    <tr key={i} className="hover:bg-app-bg/50">
                      <td className="px-5 py-2.5 text-[12px] text-brand-dark/70">{fmtDT(h.ts)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/60 flex items-center gap-1.5"><FileJson size={13} className="text-[#C9A24B]" /> {h.file}</td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/60">{h.size}</td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/60">{h.registros}</td>
                      <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600"><CheckCircle2 size={13} /> Exportado</span></td>
                    </tr>
                  ))}
                  {hist.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px] text-brand-dark/35">Aún no exportaste ningún backup</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="xl:col-span-4">
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-rose-600 mb-1"><AlertTriangle size={16} /> Zona de peligro</h3>
            <p className="text-[12px] text-brand-dark/55 mb-4">Eliminar todos los datos de este dispositivo. Esta acción no se puede deshacer.</p>
            <div className="flex items-center gap-2 mb-3 text-[12px] text-brand-dark/55"><Database size={14} /> {total} registros locales</div>
            <label className="block text-[11px] font-semibold text-brand-dark/55 mb-1.5">Escribe <b className="text-rose-600">ELIMINAR</b> para confirmar</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="ELIMINAR" className="w-full h-11 rounded-xl bg-app-card border border-rose-200 px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-rose-300 mb-3" />
            <button onClick={clearAll} disabled={busy === 'clear' || confirmText.trim().toUpperCase() !== 'ELIMINAR'} className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white rounded-xl py-2.5 text-[13px] font-bold hover:brightness-110 disabled:opacity-40"><Trash2 size={15} /> Eliminar todos los datos</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-brand-secondary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-scale-in"><CheckCircle2 size={18} /> <span className="text-[13px] font-bold">{toast}</span></div>
      )}
      {(busy === 'import' || busy === 'clear') && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-app-card px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center"><RefreshCw size={28} className="animate-spin text-brand-primary mb-3" /><p className="text-[13px] font-bold text-brand-dark">{busy === 'import' ? 'Restaurando datos…' : 'Borrando datos…'}</p></div>
        </div>
      )}
    </div>
  );
};

const toneMap: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'border-amber-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'border-rose-200' },
};
const ActionCard: React.FC<{ tone: string; icon: React.ReactNode; title: string; desc: string; bullets: string[]; action: React.ReactNode }> = ({ tone, icon, title, desc, bullets, action }) => {
  const t = toneMap[tone];
  return (
    <div className={`bg-app-card border ${t.ring} rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 flex flex-col`}>
      <div className={`w-11 h-11 rounded-xl ${t.bg} ${t.text} flex items-center justify-center mb-3`}>{icon}</div>
      <h3 className="font-accent text-[18px] font-bold text-brand-dark">{title}</h3>
      <p className="text-[12px] text-brand-dark/50 mt-1 mb-3">{desc}</p>
      <ul className="space-y-1.5 mb-4 flex-1">
        {bullets.map((b, i) => <li key={i} className="flex items-start gap-2 text-[12px] text-brand-dark/60"><span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${t.bg.replace('50', '400')} shrink-0`} /> {b}</li>)}
      </ul>
      {action}
    </div>
  );
};

export default BackupScreen;
