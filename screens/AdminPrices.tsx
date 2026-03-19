
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icon'; // Assuming you have a generic Icon component

const AdminPrices: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuth(); // Auth handled by AdminRoute
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        const { data } = await supabase.from('plans').select('*').order('price_monthly');
        if (data) setPlans(data.filter(p => p.id !== 'basic'));
        setLoading(false);
    };

    const handleUpdatePrice = (id: string, field: 'price_monthly' | 'price_annual', value: string) => {
        const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: numValue } : p));
    };

    const savePlan = async (plan: any) => {
        const { error } = await supabase.from('plans').update({
            price_monthly: plan.price_monthly,
            price_annual: plan.price_annual
        }).eq('id', plan.id);

        if (error) alert("Error saving price");
        else alert(`Precio de ${plan.name} actualizado!`);
    };

    const getPlanStyle = (p: string) => {
        switch (p) {
            case 'elite': return 'border-purple-500/50 text-purple-300 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
            case 'pro': return 'border-blue-500/50 text-blue-300 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
            default: return 'border-green-500/50 text-green-300 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex justify-center font-display text-white">
            <div className="relative z-10 w-full max-w-md px-6 pt-10 pb-32">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Icon name="arrow_back" className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">Control de Precios</h1>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Gestión de Tarifas</p>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3">
                    <div className="text-blue-400 text-xl">ℹ️</div>
                    <div>
                        <p className="text-xs font-bold text-blue-200 mb-1">Impacto Inmediato</p>
                        <p className="text-[10px] text-blue-200/60 leading-relaxed">
                            Los cambios que realices aquí se reflejarán instantáneamente en la app de todos los usuarios.
                            Asegúrate de revisar bien los montos antes de guardar.
                        </p>
                    </div>
                </div>

                {/* Plans List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center text-white/30 text-xs animate-pulse">Cargando datos...</div>
                    ) : (
                        plans.map(p => (
                            <div key={p.id} className="bg-white/5 border border-white/10 rounded-[24px] p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon name="attach_money" className="text-6xl text-white" />
                                </div>

                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg border ${getPlanStyle(p.id)}`}>
                                        {p.name}
                                    </span>
                                    <button
                                        onClick={() => savePlan(p)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    {/* Monthly */}
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="text-[9px] text-white/40 uppercase font-black block mb-2">Mensual</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-serif italic">$</span>
                                            <input
                                                type="number"
                                                value={p.price_monthly}
                                                onChange={(e) => handleUpdatePrice(p.id, 'price_monthly', e.target.value)}
                                                className="w-full bg-transparent text-white font-bold text-sm pl-6 outline-none placeholder-white/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Annual */}
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="text-[9px] text-white/40 uppercase font-black block mb-2">Anual</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-serif italic">$</span>
                                            <input
                                                type="number"
                                                value={p.price_annual}
                                                onChange={(e) => handleUpdatePrice(p.id, 'price_annual', e.target.value)}
                                                className="w-full bg-transparent text-white font-bold text-sm pl-6 outline-none placeholder-white/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminPrices;
