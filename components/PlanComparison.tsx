import React from 'react';
import { Icon } from './Icon';
import { PlanType } from '../types';

interface PlanComparisonProps {
    currentPlan: PlanType;
    onClose: () => void;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({ currentPlan, onClose }) => {
    const plans = [
        {
            id: 'basic',
            name: 'Básico',
            subtitle: 'Hobby',
            price: 'Gratis',
            color: 'from-green-500 to-emerald-600',
            borderColor: 'border-green-500/50',
            features: [
                { text: 'Hasta 50 Plantas', included: true, highlight: false },
                { text: 'Diario de Cultivo', included: true, highlight: false },
                { text: 'Gestor de Cruzas', included: true, highlight: false },
                { text: 'Alertas de Riego', included: true, highlight: false },
                { text: 'Backup en la Nube', included: true, highlight: false },
                { text: 'Vivero Online Público', included: true, highlight: false },
                { text: 'Carni Bot (IA)', included: false, highlight: false },
                { text: 'Venta y Mensajería', included: false, highlight: false },
                { text: 'Exportar Inventario', included: false, highlight: false },
            ]
        },
        {
            id: 'pro',
            name: 'PRO',
            subtitle: 'Coleccionista',
            price: '$6.000/mes',
            color: 'from-teal-500 to-emerald-600',
            borderColor: 'border-teal-500/50',
            popular: true,
            features: [
                { text: 'Plantas ILIMITADAS', included: true, highlight: true },
                { text: 'Vivero Online Público', included: true, highlight: false },
                { text: 'Monitor de Clima y Alertas', included: true, highlight: false },
                { text: 'Genealogía Avanzada (Lista)', included: true, highlight: false },
                { text: 'Diario de Cultivo Pro', included: true, highlight: false },
                { text: 'Carni Bot (IA)', included: false, highlight: false },
                { text: 'Tienda Online (Ventas)', included: false, highlight: false },
            ]
        },
        {
            id: 'elite',
            name: 'ELITE',
            subtitle: 'Negocio',
            price: '$14.000/mes',
            color: 'from-indigo-500 to-purple-600',
            borderColor: 'border-indigo-500/50',
            features: [
                { text: 'Todo lo de PRO', included: true, highlight: true },
                { text: 'Carni Bot (IA Experimental)', included: true, highlight: true },
                { text: 'Tienda Completa (Venta/Stock)', included: true, highlight: true },
                { text: 'Árbol Genealógico Visual', included: true, highlight: false },
                { text: 'Etiquetas QR para Macetas', included: true, highlight: false },
                { text: 'Reportes PDF/Excel', included: true, highlight: false },
                { text: 'Soporte Prioritario', included: true, highlight: false },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Planes y Precios</h2>
                        <p className="text-blue-200 text-sm">Elige la potencia que necesita tu colección</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <Icon name="close" className="text-white text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = currentPlan === plan.id;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white/5 border ${plan.borderColor} rounded-2xl p-6 flex flex-col transition-transform hover:scale-[1.02] ${plan.popular ? 'bg-gradient-to-b from-blue-900/20 to-transparent ring-2 ring-blue-500/30' : ''}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                            RECOMENDADO
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className={`text-2xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                                            {plan.name}
                                        </h3>
                                        <p className="text-white/60 text-sm mb-2">{plan.subtitle}</p>
                                        <div className="text-white font-bold text-3xl">{plan.price}</div>
                                    </div>

                                    <div className="space-y-3 flex-1 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-white' : 'text-white/30'}`}>
                                                <Icon
                                                    name={feature.included ? 'check_circle' : 'cancel'}
                                                    className={`text-lg shrink-0 ${feature.included ? (feature.highlight ? 'text-yellow-400' : 'text-green-400') : 'text-white/20'}`}
                                                />
                                                <span className={feature.highlight ? 'font-bold text-yellow-100' : ''}>{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        disabled={isCurrent}
                                        onClick={() => alert("Pasarela de pago próximamente. Contacta a soporte para actualizar manualmente.")}
                                        className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrent
                                            ? 'bg-white/10 text-white/50 cursor-default'
                                            : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg`
                                            }`}
                                    >
                                        {isCurrent ? 'Plan Actual' : 'Mejorar Plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
