import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Cross, ExtraParent } from '../types';
import { CrossSchema, validateData } from '../utils/validationSchemas';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import {
  Plus, X, ChevronDown, Venus, Mars, Dna, Network, Table2, Star, Calendar,
  Target, Sprout, Trash2, Pencil, PackagePlus, Award, GitBranch, Check, Flower2
} from 'lucide-react';

const OBJETIVOS = ['Mejorar coloración', 'Aumentar tamaño', 'Vigor híbrido', 'Resistencia', 'Nueva variedad', 'Otro'];

const estadoMeta: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  en_proceso: { label: 'En proceso', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  completada: { label: 'Completada', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  fallida: { label: 'Fallida', dot: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
};

const fmtDate = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const mmYYYY = (f: string) => { const d = new Date(f); return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const tasaGerm = (c: Cross) => c.semillas_obtenidas > 0 ? Math.round((c.plantas_germinadas / c.semillas_obtenidas) * 100) : 0;

const CrossesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { crosses, plants, addCross, updateCross, deleteCross, addSeedBatch } = useApp();

  const [madreId, setMadreId] = useState('');
  const [padreId, setPadreId] = useState('');
  const [extras, setExtras] = useState<ExtraParent[]>([]);
  const [extraSel, setExtraSel] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [objetivo, setObjetivo] = useState('');
  const [semillas, setSemillas] = useState('');
  const [germinadas, setGerminadas] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [treeTab, setTreeTab] = useState<'resumen' | 'tabla'>('resumen');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Cross | null>(null);

  useEffect(() => {
    if ((selectedId === null || !crosses.some(c => c.id === selectedId)) && crosses.length > 0) setSelectedId(crosses[0].id);
  }, [crosses, selectedId]);

  const selected = useMemo(() => crosses.find(c => c.id === selectedId) || null, [crosses, selectedId]);
  const madre = plants.find(p => p.id === Number(madreId));
  const padre = plants.find(p => p.id === Number(padreId));

  const stats = useMemo(() => ({
    proceso: crosses.filter(c => c.estado === 'en_proceso').length,
    completas: crosses.filter(c => c.estado === 'completada').length,
    plantas: crosses.reduce((s, c) => s + (c.plantas_germinadas || 0), 0),
  }), [crosses]);

  const germPct = semillas && germinadas && Number(semillas) > 0 ? ((Number(germinadas) / Number(semillas)) * 100).toFixed(1) : null;

  const addExtra = () => {
    const p = plants.find(x => x.id === Number(extraSel));
    if (p && !extras.some(e => e.nombre === p.nombre)) setExtras(prev => [...prev, { id: String(p.id), nombre: p.nombre, especie: p.especie, imagen: p.imagen }]);
    setExtraSel('');
  };

  const resetForm = () => { setMadreId(''); setPadreId(''); setExtras([]); setObjetivo(''); setSemillas(''); setGerminadas(''); setNotas(''); };

  const saveCross = async () => {
    if (saving) return;
    if (!madre || !padre) { alert('⚠️ Selecciona madre y padre'); return; }
    const nombre = `${madre.nombre.split(' ')[0]} × ${padre.nombre.split(' ')[0]} - ${mmYYYY(fecha)}`;
    const data = {
      nombre, madre_nombre: madre.nombre, madre_especie: madre.especie || 'Desconocida',
      padre_nombre: padre.nombre, padre_especie: padre.especie || 'Desconocida',
      padres_extra: extras.map(e => ({ nombre: e.nombre, especie: e.especie })),
      fecha_cruza: fecha, objetivo, notas,
      semillas_obtenidas: semillas ? Number(semillas) : 0, plantas_germinadas: germinadas ? Number(germinadas) : 0,
      estado: 'en_proceso' as const,
    };
    const v = validateData(CrossSchema, data);
    if (!v.success) { alert('❌ ' + v.errors?.join('\n')); return; }
    setSaving(true);
    try {
      const res = await addCross({
        ...v.data!, padres_extra: extras,
        madre_imagen: madre.imagen, padre_imagen: padre.imagen, hibrido_imagen: null,
        fecha_germinacion: null,
      } as any);
      if (res.success) resetForm(); else alert('❌ ' + (res.error || 'No se pudo guardar'));
    } finally { setSaving(false); }
  };

  const startEdit = () => { if (selected) { setEditData({ ...selected }); setEditing(true); } };
  const saveEdit = async () => {
    if (!editData) return;
    const prevSeeds = selected?.semillas_obtenidas || 0;
    await updateCross(editData);
    const justHarvested = editData.semillas_obtenidas > 0 && (prevSeeds === 0 || editData.estado === 'completada');
    setEditing(false);
    if (justHarvested && window.confirm(`¿Enviar estas ${editData.semillas_obtenidas} semillas al Banco de Semillas?`)) {
      const r = await addSeedBatch({ nombre: `${editData.nombre} (Cosecha)`, especie: '', cantidad: editData.semillas_obtenidas, fecha_ingreso: new Date().toISOString(), origen: 'propia', cross_id: editData.id, estado: 'almacenada', notas: `Cosecha de ${editData.nombre}` } as any);
      if (r) navigate('/seed-bank');
    }
  };
  const transferToBank = async () => {
    if (!selected || selected.semillas_obtenidas <= 0) return;
    if (window.confirm(`¿Transferir ${selected.semillas_obtenidas} semillas al Banco?`)) {
      const r = await addSeedBatch({ nombre: `${selected.nombre} (Cosecha)`, especie: '', cantidad: selected.semillas_obtenidas, fecha_ingreso: new Date().toISOString(), origen: 'propia', cross_id: selected.id, estado: 'almacenada', notas: `Transferido desde ${selected.nombre}` } as any);
      if (r) navigate('/seed-bank');
    }
  };

  const ParentNode: React.FC<{ nombre?: string; especie?: string; imagen?: string | null; sex: 'f' | 'm' }> = ({ nombre, especie, imagen, sex }) => (
    <div className="flex items-center gap-3 bg-app-card border border-app-border rounded-2xl p-3 shadow-sm">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
        {imagen ? <img src={imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={especie || ''} size={26} />}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[13px] font-bold text-brand-dark truncate">{nombre} {sex === 'f' ? <Venus size={12} className="text-rose-400" /> : <Mars size={12} className="text-sky-500" />}</p>
        <p className="text-[11px] italic text-brand-dark/45 truncate">{especie}</p>
      </div>
    </div>
  );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-crosses" size={26} />
        </div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Genética y cruzas</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Registra y analiza cruzas para preservar y mejorar tu colección</p>
        </div>
        <button onClick={() => navigate('/pollination')} className="flex items-center gap-2 bg-[#C9A24B]/12 text-[#9a7b2f] rounded-full px-4 py-2 text-[13px] font-bold hover:bg-[#C9A24B]/20 transition-all active:scale-95">
          <Flower2 size={16} /> Plan de polinización
        </button>
        <div className="hidden sm:flex gap-2">
          <Chip value={stats.proceso} label="En proceso" />
          <Chip value={stats.completas} label="Completadas" />
          <Chip value={stats.plantas} label="Plántulas" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Crear nueva cruza ===== */}
        <div className="xl:col-span-5">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-4"><span className="text-[#C9A24B]"><Dna size={15} /></span> Crear nueva cruza</h3>

            <Field label="Madre" icon={<Venus size={13} className="text-rose-400" />}>
              <PlantSelect plants={plants} value={madreId} onChange={setMadreId} placeholder="Seleccionar planta madre" />
            </Field>
            <Field label="Padre" icon={<Mars size={13} className="text-sky-500" />}>
              <PlantSelect plants={plants} value={padreId} onChange={setPadreId} placeholder="Seleccionar planta padre" />
            </Field>

            <Field label="Padres extra (opcional)">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select value={extraSel} onChange={e => setExtraSel(e.target.value)} className="w-full appearance-none h-11 rounded-xl bg-app-card border border-app-border pl-3 pr-9 text-[13px] text-brand-dark focus:outline-none cursor-pointer">
                    <option value="">Seleccionar planta…</option>
                    {plants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                </div>
                <button onClick={addExtra} className="flex items-center gap-1 rounded-xl border border-app-border px-3 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg"><Plus size={14} /> Añadir</button>
              </div>
              {extras.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {extras.map(e => <span key={e.nombre} className="inline-flex items-center gap-1 bg-[#C9A24B]/12 text-brand-dark/70 rounded-full px-2.5 py-1 text-[11.5px] font-semibold">{e.nombre} <button onClick={() => setExtras(p => p.filter(x => x.nombre !== e.nombre))} className="text-brand-dark/40 hover:text-rose-500"><X size={11} /></button></span>)}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de la cruza" icon={<Calendar size={13} className="text-[#C9A24B]" />}>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </Field>
              <Field label="Objetivo" icon={<Target size={13} className="text-[#C9A24B]" />}>
                <div className="relative">
                  <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full appearance-none h-11 rounded-xl bg-app-card border border-app-border pl-3 pr-9 text-[13px] text-brand-dark focus:outline-none cursor-pointer">
                    <option value="">Seleccionar…</option>
                    {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Semillas obtenidas">
                <input type="number" value={semillas} onChange={e => setSemillas(e.target.value)} placeholder="0" className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </Field>
              <Field label={`Semillas germinadas${germPct ? ` (${germPct}%)` : ''}`}>
                <input type="number" value={germinadas} onChange={e => setGerminadas(e.target.value)} placeholder="0" className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </Field>
            </div>

            <Field label="Notas">
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Detalles de la cruza, polinización, etc." className="w-full rounded-xl bg-app-card border border-app-border p-3 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
            </Field>

            <button onClick={saveCross} disabled={saving || !madre || !padre} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-2.5 text-[13.5px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 mt-1">
              {saving ? 'Guardando…' : <><Plus size={16} /> Guardar cruza</>}
            </button>
          </div>
        </div>

        {/* ===== Árbol genealógico ===== */}
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><GitBranch size={15} /></span> Árbol genealógico</h3>
              <div className="flex items-center gap-1 bg-app-bg rounded-full p-1">
                <button onClick={() => setTreeTab('resumen')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${treeTab === 'resumen' ? 'bg-brand-primary text-white' : 'text-brand-dark/55'}`}><Network size={13} /> Resumen</button>
                <button onClick={() => setTreeTab('tabla')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${treeTab === 'tabla' ? 'bg-brand-primary text-white' : 'text-brand-dark/55'}`}><Table2 size={13} /> Tabla</button>
              </div>
            </div>
            <p className="text-[12px] text-brand-dark/45 mb-4">Visualiza el linaje de esta cruza y su descendencia</p>

            {crosses.length === 0 ? (
              <div className="py-14 text-center text-[13px] text-brand-dark/35">Sin cruzas todavía 🧬<br /><span className="text-[12px]">Crea tu primera cruza con el formulario</span></div>
            ) : treeTab === 'resumen' && selected ? (
              <>
                <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                  <ParentNode nombre={selected.madre_nombre} especie={selected.madre_especie} imagen={selected.madre_imagen} sex="f" />
                  <ParentNode nombre={selected.padre_nombre} especie={selected.padre_especie} imagen={selected.padre_imagen} sex="m" />
                </div>
                <div className="flex flex-col items-center my-2">
                  <span className="w-px h-4 bg-app-border" />
                  <span className="w-9 h-9 rounded-full bg-[#C9A24B]/15 text-[#C9A24B] flex items-center justify-center"><Dna size={18} /></span>
                  <span className="w-px h-4 bg-app-border" />
                </div>
                <div className="max-w-md mx-auto bg-brand-primary/[0.05] border border-brand-primary/15 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                    {selected.hibrido_imagen ? <img src={selected.hibrido_imagen} alt="" className="w-full h-full object-cover" /> : <Dna size={22} className="text-brand-primary/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-2 text-[13.5px] font-bold text-brand-dark truncate">{selected.nombre} <span className="text-[9px] font-black bg-[#C9A24B]/20 text-[#9a7b2f] rounded px-1.5 py-0.5">F1</span></p>
                    <p className="text-[11.5px] text-brand-dark/50">{fmtDate(selected.fecha_cruza)} · {selected.semillas_obtenidas} semillas · {selected.plantas_germinadas} germinadas</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${estadoMeta[selected.estado].text}`}><span className={`w-1.5 h-1.5 rounded-full ${estadoMeta[selected.estado].dot}`} /> {estadoMeta[selected.estado].label}</span>
                </div>
                <p className="text-center text-[11px] text-brand-dark/40 mt-3">F1: Primera generación filial directa.</p>
              </>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] uppercase tracking-wider text-brand-dark/40 border-y border-app-border">
                    <th className="font-bold px-3 py-2">Cruza</th><th className="font-bold px-3 py-2 hidden md:table-cell">Madre</th><th className="font-bold px-3 py-2 hidden md:table-cell">Padre</th><th className="font-bold px-3 py-2">Semillas</th><th className="font-bold px-3 py-2">Germ.</th><th className="font-bold px-3 py-2">Estado</th>
                  </tr></thead>
                  <tbody className="divide-y divide-app-border">
                    {crosses.map(c => (
                      <tr key={c.id} onClick={() => { setSelectedId(c.id); setTreeTab('resumen'); }} className={`cursor-pointer ${c.id === selectedId ? 'bg-brand-primary/[0.06]' : 'hover:bg-app-bg/60'}`}>
                        <td className="px-3 py-2.5 text-[12.5px] font-bold text-brand-dark">{c.nombre}</td>
                        <td className="px-3 py-2.5 text-[12px] text-brand-dark/55 hidden md:table-cell">{c.madre_nombre}</td>
                        <td className="px-3 py-2.5 text-[12px] text-brand-dark/55 hidden md:table-cell">{c.padre_nombre}</td>
                        <td className="px-3 py-2.5 text-[12px] text-brand-dark/70">{c.semillas_obtenidas}</td>
                        <td className="px-3 py-2.5 text-[12px] text-brand-dark/70">{c.plantas_germinadas} <span className="text-brand-dark/35">({tasaGerm(c)}%)</span></td>
                        <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${estadoMeta[c.estado].text}`}><span className={`w-1.5 h-1.5 rounded-full ${estadoMeta[c.estado].dot}`} /> {estadoMeta[c.estado].label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detalle de la cruza seleccionada */}
          {selected && (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-accent text-[20px] font-bold text-brand-dark">{selected.nombre}</h3>
                  <p className="text-[12px] text-brand-dark/45">Iniciada el {fmtDate(selected.fecha_cruza)}{selected.objetivo && ` · ${selected.objetivo}`}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1 ${estadoMeta[selected.estado].bg} ${estadoMeta[selected.estado].text}`}><span className={`w-1.5 h-1.5 rounded-full ${estadoMeta[selected.estado].dot}`} /> {estadoMeta[selected.estado].label}</span>
              </div>

              {editing && editData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Semillas obtenidas"><input type="number" value={editData.semillas_obtenidas} onChange={e => setEditData({ ...editData, semillas_obtenidas: Number(e.target.value) })} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" /></Field>
                    <Field label="Semillas germinadas"><input type="number" value={editData.plantas_germinadas} onChange={e => setEditData({ ...editData, plantas_germinadas: Number(e.target.value) })} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" /></Field>
                  </div>
                  <Field label="Estado"><div className="relative"><select value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value as any })} className="w-full appearance-none h-11 rounded-xl bg-app-card border border-app-border pl-3 pr-9 text-[13px] text-brand-dark focus:outline-none cursor-pointer"><option value="en_proceso">En proceso</option><option value="completada">Completada</option><option value="fallida">Fallida</option></select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" /></div></Field>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg">Cancelar</button>
                    <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary text-white py-2.5 text-[13px] font-bold hover:brightness-110"><Check size={15} /> Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <Metric value={selected.semillas_obtenidas} label="Semillas" />
                    <Metric value={selected.plantas_germinadas} label="Germinadas" />
                    <Metric value={`${tasaGerm(selected)}%`} label="Tasa" />
                    <Metric value={Math.floor((Date.now() - new Date(selected.fecha_cruza).getTime()) / 86400000)} label="Días" />
                  </div>
                  {selected.notas && <p className="text-[12.5px] text-brand-dark/60 italic bg-app-bg/50 border border-app-border rounded-xl p-3 mb-4">"{selected.notas}"</p>}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={startEdit} className="flex items-center gap-1.5 rounded-lg bg-app-card border border-app-border px-3 py-2 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg"><Pencil size={14} /> Editar resultados</button>
                    <button onClick={() => navigate(`/genealogy/${selected.id}`)} className="flex items-center gap-1.5 rounded-lg bg-app-card border border-app-border px-3 py-2 text-[12.5px] font-bold text-brand-dark hover:bg-app-bg"><GitBranch size={14} /> Genealogía completa</button>
                    {selected.estado === 'completada' && selected.semillas_obtenidas > 0 && (
                      <button onClick={transferToBank} className="flex items-center gap-1.5 rounded-lg bg-[#C9A24B]/12 text-[#9a7b2f] px-3 py-2 text-[12.5px] font-bold hover:bg-[#C9A24B]/20"><PackagePlus size={14} /> Enviar al banco</button>
                    )}
                    {selected.estado === 'completada' && (
                      <button onClick={() => navigate('/cultivar-gen', { state: { cross: selected } })} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B39226] text-white px-3 py-2 text-[12.5px] font-bold"><Award size={14} /> Registrar cultivar</button>
                    )}
                    <button onClick={() => { if (window.confirm('¿Eliminar esta cruza?')) { deleteCross(selected.id); setSelectedId(null); } }} className="flex items-center gap-1.5 rounded-lg text-rose-500 px-3 py-2 text-[12.5px] font-bold hover:bg-rose-50 ml-auto"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="bg-app-card border border-app-border rounded-xl px-3 py-1.5 text-center min-w-[72px]">
    <p className="text-[16px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9px] font-bold text-brand-dark/45 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="mb-3">
    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-dark/45 mb-1.5">{icon} {label}</label>
    {children}
  </div>
);

const PlantSelect: React.FC<{ plants: any[]; value: string; onChange: (v: string) => void; placeholder: string }> = ({ plants, value, onChange, placeholder }) => {
  const sel = plants.find(p => p.id === Number(value));
  return (
    <div className="relative flex items-center gap-2 h-12 rounded-xl bg-app-card border border-app-border px-2">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
        {sel?.imagen ? <img src={sel.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={sel?.especie || ''} size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        {sel ? <><p className="text-[13px] font-bold text-brand-dark truncate leading-tight">{sel.nombre}</p><p className="text-[10.5px] italic text-brand-dark/45 truncate">{sel.especie}</p></> : <span className="text-[13px] text-brand-dark/35">{placeholder}</span>}
      </div>
      <ChevronDown size={15} className="text-brand-dark/40 shrink-0" />
      <select value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
        <option value="">{placeholder}</option>
        {plants.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.especie}</option>)}
      </select>
    </div>
  );
};

const Metric: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-3 text-center">
    <p className="text-[20px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[10.5px] text-brand-dark/45 mt-1">{label}</p>
  </div>
);

export default CrossesScreen;
