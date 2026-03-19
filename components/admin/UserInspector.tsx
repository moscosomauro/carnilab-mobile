import React, { useEffect, useState } from 'react';
import { AccessKey } from '../../types';
import { supabase } from '../../supabaseClient';
import { X, User, HardDrive, Flower, Sprout, BookOpen, Activity, Calendar, Clock } from 'lucide-react';

interface UserInspectorProps {
    userKey: AccessKey;
    onClose: () => void;
}

interface UserStats {
    total_plants: number;
    total_crosses: number;
    total_diary: number;
    total_images: number;
    last_activity: string | null;
}

export const UserInspector: React.FC<UserInspectorProps> = ({ userKey, onClose }) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const rpcParams = {
                    p_key: userKey.key,
                    p_device_id: userKey.deviceId || null
                };

                const { data, error } = await supabase.rpc('get_user_stats', rpcParams);

                if (error) throw error;
                if (data && data.length > 0) {
                    setStats(data[0]);
                }
            } catch (e) {
                console.error("Error fetching user stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userKey]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-[30px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">

                {/* Header - Glass Effect */}
                <div className="relative h-48 bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 flex flex-col justify-end border-b border-white/5">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-4 right-4 z-20">
                        <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative z-10 flex items-end gap-6">
                        <div className="w-24 h-24 rounded-full bg-black/50 border-4 border-white/10 flex items-center justify-center text-white/20 shadow-xl">
                            {userKey.avatar_url ? (
                                <img src={userKey.avatar_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-10 h-10" />
                            )}
                        </div>
                        <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border
                  ${userKey.plan === 'elite' ? 'bg-purple-500/20 border-purple-500 text-purple-300' :
                                        userKey.plan === 'pro' ? 'bg-blue-500/20 border-blue-500 text-blue-300' :
                                            'bg-green-500/20 border-green-500 text-green-300'}`}>
                                    {userKey.plan}
                                </span>
                                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-white/50 font-mono">
                                    {userKey.key.substring(0, 8)}...
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-white leading-none mb-1">{userKey.label}</h2>
                            <p className="text-white/40 text-sm flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Vence: {userKey.expiresAt ? new Date(userKey.expiresAt).toLocaleDateString() : 'Nunca'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    icon={<Flower className="w-5 h-5 text-pink-400" />}
                                    label="Plantas"
                                    value={stats?.total_plants || 0}
                                    color="bg-pink-500/10 border-pink-500/20"
                                />
                                <StatCard
                                    icon={<Sprout className="w-5 h-5 text-emerald-400" />}
                                    label="Cruzas"
                                    value={stats?.total_crosses || 0}
                                    color="bg-emerald-500/10 border-emerald-500/20"
                                />
                                <StatCard
                                    icon={<BookOpen className="w-5 h-5 text-amber-400" />}
                                    label="Bitácora"
                                    value={stats?.total_diary || 0}
                                    color="bg-amber-500/10 border-amber-500/20"
                                />
                                <StatCard
                                    icon={<HardDrive className="w-5 h-5 text-cyan-400" />}
                                    label="Storage (Imgs)"
                                    value={stats?.total_images || 0}
                                    color="bg-cyan-500/10 border-cyan-500/20"
                                />
                            </div>

                            {/* Activity Section */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-400" />
                                    Actividad Reciente
                                </h3>
                                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Última Actualización</p>
                                        <p className="text-lg text-white font-mono font-bold">
                                            {stats?.last_activity ? new Date(stats.last_activity).toLocaleString() : 'Sin actividad reciente'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }: any) => (
    <div className={`p-5 rounded-2xl border ${color} flex flex-col items-center justify-center gap-2 relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="mb-1">{icon}</div>
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
    </div>
);
