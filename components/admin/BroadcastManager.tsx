import React, { useState } from 'react';
import { useBroadcast } from '../../context/BroadcastContext';
import { supabase } from '../../supabaseClient';
import { X, Send, Trash2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { SystemMessage } from '../../types';

interface BroadcastManagerProps {
    onClose: () => void;
}

export const BroadcastManager: React.FC<BroadcastManagerProps> = ({ onClose }) => {
    const { activeBroadcasts, refreshBroadcasts } = useBroadcast();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<SystemMessage['type']>('info');
    const [duration, setDuration] = useState('24'); // hours
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!title || !message) return;
        setLoading(true);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

        try {
            // Use RPC to bypass RLS for Backdoor Admin
            const { error } = await supabase.rpc('send_broadcast', {
                p_title: title,
                p_message: message,
                p_type: type,
                p_expires_at: expiresAt.toISOString()
            });

            if (error) throw error;

            setTitle('');
            setMessage('');
            await refreshBroadcasts();
        } catch (e) {
            console.error('Error sending broadcast:', e);
            alert('Error sending broadcast');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Detener este mensaje?')) return;
        try {
            const { error } = await supabase.rpc('stop_broadcast', { p_id: id });
            if (error) console.error(error);
            await refreshBroadcasts();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e1e2d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Send className="text-indigo-400 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Centro de Difusión</h2>
                            <p className="text-sm text-white/50">Enviar mensajes a todos los usuarios</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="text-white/70 w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Creator Form */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Nuevo Mensaje</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-white/50">Título</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Ej: Mantenimiento"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-white/50">Tipo</label>
                                <div className="flex gap-2">
                                    {(['info', 'success', 'warning', 'critical'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-3 rounded-xl border flex justify-center items-center transition-all ${type === t
                                                ? `bg-${t === 'info' ? 'blue' : t === 'success' ? 'green' : t === 'warning' ? 'orange' : 'red'}-500/20 border-${t === 'info' ? 'blue' : t === 'success' ? 'green' : t === 'warning' ? 'orange' : 'red'}-500`
                                                : 'bg-transparent border-white/10 hover:bg-white/5'
                                                }`}
                                        >
                                            {t === 'info' && <Info className={`w-4 h-4 ${type === t ? 'text-blue-400' : 'text-white/40'}`} />}
                                            {t === 'success' && <CheckCircle className={`w-4 h-4 ${type === t ? 'text-green-400' : 'text-white/40'}`} />}
                                            {t === 'warning' && <AlertTriangle className={`w-4 h-4 ${type === t ? 'text-orange-400' : 'text-white/40'}`} />}
                                            {t === 'critical' && <AlertCircle className={`w-4 h-4 ${type === t ? 'text-red-400' : 'text-white/40'}`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/50">Mensaje</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                placeholder="Escribe el contenido del mensaje..."
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-white/50">Duración:</label>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none"
                                >
                                    <option value="1">1 Hora</option>
                                    <option value="12">12 Horas</option>
                                    <option value="24">24 Horas</option>
                                    <option value="48">48 Horas</option>
                                    <option value="168">1 Semana</option>
                                </select>
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={loading || !title || !message}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Enviando...' : (
                                    <>
                                        <Send className="w-4 h-4" /> Enviar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/10"></div>

                    {/* Active Broadcasts List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider flex justify-between">
                            Mensajes Activos <span className="text-white/30">{activeBroadcasts.length}</span>
                        </h3>

                        {activeBroadcasts.length === 0 ? (
                            <div className="text-center py-8 text-white/30 italic">No hay mensajes activos</div>
                        ) : (
                            <div className="space-y-3">
                                {activeBroadcasts.map(msg => (
                                    <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start justify-between group hover:border-white/20 transition-colors">
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${msg.type === 'critical' ? 'bg-red-500' :
                                                msg.type === 'warning' ? 'bg-orange-500' :
                                                    msg.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                }`} />
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{msg.title}</h4>
                                                <p className="text-white/60 text-xs mt-1">{msg.message}</p>
                                                <p className="text-white/30 text-[10px] mt-2">Expira: {new Date(msg.expires_at || '').toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
