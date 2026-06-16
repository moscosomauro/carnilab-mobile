import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { compressImage, uploadImage } from '../utils/imageHelpers';
import { DiaryEntry } from '../types';
import { DiaryEntrySchema, validateData } from '../utils/validationSchemas';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import ImageLightbox from '../components/ImageLightbox';
import {
  CalendarDays, List, BookOpen, ChevronLeft, ChevronRight, ChevronDown, Star,
  Droplets, FlaskConical, Scissors, Eye, BarChart3, Image as ImageIcon, X, Plus,
  Sprout, Leaf, Clock, MoreHorizontal
} from 'lucide-react';

type Tipo = 'riego' | 'fertilizacion' | 'poda' | 'observacion';

const typeConf: Record<Tipo, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  riego: { label: 'Riego', color: '#3B82F6', bg: '#EFF6FF', icon: <Droplets size={14} /> },
  fertilizacion: { label: 'Fertilización', color: '#10B981', bg: '#ECFDF5', icon: <FlaskConical size={14} /> },
  poda: { label: 'Poda', color: '#F97316', bg: '#FFF7ED', icon: <Scissors size={14} /> },
  observacion: { label: 'Observación', color: '#8B5CF6', bg: '#F5F3FF', icon: <Eye size={14} /> },
};

const DOW = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const dayKey = (f: string) => (f || '').slice(0, 10);
const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtTime = (f: string) => /T\d/.test(f) ? new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
const fmtDate = (f: string) => new Date(dayKey(f) + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const DiaryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { diary, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, plants } = useApp();
  const { user } = useAuth();

  const [tab, setTab] = useState<'calendario' | 'lista' | 'bitacora'>('calendario');
  const [plantFilter, setPlantFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'todos' | Tipo>('todos');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [lightbox, setLightbox] = useState<string[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fPlant, setFPlant] = useState('');
  const [fTipo, setFTipo] = useState<Tipo>('riego');
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fTime, setFTime] = useState('09:00');
  const [fDesc, setFDesc] = useState('');
  const [fAltura, setFAltura] = useState('');
  const [fHojas, setFHojas] = useState('');
  const [fImages, setFImages] = useState<string[]>([]);
  const [fFiles, setFFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => diary.filter(e => {
    const mt = typeFilter === 'todos' || e.tipo === typeFilter;
    const mp = plantFilter === 'all' || e.planta_nombre === plantFilter;
    const ms = !search || e.planta_nombre.toLowerCase().includes(search.toLowerCase()) || (e.descripcion || '').toLowerCase().includes(search.toLowerCase());
    return mt && mp && ms;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()), [diary, typeFilter, plantFilter, search]);

  const plantNames = useMemo(() => Array.from(new Set(diary.map(e => e.planta_nombre))), [diary]);

  // ---- Calendario ----
  const monthEntries = useMemo(() => filtered.filter(e => {
    const d = new Date(dayKey(e.fecha) + 'T00:00:00');
    return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
  }), [filtered, cursor]);

  const monthCounts = useMemo(() => {
    const c: Record<string, number> = { riego: 0, fertilizacion: 0, poda: 0, observacion: 0 };
    monthEntries.forEach(e => { c[e.tipo] = (c[e.tipo] || 0) + 1; });
    return c;
  }, [monthEntries]);

  const calCells = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // lunes primero
    const days = new Date(year, month + 1, 0).getDate();
    const cells: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push({ day: d, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    return cells;
  }, [cursor]);

  // ---- Bitácora: agrupar por día ----
  const groupedByDay = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    filtered.forEach(e => { const k = dayKey(e.fecha); if (!map.has(k)) map.set(k, []); map.get(k)!.push(e); });
    return Array.from(map.entries());
  }, [filtered]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const dayLabel = (k: string) => {
    if (k === todayKey) return 'Hoy';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (k === y.toISOString().slice(0, 10)) return 'Ayer';
    return new Date(k + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // ---- Planta destacada / métricas ----
  const featured = useMemo(() => {
    const name = plantFilter !== 'all' ? plantFilter : filtered[0]?.planta_nombre;
    if (!name) return null;
    const plant = plants.find(p => p.nombre === name);
    const entries = diary.filter(e => e.planta_nombre === name).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const alturas = entries.filter(e => e.altura != null);
    return { name, plant, last: entries[0], altura: alturas[0]?.altura, prevAltura: alturas[1]?.altura, hojas: entries.find(e => e.hojas != null)?.hojas };
  }, [plantFilter, filtered, diary, plants]);

  const openLightbox = (imgs: string[], i = 0) => { setLightbox(imgs); setLightboxIdx(i); };
  const entryImages = (e: DiaryEntry) => e.imagenes?.length ? e.imagenes : (e.imagen ? [e.imagen] : []);

  const resetForm = () => { setEditingId(null); setFDesc(''); setFAltura(''); setFHojas(''); setFImages([]); setFFiles([]); };
  const startEdit = (e: DiaryEntry) => {
    const p = plants.find(x => x.nombre === e.planta_nombre);
    setEditingId(e.id); setFPlant(p ? String(p.id) : ''); setFTipo(e.tipo); setFDate(dayKey(e.fecha));
    setFTime(fmtTime(e.fecha) || '09:00'); setFDesc(e.descripcion || ''); setFAltura(e.altura?.toString() || ''); setFHojas(e.hojas?.toString() || '');
    setFImages(entryImages(e)); setFFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) { const prev = await compressImage(files[i]); setFImages(p => [...p, prev]); setFFiles(p => [...p, files[i]]); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    if (saving) return;
    if (!fPlant) { alert('⚠️ Selecciona una planta'); return; }
    if (!fDesc.trim()) { alert('⚠️ Escribe una nota'); return; }
    const plant = plants.find(p => p.id === Number(fPlant));
    const fecha = `${fDate}T${fTime || '00:00'}`;
    const data = {
      planta_nombre: plant?.nombre || 'General', planta_especie: plant?.especie || 'N/A',
      fecha, tipo: fTipo, descripcion: fDesc,
      altura: fAltura ? Number(fAltura) : undefined, hojas: fHojas ? Number(fHojas) : undefined,
    };
    const v = validateData(DiaryEntrySchema, data);
    if (!v.success) { alert('❌ ' + v.errors?.join('\n')); return; }
    setSaving(true);
    try {
      const urls = [...fImages.filter(i => !i.startsWith('data:'))];
      if (user?.key) for (const f of fFiles) { const u = await uploadImage(f, user.key); if (u) urls.push(u); }
      const payload = { ...data, imagen: urls[0] || null, imagenes: urls.length ? urls : undefined };
      const ok = editingId ? await updateDiaryEntry({ ...payload, id: editingId, owner_key: user?.key || '' }) : await addDiaryEntry(payload);
      if (ok) resetForm(); else alert('No se pudo guardar la entrada.');
    } catch (e: any) { alert('Error: ' + (e.message || 'desconocido')); }
    finally { setSaving(false); }
  };

  const monthName = cursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-diary" size={26} />
        </div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Diario de cultivo</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Registra y da seguimiento a todas las actividades de tus plantas</p>
        </div>
      </div>

      {/* Tabs + filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-app-card border border-app-border rounded-full p-1">
          {([['calendario', 'Calendario', <CalendarDays size={15} />], ['lista', 'Lista', <List size={15} />], ['bitacora', 'Bitácora', <BookOpen size={15} />]] as [typeof tab, string, React.ReactNode][]).map(([t, l, ic]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${tab === t ? 'bg-brand-primary text-white' : 'text-brand-dark/55 hover:text-brand-dark'}`}>
              {ic} {l}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select value={plantFilter} onChange={e => setPlantFilter(e.target.value)}
            className="appearance-none bg-app-card border border-app-border rounded-full pl-4 pr-9 py-2 text-[13px] font-semibold text-brand-dark focus:outline-none cursor-pointer">
            <option value="all">Todas las plantas</option>
            {plantNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Vista principal ===== */}
        <div className="xl:col-span-8 space-y-5">
          {tab === 'calendario' && (
            <>
              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 hover:bg-app-bg"><ChevronLeft size={15} /></button>
                    <span className="font-accent text-[18px] font-bold text-brand-dark min-w-[150px] text-center">{cap1(monthName)}</span>
                    <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 hover:bg-app-bg"><ChevronRight size={15} /></button>
                    <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="ml-2 text-[12px] font-bold text-brand-primary/70 hover:text-brand-primary">Hoy</button>
                  </div>
                  <div className="hidden md:flex items-center gap-3">
                    {(Object.keys(typeConf) as Tipo[]).map(t => (
                      <span key={t} className="flex items-center gap-1.5 text-[11px] text-brand-dark/55"><span className="w-2 h-2 rounded-full" style={{ background: typeConf[t].color }} /> {typeConf[t].label}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {DOW.map(d => <div key={d} className="text-center text-[10px] font-bold text-brand-dark/35 uppercase tracking-wide py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calCells.map((cell, i) => {
                    if (!cell) return <div key={i} className="aspect-[1/0.9] rounded-lg bg-app-bg/30" />;
                    const dayEntries = monthEntries.filter(e => dayKey(e.fecha) === cell.dateStr);
                    const isToday = cell.dateStr === todayKey;
                    return (
                      <div key={i} className={`aspect-[1/0.9] rounded-lg border p-1.5 overflow-hidden ${isToday ? 'border-brand-primary/40 bg-brand-primary/[0.04]' : 'border-app-border bg-app-card'}`}>
                        <span className={`text-[11px] font-bold ${isToday ? 'text-brand-primary' : 'text-brand-dark/50'}`}>{cell.day}</span>
                        <div className="space-y-0.5 mt-0.5">
                          {dayEntries.slice(0, 2).map(e => (
                            <div key={e.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold truncate" style={{ background: typeConf[e.tipo].bg, color: typeConf[e.tipo].color }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeConf[e.tipo].color }} />
                              {typeConf[e.tipo].label}{fmtTime(e.fecha) && ` ${fmtTime(e.fecha)}`}
                            </div>
                          ))}
                          {dayEntries.length > 2 && <div className="text-[9px] text-brand-dark/40 pl-1">+{dayEntries.length - 2} más</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-app-border">
                  {(Object.keys(typeConf) as Tipo[]).map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-[12px] text-brand-dark/60"><span className="w-2 h-2 rounded-full" style={{ background: typeConf[t].color }} /> {typeConf[t].label} <b className="text-brand-dark">{monthCounts[t]}</b></span>
                  ))}
                  <span className="ml-auto text-[12px] text-brand-dark/45">Total: {monthEntries.length} actividades</span>
                </div>
              </div>

              {/* Entrada reciente */}
              {filtered[0] && <RecentCard e={filtered[0]} plants={plants} onView={() => setTab('bitacora')} openLightbox={openLightbox} />}
            </>
          )}

          {tab === 'lista' && (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] divide-y divide-app-border">
              {filtered.length === 0 && <p className="py-14 text-center text-[13px] text-brand-dark/35">No hay registros 📖</p>}
              {filtered.map(e => {
                const c = typeConf[e.tipo]; const imgs = entryImages(e);
                return (
                  <div key={e.id} className="flex gap-4 p-4">
                    <div className="w-11 h-11 rounded-xl border-2 flex items-center justify-center shrink-0 text-white" style={{ borderColor: c.color, background: c.color }}>{c.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-brand-dark truncate">{e.planta_nombre} <span className="text-[11px] font-semibold ml-1" style={{ color: c.color }}>{c.label}</span></p>
                        <span className="text-[11px] text-brand-dark/40 shrink-0">{fmtDate(e.fecha)} {fmtTime(e.fecha)}</span>
                      </div>
                      <p className="text-[12.5px] text-brand-dark/60 mt-0.5">{e.descripcion}</p>
                      {(e.altura != null || e.hojas != null) && (
                        <div className="flex gap-2 mt-2">
                          {e.altura != null && <span className="text-[10.5px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/60">📏 {e.altura} cm</span>}
                          {e.hojas != null && <span className="text-[10.5px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/60">🍃 {e.hojas}</span>}
                        </div>
                      )}
                      {imgs.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {imgs.slice(0, 4).map((src, i) => (
                            <button key={i} onClick={() => openLightbox(imgs, i)} className="w-12 h-12 rounded-lg overflow-hidden border border-app-border"><img src={src} alt="" className="w-full h-full object-cover" /></button>
                          ))}
                          {imgs.length > 4 && <span className="w-12 h-12 rounded-lg bg-app-bg flex items-center justify-center text-[11px] font-bold text-brand-dark/50">+{imgs.length - 4}</span>}
                        </div>
                      )}
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => startEdit(e)} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary">Editar</button>
                        <button onClick={() => { if (confirm('¿Eliminar entrada?')) deleteDiaryEntry(e.id); }} className="text-[11px] font-bold text-rose-500/80 hover:text-rose-600">Borrar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'bitacora' && (
            <div className="space-y-6">
              {groupedByDay.length === 0 && <p className="py-14 text-center text-[13px] text-brand-dark/35 bg-app-card border border-app-border rounded-2xl">No hay registros 📖</p>}
              {groupedByDay.map(([k, entries]) => (
                <div key={k}>
                  <p className="text-[12px] font-bold text-brand-dark/45 mb-2">{cap1(dayLabel(k))} <span className="text-brand-dark/30">— {new Date(k + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  <div className="relative pl-5 border-l border-app-border space-y-3">
                    {entries.map(e => {
                      const c = typeConf[e.tipo]; const p = plants.find(x => x.nombre === e.planta_nombre); const imgs = entryImages(e);
                      return (
                        <div key={e.id} className="relative bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 flex gap-4">
                          <span className="absolute -left-[26px] top-5 w-3 h-3 rounded-full border-2 border-app-card" style={{ background: c.color }} />
                          <span className="text-[11px] text-brand-dark/45 w-12 shrink-0 pt-1">{fmtTime(e.fecha) || '—'}</span>
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-app-border bg-app-bg shrink-0 flex items-center justify-center">
                            {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={e.planta_especie} size={28} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13.5px] font-bold text-brand-dark truncate">{e.planta_nombre}</p>
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: c.bg, color: c.color }}>{c.icon} {c.label}</span>
                            </div>
                            <p className="text-[11.5px] italic text-brand-dark/45">{e.planta_especie}</p>
                            <p className="text-[12.5px] text-brand-dark/65 mt-1">{e.descripcion}</p>
                          </div>
                          <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-24">
                            {e.altura != null && <span className="text-[11px] text-brand-dark/55">Altura <b className="text-brand-dark">{e.altura} cm</b></span>}
                            {e.hojas != null && <span className="text-[11px] text-brand-dark/55">Hojas <b className="text-brand-dark">{e.hojas}</b></span>}
                          </div>
                          {imgs.length > 0 && (
                            <div className="hidden lg:flex gap-1 shrink-0">
                              {imgs.slice(0, 2).map((src, i) => <button key={i} onClick={() => openLightbox(imgs, i)} className="w-11 h-11 rounded-lg overflow-hidden border border-app-border"><img src={src} alt="" className="w-full h-full object-cover" /></button>)}
                              {imgs.length > 2 && <span className="w-11 h-11 rounded-lg bg-app-bg flex items-center justify-center text-[10px] font-bold text-brand-dark/50">+{imgs.length - 2}</span>}
                            </div>
                          )}
                          <button onClick={() => startEdit(e)} className="absolute top-3 right-3 text-brand-dark/30 hover:text-brand-dark/60"><MoreHorizontal size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Columna derecha ===== */}
        <div className="xl:col-span-4 space-y-5">
          {/* Nueva entrada */}
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 xl:sticky xl:top-20">
            <div className="flex items-center justify-between mb-3">
              <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary">
                <span className="text-[#C9A24B]"><Sprout size={14} /></span> {editingId ? 'Editar entrada' : 'Nueva entrada'}
              </p>
              {editingId && <button onClick={resetForm} className="text-[11px] font-bold text-brand-dark/40 hover:text-brand-dark">Cancelar edición</button>}
            </div>

            <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Planta</label>
            <div className="relative mb-3">
              <select value={fPlant} onChange={e => setFPlant(e.target.value)} className="w-full appearance-none h-11 rounded-xl bg-app-card border border-app-border pl-3 pr-9 text-[13.5px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer">
                <option value="">Seleccionar planta</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
            </div>

            <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Tipo de entrada</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(typeConf) as Tipo[]).map(t => {
                const c = typeConf[t]; const active = fTipo === t;
                return (
                  <button key={t} onClick={() => setFTipo(t)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition-all"
                    style={active ? { borderColor: c.color, background: c.bg, color: c.color } : { borderColor: 'var(--color-app-border)', color: 'var(--color-brand-dark)' }}>
                    <span style={{ color: c.color }}>{c.icon}</span> {c.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Fecha</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Hora</label>
                <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
            </div>

            <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Notas</label>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2} placeholder="Detalles del registro…" className="w-full rounded-xl bg-app-card border border-app-border p-3 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none mb-3" />

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Altura (cm)</label>
                <input type="number" value={fAltura} onChange={e => setFAltura(e.target.value)} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Hojas</label>
                <input type="number" value={fHojas} onChange={e => setFHojas(e.target.value)} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
            </div>

            <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={e => onFiles(e.target.files)} />
            <div className="flex gap-2 mb-3 flex-wrap">
              {fImages.map((src, i) => (
                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-app-border group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => { setFImages(p => p.filter((_, x) => x !== i)); setFFiles(p => p.filter((_, x) => x !== i)); }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={9} /></button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} className="w-14 h-14 rounded-lg border border-dashed border-app-border flex items-center justify-center text-brand-dark/40 hover:bg-app-bg"><ImageIcon size={18} /></button>
            </div>

            <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-2.5 text-[13.5px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">
              {saving ? 'Guardando…' : <>{editingId ? 'Actualizar entrada' : 'Guardar entrada'}</>}
            </button>
          </div>

          {/* Resumen de actividad */}
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><BarChart3 size={14} /></span> Resumen de actividad</p>
              <span className="text-[11px] text-brand-dark/40">{cap1(monthName)}</span>
            </div>
            <div className="space-y-2">
              {(Object.keys(typeConf) as Tipo[]).map(t => (
                <div key={t} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-brand-dark/65"><span style={{ color: typeConf[t].color }}>{typeConf[t].icon}</span> {typeConf[t].label}</span>
                  <b className="text-brand-dark">{monthCounts[t]}</b>
                </div>
              ))}
              <div className="flex items-center justify-between text-[13px] pt-2 border-t border-app-border">
                <span className="text-brand-dark/45">Total de entradas</span><b className="text-brand-dark">{monthEntries.length}</b>
              </div>
            </div>
          </div>

          {/* Planta destacada */}
          {featured && (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><Leaf size={14} /></span> Planta destacada</p>
                {featured.plant && <button onClick={() => navigate(`/plant/${featured.plant!.id}`)} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary">Ver detalles</button>}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-app-border bg-app-bg shrink-0 flex items-center justify-center">
                  {featured.plant?.imagen ? <img src={featured.plant.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={featured.plant?.especie || ''} size={32} />}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[14px] font-bold text-brand-dark truncate">{featured.name} <Star size={12} className="text-[#C9A24B]/50" /></p>
                  <p className="text-[11.5px] italic text-brand-dark/45 truncate">{featured.plant?.especie}</p>
                  {featured.altura != null && (
                    <p className="text-[12px] text-brand-dark/55 mt-0.5">Altura actual <b className="text-brand-dark">{featured.altura} cm</b>
                      {featured.prevAltura != null && featured.altura > featured.prevAltura && <span className="text-emerald-600 font-semibold ml-1">+{(featured.altura - featured.prevAltura).toFixed(1)} cm</span>}
                    </p>
                  )}
                </div>
              </div>
              {featured.last && (
                <p className="text-[11.5px] text-brand-dark/45 mt-3 pt-3 border-t border-app-border flex items-center gap-1.5">
                  <Clock size={12} /> Última actividad: {fmtDate(featured.last.fecha)}
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ml-1" style={{ background: typeConf[featured.last.tipo].bg, color: typeConf[featured.last.tipo].color }}>{typeConf[featured.last.tipo].label}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {lightbox && <ImageLightbox images={lightbox} initialIndex={lightboxIdx} onClose={() => setLightbox(null)} />}
    </div>
  );
};

const RecentCard: React.FC<{ e: DiaryEntry; plants: any[]; onView: () => void; openLightbox: (i: string[], n?: number) => void }> = ({ e, plants, onView, openLightbox }) => {
  const c = typeConf[e.tipo]; const p = plants.find((x: any) => x.nombre === e.planta_nombre);
  const imgs = e.imagenes?.length ? e.imagenes : (e.imagen ? [e.imagen] : []);
  return (
    <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold" style={{ background: c.bg, color: c.color }}>{c.icon} Entrada reciente · {c.label}</span>
        <button onClick={onView} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary">Ver en bitácora</button>
      </div>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-app-border bg-app-bg shrink-0 flex items-center justify-center">
          {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={e.planta_especie} size={36} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1 text-[15px] font-bold text-brand-dark">{e.planta_nombre} <Star size={13} className="text-[#C9A24B]/50" /></p>
          <p className="text-[12px] italic text-brand-dark/45">{e.planta_especie}</p>
          <p className="text-[11.5px] text-brand-dark/40 mt-0.5">{fmtDate(e.fecha)} {fmtTime(e.fecha) && `· ${fmtTime(e.fecha)}`}</p>
          <p className="text-[12.5px] text-brand-dark/65 mt-1">{e.descripcion}</p>
        </div>
        {imgs.length > 0 && (
          <div className="hidden sm:flex gap-1.5 shrink-0">
            {imgs.slice(0, 3).map((src, i) => <button key={i} onClick={() => openLightbox(imgs, i)} className="w-14 h-14 rounded-lg overflow-hidden border border-app-border"><img src={src} alt="" className="w-full h-full object-cover" /></button>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryScreen;
