import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Icon } from '../../components/Icon';
import { supabase } from '../../supabaseClient';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeKeys: 0,
    totalPlants: 0,
    totalCrosses: 0
  });
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Límite del Plan Free de Supabase: 500MB
  const MAX_STORAGE_BYTES = 500 * 1024 * 1024;

  useEffect(() => {
    fetchGlobalStats();
    fetchStorageUsage();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      // 1. Intentar usar la función RPC segura (Bypass RLS para Backdoor Admin)
      const { data: rpcStats, error: rpcError } = await supabase.rpc('get_admin_stats');

      if (!rpcError && rpcStats) {
        setStats(rpcStats);
      } else {
        // 2. Fallback a método antiguo (puede fallar si RLS bloquea)
        console.warn("RPC get_admin_stats failed, using fallback:", rpcError);
        const { count: usersCount } = await supabase.from('access_keys').select('*', { count: 'exact', head: true });
        const { count: activeKeysCount } = await supabase.from('access_keys').select('*', { count: 'exact', head: true }).not('device_id', 'is', null);
        const { count: plantsCount } = await supabase.from('plants').select('*', { count: 'exact', head: true });
        const { count: crossesCount } = await supabase.from('crosses').select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          activeKeys: activeKeysCount || 0,
          totalPlants: plantsCount || 0,
          totalCrosses: crossesCount || 0
        });
      }
    } catch (e) {
      console.error("Error fetching stats", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      // Llama a la función RPC que creamos en SQL
      const { data, error } = await supabase.rpc('get_db_size');
      if (error) throw error;
      setStorageBytes(data || 0);
    } catch (e) {
      console.error("Error fetching storage size", e);
      setStorageBytes(0);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500 shadow-red-500/50';
    if (percentage > 70) return 'bg-yellow-500 shadow-yellow-500/50';
    return 'bg-green-500 shadow-green-500/50';
  };

  const storagePercentage = Math.min((storageBytes / MAX_STORAGE_BYTES) * 100, 100);

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon name={icon} className="text-8xl" />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon name={icon} className="text-white text-2xl" />
        </div>
        <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold text-white mt-1">{loading ? '-' : value}</p>
        {subtitle && <p className="text-white/40 text-xs mt-2">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Panel de Control</h2>
        <p className="text-blue-300 mt-1">Visión general del ecosistema CarniLab</p>
      </div>

      {/* STORAGE MONITOR WIDGET */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Icon name="database" className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Almacenamiento (Plan Free)</h3>
              <p className="text-xs text-white/50">Base de datos PostgreSQL</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatBytes(storageBytes)} <span className="text-sm text-white/40 font-normal">/ 500 MB</span></p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-1000 ${getStorageColor(storagePercentage)}`}
            style={{ width: `${storagePercentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-2 text-xs font-mono text-white/40">
          <span>0%</span>
          <span>{storagePercentage.toFixed(1)}% Usado</span>
          <span>100%</span>
        </div>

        {storagePercentage > 90 && (
          <div className="mt-4 bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
            <Icon name="warning" className="text-red-400" />
            <p className="text-red-200 text-sm font-bold">¡ALERTA CRÍTICA! El espacio está casi lleno. Considera actualizar a Supabase Pro.</p>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button onClick={() => navigate('/admin/keys')} className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-purple-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon name="vpn_key" className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Gestionar Licencias</span>
        </button>
        <button onClick={() => navigate('/admin/prices')} className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-emerald-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon name="payments" className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Control de Precios</span>
        </button>
        <button onClick={() => navigate('/admin/users')} className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-blue-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon name="group" className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Usuarios</span>
        </button>
        <button onClick={() => navigate('/admin/theme')} className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-pink-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon name="palette" className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Temas Globales</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Claves Generadas"
          value={stats.totalUsers}
          icon="vpn_key"
          color="from-purple-500 to-indigo-500"
          subtitle="Total histórico de licencias"
        />
        <StatCard
          title="Usuarios Activos"
          value={stats.activeKeys}
          icon="devices"
          color="from-blue-500 to-cyan-500"
          subtitle="Dispositivos vinculados actualmente"
        />
        <StatCard
          title="Plantas Registradas"
          value={stats.totalPlants}
          icon="potted_plant"
          color="from-green-500 to-emerald-500"
          subtitle="En todas las colecciones"
        />
        <StatCard
          title="Proyectos de Cruza"
          value={stats.totalCrosses}
          icon="science"
          color="from-orange-500 to-red-500"
          subtitle="Experimentos genéticos"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Estado del Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-white">Base de Datos (Supabase)</span>
              </div>
              <span className="text-xs text-green-400 font-bold">CONECTADO</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm text-white">API Inteligencia Artificial</span>
              </div>
              <span className="text-xs text-blue-400 font-bold">OPERATIVO</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout >
  );
};

export default AdminDashboard;