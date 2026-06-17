import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plant } from '../types';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { Flower2, Check, Plus, Venus, Mars, ChevronLeft, Dna, Info } from 'lucide-react';

const fmtMMYYYY = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const temporada = () => {
  const m = new Date().getMonth();
  const s = (m === 11 || m <= 1) ? 'Verano' : m <= 4 ? 'Otoño' : m <= 7 ? 'Invierno' : 'Primavera';
  return `${s} ${new Date().getFullYear()}`;
};
const shortName = (n: string) => n.split(' ')[0];

const Pollination: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, addCross, updatePlant } = useApp();
  const [saving, setSaving] = useState<string | null>(null);

  const flowering = useMemo(() => plants.filter(p => p.en_floracion), [plants]);

  // set de cruzas hechas: "madre|||padre"
  const doneSet = useMemo(() => {
    const s = new Set<string>();
    crosses.forEach(c => s.add(`${c.madre_nombre}|||${c.padre_nombre}`));
    return s;
  }, [crosses]);

  const total = flowering.length * Math.max(0, flowering.length - 1);
  const hechas = useMemo(() => {
    let n = 0;
    for (const madre of flowering) for (const padre of flowering) {
      if (madre.id !== padre.id && doneSet.has(`${madre.nombre}|||${padre.nombre}`)) n++;
    }
    return n;
  }, [flowering, doneSet]);

  const toggleFloracion = (p: Plant) => {
    updatePlant({ ...p, en_floracion: !p.en_floracion, fecha_floracion: !p.en_floracion ? new Date().toISOString() : '' });
  };

  const registrar = async (madre: Plant, padre: Plant) => {
    const key = `${madre.id}-${padre.id}`;
    if (saving) return;
    setSaving(key);
    try {
      await addCross({
        nombre: `${shortName(madre.nombre)} × ${shortName(padre.nombre)} - ${fmtMMYYYY(new Date())}`,
        madre_nombre: madre.nombre, madre_especie: madre.especie || 'Desconocida',
        padre_nombre: padre.nombre, padre_especie: padre.especie || 'Desconocida',
        padres_extra: [], fecha_cruza: new Date().toISOString().split('T')[0], objetivo: '', notas: 'Registrada desde el Plan de polinización',
        semillas_obtenidas: 0, plantas_germinadas: 0, estado: 'en_proceso', fecha_germinacion: null,
        madre_imagen: madre.imagen, padre_imagen: padre.imagen, hibrido_imagen: null,
      } as any);
    } finally { setSaving(null); }
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/crosses')} className="w-9 h-9 rounded-lg border border-app-border bg-app-card flex items-center justify-center text-brand-dark/60 hover:bg-app-bg shrink-0"><ChevronLeft size={18} /></button>
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-crosses" size={26} /></div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Plan de polinización</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Marcá las plantas en floración y registrá las cruzas posibles · {temporada()}</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Chip value={flowering.length} label="En floración" />
          <Chip value={hechas} label="Cruzas hechas" />
          <Chip value={total} label="Posibles" />
        </div>
      </div>

      {/* Selector de plantas en floración */}
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 mb-5">
        <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3"><span className="text-[#C9A24B]"><Flower2 size={15} /></span> Plantas en floración</h3>
        {plants.length === 0 ? (
          <p className="text-[13px] text-brand-dark/40">Todavía no tenés plantas cargadas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {plants.map(p => {
              const on = !!p.en_floracion;
              return (
                <button key={p.id} onClick={() => toggleFloracion(p)}
                  className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-[12.5px] font-semibold transition-all ${on ? 'border-[#C9A24B] bg-[#C9A24B]/12 text-brand-dark' : 'border-app-border text-brand-dark/55 hover:bg-app-bg'}`}>
                  <span className="w-6 h-6 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                    {p.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={p.especie} size={16} />}
                  </span>
                  {shortName(p.nombre)}
                  {on && <Check size={13} className="text-[#9a7b2f]" />}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11.5px] text-brand-dark/40 mt-3 flex items-center gap-1.5"><Info size={13} /> Tocá una planta para marcarla/desmarcarla como en floración esta temporada.</p>
      </div>

      {/* Matriz */}
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><Dna size={15} /></span> Matriz de cruzas</h3>
          <span className="text-[12px] text-brand-dark/45"><b className="text-emerald-600">{hechas}</b> de {total} posibles</span>
        </div>
        <p className="text-[12px] text-brand-dark/45 mb-4">Filas = madre <Venus size={11} className="inline text-rose-400" /> · Columnas = padre <Mars size={11} className="inline text-sky-500" />. Tocá una celda vacía para registrar la cruza.</p>

        {flowering.length < 2 ? (
          <div className="py-12 text-center text-[13px] text-brand-dark/35">Marcá al menos <b className="text-brand-dark/60">2 plantas en floración</b> para ver las cruzas posibles 🌸</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="border-separate" style={{ borderSpacing: '4px' }}>
              <thead>
                <tr>
                  <th className="sticky left-0 bg-app-card z-10 text-left text-[10px] font-bold text-brand-dark/35 px-2 py-1 whitespace-nowrap">♀ madre \ ♂ padre</th>
                  {flowering.map(p => (
                    <th key={p.id} className="px-1 py-1 text-[11px] font-semibold text-brand-dark/70 whitespace-nowrap" title={p.nombre}>{shortName(p.nombre)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flowering.map(madre => (
                  <tr key={madre.id}>
                    <th className="sticky left-0 bg-app-card z-10 text-left text-[12px] font-semibold text-brand-dark px-2 py-1 whitespace-nowrap" title={madre.nombre}>{shortName(madre.nombre)}</th>
                    {flowering.map(padre => {
                      const self = madre.id === padre.id;
                      const done = doneSet.has(`${madre.nombre}|||${padre.nombre}`);
                      const key = `${madre.id}-${padre.id}`;
                      if (self) return <td key={padre.id}><div className="w-[42px] h-[34px] rounded-md bg-app-bg flex items-center justify-center text-brand-dark/25 mx-auto">–</div></td>;
                      if (done) return <td key={padre.id}><div className="w-[42px] h-[34px] rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto"><Check size={16} /></div></td>;
                      return (
                        <td key={padre.id}>
                          <button onClick={() => registrar(madre, padre)} disabled={!!saving}
                            className="w-[42px] h-[34px] rounded-md border border-app-border flex items-center justify-center text-brand-dark/35 hover:bg-[#C9A24B]/10 hover:border-[#C9A24B]/40 hover:text-[#9a7b2f] transition-colors mx-auto disabled:opacity-50"
                            title={`Registrar ${shortName(madre.nombre)} × ${shortName(padre.nombre)}`}>
                            {saving === key ? <span className="w-3.5 h-3.5 border-2 border-[#C9A24B]/40 border-t-[#C9A24B] rounded-full animate-spin" /> : <Plus size={14} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-app-border text-[12px] text-brand-dark/55">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-50 flex items-center justify-center text-emerald-600"><Check size={11} /></span> cruza hecha</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-app-border flex items-center justify-center text-brand-dark/35"><Plus size={10} /></span> posible (tocar para registrar)</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-app-bg" /> misma planta</span>
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="bg-app-card border border-app-border rounded-xl px-3 py-1.5 text-center min-w-[78px]">
    <p className="text-[16px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9px] font-bold text-brand-dark/45 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

export default Pollination;
