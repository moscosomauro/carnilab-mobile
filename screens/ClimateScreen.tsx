
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useApp } from '../context/AppContext';
import { ClimateChart } from '../components/ClimateChart';

const ClimateScreen: React.FC = () => {
  const navigate = useNavigate();
  const { climateLogs, addClimateLog } = useApp();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    temp_max: '',
    temp_min: '',
    humidity: '',
    notes: ''
  });

  const handleSave = async () => {
    if (!formData.temp_max || !formData.temp_min || !formData.humidity) return;

    await addClimateLog({
      date: formData.date,
      temp_max: Number(formData.temp_max),
      temp_min: Number(formData.temp_min),
      humidity: Number(formData.humidity),
      notes: formData.notes
    });

    // Resetear solo valores, mantener fecha
    setFormData(prev => ({ ...prev, temp_max: '', temp_min: '', humidity: '', notes: '' }));
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      {/* Header */}
      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-10 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4A5D4F] active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#2E2E2E] tracking-tight">Monitor Clima</h1>
          <p className="text-[#8E877F] text-xs font-medium uppercase tracking-widest">Condiciones Ambientales</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#4CAF50]">
          <Icon name="thermostat" className="text-xl" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pb-20 space-y-6">

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div className="space-y-6">
            {/* Chart Section */}
            <ClimateChart logs={climateLogs} />

            {/* Quick Stats Cards */}
            {climateLogs.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#4A5D4F]/5 flex flex-col items-center">
                  <span className="text-[10px] text-[#8E877F] uppercase font-bold text-center">Promedio<br />Máx</span>
                  <span className="text-xl font-black text-[#EF4444] mt-1">
                    {Math.round(climateLogs.reduce((acc, curr) => acc + curr.temp_max, 0) / climateLogs.length)}°
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#4A5D4F]/5 flex flex-col items-center">
                  <span className="text-[10px] text-[#8E877F] uppercase font-bold text-center">Promedio<br />Mín</span>
                  <span className="text-xl font-black text-[#3B82F6] mt-1">
                    {Math.round(climateLogs.reduce((acc, curr) => acc + curr.temp_min, 0) / climateLogs.length)}°
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#4A5D4F]/5 flex flex-col items-center">
                  <span className="text-[10px] text-[#8E877F] uppercase font-bold text-center">Humedad<br />Media</span>
                  <span className="text-xl font-black text-[#06B6D4] mt-1">
                    {Math.round(climateLogs.reduce((acc, curr) => acc + curr.humidity, 0) / climateLogs.length)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 lg:mt-0">
            {/* New Entry Form */}
            <div className="bg-white rounded-[30px] p-6 shadow-xl shadow-[#4A5D4F]/5 border border-[#4A5D4F]/5">
              <h2 className="text-lg font-bold text-[#2E2E2E] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#FFF3E0] flex items-center justify-center text-orange-500">
                  <Icon name="edit_calendar" className="text-sm" />
                </span>
                Nuevo Registro
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider block mb-1.5 ml-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-[#2E2E2E] font-medium outline-none focus:ring-2 focus:ring-[#4A5D4F]/20 transition-all border border-transparent focus:border-[#4A5D4F]/30"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider block mb-1.5 ml-1">Máx</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="30"
                        value={formData.temp_max}
                        onChange={(e) => setFormData({ ...formData, temp_max: e.target.value })}
                        className="w-full bg-[#FEF2F2] rounded-xl px-3 py-3 text-[#2E2E2E] font-bold text-center outline-none focus:ring-2 focus:ring-red-500/20 border border-transparent focus:border-red-500/30"
                      />
                      <span className="absolute right-2 top-3 text-[10px] text-red-300 font-bold">°C</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider block mb-1.5 ml-1">Mín</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="15"
                        value={formData.temp_min}
                        onChange={(e) => setFormData({ ...formData, temp_min: e.target.value })}
                        className="w-full bg-[#EFF6FF] rounded-xl px-3 py-3 text-[#2E2E2E] font-bold text-center outline-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-500/30"
                      />
                      <span className="absolute right-2 top-3 text-[10px] text-blue-300 font-bold">°C</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-wider block mb-1.5 ml-1">Hum</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="60"
                        value={formData.humidity}
                        onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                        className="w-full bg-[#ECFEFF] rounded-xl px-3 py-3 text-[#2E2E2E] font-bold text-center outline-none focus:ring-2 focus:ring-cyan-500/20 border border-transparent focus:border-cyan-500/30"
                      />
                      <span className="absolute right-2 top-3 text-[10px] text-cyan-300 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider block mb-1.5 ml-1">Notas</label>
                  <input
                    type="text"
                    placeholder="Día soleado..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-[#2E2E2E] font-medium outline-none focus:ring-2 focus:ring-[#4A5D4F]/20 transition-all border border-transparent focus:border-[#4A5D4F]/30"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!formData.temp_max || !formData.temp_min || !formData.humidity}
                  className="w-full py-4 bg-[#4A5D4F] text-[#F5F1EB] rounded-xl font-bold shadow-[0_10px_20px_rgba(74,93,79,0.3)] hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Guardar Registro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3 lg:pt-4">
          <h3 className="text-xs font-bold text-[#8E877F] uppercase tracking-widest ml-1 lg:text-lg lg:mb-4 lg:text-[#4A5D4F]">Historial</h3>
          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            {climateLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#4A5D4F]/5 flex items-center justify-between group hover:border-[#4A5D4F]/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F5F1EB] rounded-xl flex items-center justify-center flex-col shadow-inner">
                    <span className="text-sm font-black text-[#4A5D4F]">{new Date(log.date).getDate()}</span>
                    <span className="text-[9px] uppercase font-bold text-[#8E877F]">{new Date(log.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div>
                    <div className="flex gap-4 text-sm font-bold items-center">
                      <span className="text-[#EF4444] flex items-center gap-1"><Icon name="arrow_upward" className="text-[10px]" />{log.temp_max}°</span>
                      <span className="text-[#3B82F6] flex items-center gap-1"><Icon name="arrow_downward" className="text-[10px]" />{log.temp_min}°</span>
                      <span className="text-[#06B6D4] px-2 py-0.5 bg-[#ECFEFF] rounded-md text-xs">{log.humidity}%</span>
                    </div>
                    {log.notes && <p className="text-xs text-[#8E877F] mt-1 font-medium">{log.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimateScreen;
