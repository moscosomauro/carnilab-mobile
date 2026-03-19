import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { SeedBatch } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM ICONS ---
const IconSeed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    <path d="M12 2v4" /><path d="M12 18v4" />
  </svg>
);

const SeedBankScreen: React.FC = () => {
    const navigate = useNavigate();
    const { seedBank, addSeedBatch, updateSeedBatch, deleteSeedBatch, addPlant } = useApp();
    const [filter, setFilter] = useState<'all' | 'almacenada' | 'estratificando'>('all');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState<SeedBatch | null>(null);
    const [showActionModal, setShowActionModal] = useState<SeedBatch | null>(null);
    const [showStratifyModal, setShowStratifyModal] = useState<SeedBatch | null>(null);

    // Form Logic
    const [formData, setFormData] = useState({
        nombre: '', especie: '', cantidad: 0, origen: 'externa' as 'propia'|'externa', notas: ''
    });
    const [stratWeeks, setStratWeeks] = useState(6);

    const handleOpenAdd = (batch?: SeedBatch) => {
        if (batch) {
            setEditingBatch(batch);
            setFormData({
                nombre: batch.nombre, especie: batch.especie || '', cantidad: batch.cantidad, origen: batch.origen, notas: batch.notas || ''
            });
        } else {
            setEditingBatch(null);
            setFormData({ nombre: '', especie: '', cantidad: 0, origen: 'externa', notas: '' });
        }
        setShowAddModal(true);
    };

    const handleSaveBatch = async () => {
        if (!formData.nombre || formData.cantidad <= 0) return alert('Nombre y cantidad obligatorios');

        let result: boolean;
        if (editingBatch) {
            result = await updateSeedBatch({ ...editingBatch, ...formData });
        } else {
            result = await addSeedBatch({
                ...formData,
                fecha_ingreso: new Date().toISOString(),
                estado: 'almacenada'
            });
        }

        if (result) {
            setShowAddModal(false);
        } else {
            alert('❌ Error al guardar. Revisar consola para más detalles.');
        }
    };

    const handleStartStratification = async () => {
        if (!showStratifyModal) return;
        const now = new Date();
        const end = new Date(now.getTime() + stratWeeks * 7 * 24 * 60 * 60 * 1000);

        const result = await updateSeedBatch({
            ...showStratifyModal,
            estado: 'estratificando',
            inicio_estratificacion: now.toISOString(),
            fin_estratificacion: end.toISOString()
        });

        if (result) {
            // CERRAR MODAL EXPLÍCITAMENTE
            setShowStratifyModal(null);
        } else {
            alert('❌ Error al iniciar estratificación. Revisar consola para más detalles.');
        }
    };

    // MOCK DATA PARA PROBAR UI MIENTRAS SE CONECTA
    // const seedBankStr = [...seedBank];
    const displayBatches = useMemo(() => {
        if (filter === 'all') return seedBank;
        return seedBank.filter(b => b.estado === filter);
    }, [seedBank, filter]);

    const calculateStratificationProgress = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return 0;
        const startDate = new Date(start).getTime();
        const endDate = new Date(end).getTime();
        const now = new Date().getTime();
        
        if (now <= startDate) return 0;
        if (now >= endDate) return 100;
        
        return Math.round(((now - startDate) / (endDate - startDate)) * 100);
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB] dark:bg-slate-900 font-display pb-32 transition-colors duration-500 relative">
            {/* Textura Papel Kraft */}
            <div 
                className="fixed inset-0 opacity-[0.15] dark:opacity-5 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")' }}
            />

            {/* HEADER */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl sticky top-0 z-20 border-b border-[#4A5D4F]/10 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between p-4 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-[#F5F7F5] dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] dark:hover:bg-slate-600 transition-colors text-[#4A5D4F] dark:text-slate-300"
                        >
                            <Icon name="arrow_back" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-[#2E2E2E] dark:text-white leading-tight flex items-center gap-2">
                                Banco de Semillas
                            </h1>
                            <p className="text-[11px] font-bold text-[#8E877F] dark:text-slate-400 uppercase tracking-widest">{seedBank.length} Lotes Guardados</p>
                        </div>
                    </div>
                </div>
                
                {/* TABS */}
                <div className="flex px-4 pb-0 max-w-5xl mx-auto gap-4 overflow-x-auto no-scrollbar mask-fade-edges">
                    {(['all', 'almacenada', 'estratificando'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-3 text-sm font-black uppercase tracking-widest relative whitespace-nowrap transition-colors ${filter === tab ? 'text-[#4A5D4F] dark:text-white' : 'text-[#8E877F] dark:text-slate-400'}`}
                        >
                            {tab === 'all' ? 'Todo' : tab}
                            {filter === tab && (
                                <motion.div layoutId="seedbankTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A5D4F] dark:bg-slate-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="p-4 max-w-5xl mx-auto relative z-10 pt-6">
                
                <AnimatePresence>
                    {displayBatches.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-white/40 dark:bg-slate-800/40 border border-dashed border-[#4A5D4F]/20 dark:border-slate-600 rounded-[32px] p-8 text-center flex flex-col items-center justify-center mt-10 min-h-[200px]"
                        >
                            <span className="text-4xl opacity-50 mb-4 grayscale">🌰</span>
                            <h3 className="text-lg font-black text-[#2E2E2E] dark:text-white mb-2">Inventario Vacío</h3>
                            <p className="text-sm font-medium text-[#8E877F] dark:text-slate-400 max-w-xs">No hay lotes de semillas aquí. Extrae semillas de tus híbridos cosechados o añade uno nuevo.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayBatches.map(batch => {
                                const isStrat = batch.estado === 'estratificando';
                                const progress = isStrat ? calculateStratificationProgress(batch.inicio_estratificacion, batch.fin_estratificacion) : 0;
                                
                                return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={batch.id}
                                    className="bg-[#D3C1A1]/10 dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-[#4A5D4F]/10 dark:border-slate-700 relative overflow-hidden group"
                                >
                                    {/* Sello de Kraft */}
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#E2D4B7]/40 dark:bg-slate-700/50 rounded-full blur-xl pointer-events-none" />

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-[#EFEBE4] dark:bg-slate-900 flex items-center justify-center text-[#8E7C4B] border border-[#D3C1A1]/30 dark:border-slate-600">
                                                <IconSeed />
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${batch.origen === 'propia' ? 'bg-[#CDE8B5] text-[#4A5D4F] dark:bg-[#CDE8B5]/20' : 'bg-[#E5E7EB] text-[#4B5563] dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {batch.origen.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm text-sm font-black text-[#4A5D4F] dark:text-white border border-[#F5F1EB] dark:border-slate-700 flex items-center gap-1">
                                            {batch.cantidad} <span className="text-[10px] text-[#8E877F] dark:text-slate-400">UNID</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mb-4">
                                        <h3 className="text-xl font-black text-[#2E2E2E] dark:text-white leading-tight mb-1">{batch.nombre}</h3>
                                        <p className="text-xs font-bold text-[#8E877F] dark:text-slate-400 flex items-center gap-1">
                                            <Icon name="calendar_today" className="text-[12px]" /> Ingreso: {new Date(batch.fecha_ingreso).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Estratificación Visualizer */}
                                    {isStrat ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/50 mb-4 relative overflow-hidden">
                                            <div className="flex justify-between items-center mb-2 z-10 relative">
                                                <span className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest flex items-center gap-1">
                                                    <Icon name="ac_unit" className="text-[14px]" /> Estratificando
                                                </span>
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden z-10 relative">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold text-blue-500/70 dark:text-blue-400/70 mt-2 z-10 relative">
                                                Fin estimado: {batch.fin_estratificacion ? new Date(batch.fin_estratificacion).toLocaleDateString() : '?'}
                                            </p>
                                            
                                            {/* Snowflake decos */}
                                            <Icon name="ac_unit" className="absolute -right-2 -bottom-2 text-6xl text-blue-500/5 dark:text-blue-400/5 z-0" />
                                        </div>
                                    ) : (
                                        <div className="h-10 mb-4"></div> // Spacer
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 relative z-10">
                                        {!isStrat && batch.estado === 'almacenada' && (
                                            <button 
                                                onClick={() => setShowStratifyModal(batch)}
                                                className="flex-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs py-2 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors"
                                            >
                                                <Icon name="ac_unit" className="text-[14px]" /> Frío
                                            </button>
                                        )}
                                        {isStrat && (
                                            <button
                                                onClick={async () => {
                                                    // Stop stratification
                                                    const result = await updateSeedBatch({ ...batch, estado: 'almacenada', inicio_estratificacion: null, fin_estratificacion: null });
                                                    if (!result) alert('❌ Error al detener estratificación');
                                                }}
                                                className="flex-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-xs py-2 rounded-xl border border-orange-200 dark:border-orange-800/50 flex items-center justify-center gap-1 hover:bg-orange-200 transition-colors"
                                            >
                                                Detener
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (batch.cantidad < 10) return alert('No tienes suficientes semillas para este lote');
                                                
                                                if (window.confirm(`¿Sembrar 10 semillas de "${batch.nombre}" y crear un nuevo Lote de Germinación en tu inventario?`)) {
                                                    console.log('[SeedBank] Iniciando siembra para:', batch.nombre);
                                                    const result = await updateSeedBatch({ ...batch, cantidad: batch.cantidad - 10 });
                                                    console.log('[SeedBank] Resultado updateSeedBatch:', result);
                                                    
                                                    if (result) {
                                                        console.log('[SeedBank] Intentando crear planta en inventario...');
                                                        const newPlant = await addPlant({
                                                            nombre: `Lote Germinación: ${batch.nombre}`,
                                                            especie: batch.especie || 'Desconocida',
                                                            fecha_adquisicion: new Date().toISOString().split('T')[0],
                                                            estado: 'saludable',
                                                            imagen: null,
                                                            notas: `Semillas sembradas desde el Banco de Semillas. Lote original: ${batch.nombre}.`,
                                                            origen: batch.origen === 'propia' ? 'Cruza Propia' : 'Compra Externa',
                                                            ubicacion: 'Semillero / Germinador'
                                                        });
                                                        
                                                        console.log('[SeedBank] Resultado addPlant:', newPlant);
                                                        
                                                        if (newPlant) {
                                                            alert('✅ 10 Semillas sembradas. Se ha creado un "Lote Germinación" en tu Inventario de Plantas.');
                                                        } else {
                                                            alert('❌ Se descontaron las semillas pero falló la creación del lote en el inventario. Revisa la consola.');
                                                        }
                                                    } else {
                                                        alert('❌ Error al actualizar cantidad de semillas.');
                                                    }
                                                }
                                            }}
                                            className="flex-1 bg-white dark:bg-slate-700 text-[#4A5D4F] dark:text-slate-200 font-bold text-xs py-2 rounded-xl border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center gap-1 hover:bg-[#F5F7F5] transition-colors"
                                        >
                                            <span className="text-[16px]">🌱</span> Sembrar 10x
                                        </button>
                                    </div>
                                    
                                    {/* Edit trigger */}
                                    <button 
                                        onClick={() => setShowActionModal(batch)}
                                        className="absolute top-4 right-4 text-[#8E877F] dark:text-slate-500 hover:text-[#4A5D4F] dark:hover:text-slate-300 transition-colors z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <Icon name="more_vert" />
                                    </button>
                                </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* FAB Add */}
            <div className="fixed bottom-24 right-6 z-40">
                <button 
                    onClick={() => handleOpenAdd()} 
                    className="w-14 h-14 bg-[#4A5D4F] rounded-full shadow-[0_10px_25px_rgba(74,93,79,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform hover:rotate-90 duration-300 border-[3px] border-white dark:border-slate-800"
                >
                    <Icon name="add" className="text-2xl" />
                </button>
            </div>

            {/* MODAL AGREGAR / EDITAR */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#F5F1EB] dark:bg-slate-900 w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-black text-[#2E2E2E] dark:text-white mb-4">{editingBatch ? 'Editar Lote' : 'Añadir Semillas'}</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#8E877F] dark:text-slate-400">Nombre del Lote / Cruza *</label>
                                    <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#D3C1A1]/30 dark:border-slate-700 outline-none text-[#2E2E2E] dark:text-white" placeholder="Ej: Nepenthes x Alata" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[#8E877F] dark:text-slate-400">Cantidad Aprox. *</label>
                                        <input type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: Number(e.target.value)})} className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#D3C1A1]/30 dark:border-slate-700 outline-none text-[#2E2E2E] dark:text-white text-center font-black" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#8E877F] dark:text-slate-400">Origen</label>
                                        <select value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value as any})} className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#D3C1A1]/30 dark:border-slate-700 outline-none text-[#2E2E2E] dark:text-white">
                                            <option value="externa">Comprada/Externa</option>
                                            <option value="propia">Cruza Propia</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.origen === 'externa' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                        <label className="text-xs font-bold text-[#8E877F] dark:text-slate-400">¿De dónde provienen? (Opcional)</label>
                                        <input type="text" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#D3C1A1]/30 dark:border-slate-700 outline-none text-[#2E2E2E] dark:text-white" placeholder="Ej: Compradas a CarniLab" />
                                    </motion.div>
                                )}
                                
                                <button onClick={handleSaveBatch} className="w-full py-3 bg-[#4A5D4F] text-white rounded-2xl font-black mt-6 hover:bg-[#3d4b40] transition-colors">{editingBatch ? 'Guardar Cambios' : 'Añadir al Banco'}</button>
                                <button onClick={() => setShowAddModal(false)} className="w-full py-3 text-[#8E877F] dark:text-slate-400 font-bold hover:text-[#2E2E2E] dark:hover:text-white transition-colors">Cancelar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL ACTION MENU */}
            <AnimatePresence>
                {showActionModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowActionModal(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 w-full sm:max-w-xs p-2 rounded-3xl shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { handleOpenAdd(showActionModal); setShowActionModal(null); }} className="w-full p-4 text-left font-bold text-[#2E2E2E] dark:text-white hover:bg-[#F5F1EB] dark:hover:bg-slate-800 rounded-2xl flex items-center gap-3">
                                <Icon name="edit" /> Editar Lote
                            </button>
                            <button onClick={async () => {
                                if(window.confirm('¿Eliminar este lote?')) {
                                    await deleteSeedBatch(showActionModal.id);
                                }
                                setShowActionModal(null);
                            }} className="w-full p-4 text-left font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl flex items-center gap-3">
                                <Icon name="delete" /> Eliminar Permanente
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL STRATIFY CONFIG */}
            <AnimatePresence>
                {showStratifyModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-blue-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowStratifyModal(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[32px] shadow-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-500 text-3xl mb-4">
                                <Icon name="ac_unit" />
                            </div>
                            <h2 className="text-xl font-black text-[#2E2E2E] dark:text-white mb-2 text-center">Estratificación en Frío</h2>
                            <p className="text-sm font-medium text-[#8E877F] dark:text-slate-400 text-center mb-6">Iniciando proceso para {showStratifyModal.nombre}. ¿Cuánto tiempo deben estar en frío?</p>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <button onClick={() => setStratWeeks(Math.max(1, stratWeeks - 1))} className="w-10 h-10 rounded-full bg-[#F5F1EB] dark:bg-slate-800 flex items-center justify-center text-[#2E2E2E] dark:text-white font-bold hover:bg-[#EAE5DF] dark:hover:bg-slate-700">-</button>
                                <span className="text-2xl font-black text-[#2E2E2E] dark:text-white text-center min-w-[3rem]">{stratWeeks} <span className="text-xs block text-[#8E877F] dark:text-slate-400 uppercase tracking-widest mt-1">Semanas</span></span>
                                <button onClick={() => setStratWeeks(stratWeeks + 1)} className="w-10 h-10 rounded-full bg-[#F5F1EB] dark:bg-slate-800 flex items-center justify-center text-[#2E2E2E] dark:text-white font-bold hover:bg-[#EAE5DF] dark:hover:bg-slate-700">+</button>
                            </div>

                            <button onClick={handleStartStratification} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black transition-colors shadow-lg shadow-blue-500/30">
                                Iniciar Estratificación
                            </button>
                            <button onClick={() => setShowStratifyModal(null)} className="w-full mt-2 py-3 text-[#8E877F] dark:text-slate-400 font-bold hover:text-[#2E2E2E] dark:hover:text-white transition-colors">
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SeedBankScreen;
