
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useApp } from '../context/AppContext';

const AlertsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, plants, addAlert, completeAlert, deleteAlert } = useApp();
  const [filter, setFilter] = useState('pendientes');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new alert
  const [newAlertData, setNewAlertData] = useState({
    plantaId: '',
    tipo: 'riego',
    mensaje: '',
    prioridad: 'media' as 'alta' | 'media' | 'baja',
    fecha: '' // Iniciamos vacío para obligar al usuario a elegir
  });

  const prioridadStyles: Record<string, { border: string, bg: string, text: string, icon: string }> = {
    alta: { border: 'border-l-[6px] border-l-[#EF4444]', bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', icon: 'warning' },
    media: { border: 'border-l-[6px] border-l-[#F59E0B]', bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', icon: 'info' },
    baja: { border: 'border-l-[6px] border-l-[#3B82F6]', bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', icon: 'schedule' }
  };

  const alertTypes = [
    { value: 'riego', label: 'Riego', icon: 'water_drop' },
    { value: 'fertilizacion', label: 'Fertilización', icon: 'eco' },
    { value: 'control_plagas', label: 'Control Plagas', icon: 'bug_report' },
    { value: 'poda', label: 'Poda', icon: 'content_cut' },
    { value: 'otro', label: 'Otro', icon: 'notifications' }
  ];

  const alertasFiltradas = alerts.filter(a => {
    if (filter === 'pendientes') return !a.completada;
    if (filter === 'completadas') return a.completada;
    return true;
  });

  const alertasPendientes = alerts.filter(a => !a.completada).length;

  const handleComplete = (id: number) => {
    completeAlert(id);
  };

  const handleDelete = (id: number, isCompleted: boolean) => {
    const message = isCompleted
      ? '¿Estás seguro de eliminar esta alerta del historial? Esta acción no se puede deshacer.'
      : '¿Estás seguro de eliminar esta alerta pendiente?';

    if (window.confirm(message)) {
      deleteAlert(id);
    }
  };

  const handleSaveAlert = () => {
    if (!newAlertData.mensaje || !newAlertData.fecha) return;

    const plantaSelected = plants.find(p => p.id === Number(newAlertData.plantaId));
    const tipoInfo = alertTypes.find(t => t.value === newAlertData.tipo);

    // CORRECCIÓN: Convertir el input local (YYYY-MM-DDTHH:MM) a ISO UTC real
    const localDate = new Date(newAlertData.fecha);
    const isoDate = localDate.toISOString();

    addAlert({
      tipo: newAlertData.tipo,
      planta: plantaSelected ? plantaSelected.nombre : 'General',
      mensaje: newAlertData.mensaje,
      prioridad: newAlertData.prioridad,
      fecha: isoDate, // Guardamos en UTC robusto
      completada: false,
      icon: tipoInfo?.icon || 'notifications',
      color: 'from-blue-500 to-blue-600' // Legacy field kept for compatibility
    });

    setShowAddModal(false);
    setNewAlertData({
      plantaId: '',
      tipo: 'riego',
      mensaje: '',
      prioridad: 'media',
      fecha: ''
    });
  };

  const formatFecha = (fecha: string) => {
    const alertDate = new Date(fecha).getTime();
    const now = new Date().getTime();
    const diff = alertDate - now; // Milisegundos de diferencia real

    // Si la fecha ya pasó
    if (diff < 0) {
      const pastDiff = Math.abs(diff);
      const minutes = Math.floor(pastDiff / (1000 * 60));
      const hours = Math.floor(pastDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days > 0) return `Venció hace ${days} d`;
      if (hours > 0) return `Venció hace ${hours} h`;
      if (minutes > 0) return `Venció hace ${minutes} min`;
      return 'Venció ahora mismo';
    }

    // Tiempo futuro
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `En ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `En ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `En ${minutes} min`;
    return `Ahora`;
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center font-display relative overflow-hidden">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      {/* Header */}
      <div className="z-10 w-full max-w-[390px] px-6 pt-10 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-[#4A5D4F] active:scale-95 transition-transform"
          >
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#2E2E2E] tracking-tight">Alertas</h1>
            <p className="text-[#8E877F] text-xs font-bold uppercase tracking-wider">{alertasPendientes} Tareas activas</p>
          </div>
          <div className="relative w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#4CAF50] shadow-sm">
            <Icon name="notifications" className="text-xl" />
            {alertasPendientes > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-[#F5F1EB]">
                {alertasPendientes}
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="bg-white rounded-[20px] p-3 px-4 shadow-[0_4px_10px_rgba(74,93,79,0.05)] border border-[#4A5D4F]/5 min-w-[100px] flex flex-col items-center">
            <span className="text-2xl font-black text-[#4CAF50]">{alertasPendientes}</span>
            <span className="text-[9px] font-bold text-[#8E877F] uppercase tracking-wider">Pendientes</span>
          </div>
          <div className="bg-white rounded-[20px] p-3 px-4 shadow-[0_4px_10px_rgba(74,93,79,0.05)] border border-[#4A5D4F]/5 min-w-[100px] flex flex-col items-center">
            <span className="text-2xl font-black text-[#EF4444]">{alerts.filter(a => a.prioridad === 'alta' && !a.completada).length}</span>
            <span className="text-[9px] font-bold text-[#8E877F] uppercase tracking-wider">Urgentes</span>
          </div>
          <div className="bg-white rounded-[20px] p-3 px-4 shadow-[0_4px_10px_rgba(74,93,79,0.05)] border border-[#4A5D4F]/5 min-w-[100px] flex flex-col items-center opacity-60">
            <span className="text-2xl font-black text-[#4A5D4F]">{alerts.filter(a => a.completada).length}</span>
            <span className="text-[9px] font-bold text-[#8E877F] uppercase tracking-wider">Completadas</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[390px] px-5 pb-24 flex flex-col h-full">
        {/* Filtros */}
        <div className="flex gap-2 mb-6 bg-[#E8E4DD] p-1.5 rounded-full self-start">
          {['pendientes', 'completadas', 'todas'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                ? 'bg-white text-[#4A5D4F] shadow-sm'
                : 'text-[#8E877F] hover:text-[#4A5D4F]'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alertasFiltradas.map(alerta => {
            const styles = prioridadStyles[alerta.prioridad] || prioridadStyles.media;

            return (
              <div
                key={alerta.id}
                className={`bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 ${alerta.completada ? 'opacity-60 grayscale' : 'hover:scale-[1.02]'} ${styles.border}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.bg}`}>
                        <Icon name={alerta.icon || 'notifications'} className={`text-lg ${styles.text}`} />
                      </div>
                      <div>
                        <h3 className="text-[#2E2E2E] font-bold text-base leading-tight">{alerta.planta}</h3>
                        <p className="text-[#8E877F] text-xs font-medium mt-0.5">{alerta.mensaje}</p>
                      </div>
                    </div>
                    {alerta.completada && (
                      <div className="bg-[#E8F5E9] p-1.5 rounded-full">
                        <Icon name="check" className="text-[#4CAF50] text-sm" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#F5F1EB] pt-3 mt-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${styles.bg} ${styles.text}`}>
                        {alerta.prioridad}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#8E877F]">
                        <Icon name="schedule" className="text-[10px]" /> {formatFecha(alerta.fecha)}
                      </span>
                    </div>
                  </div>
                </div>

                {!alerta.completada ? (
                  <div className="flex border-t border-[#F5F1EB]">
                    <button
                      onClick={() => handleComplete(alerta.id)}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#4CAF50] hover:bg-[#E8F5E9] transition-colors flex items-center justify-center gap-1 border-r border-[#F5F1EB]"
                    >
                      <Icon name="check" className="text-sm" /> Completar
                    </button>
                    <button
                      onClick={() => handleDelete(alerta.id, false)}
                      className="w-1/3 py-3 text-xs font-bold uppercase tracking-wider text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#F5F1EB]">
                    <button
                      onClick={() => handleDelete(alerta.id, true)}
                      className="w-full py-3 text-xs font-bold uppercase tracking-wider text-[#8E877F] hover:bg-[#F5F1EB] transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon name="delete" className="text-sm" /> Eliminar Historial
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {alertasFiltradas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 opacity-80">
                <Icon name="notifications_off" className="text-[#4A5D4F]/30 text-3xl" />
              </div>
              <h3 className="text-lg font-bold text-[#4A5D4F] mb-1">Sin alertas</h3>
              <p className="text-[#8E877F] text-sm font-medium">No hay tareas {filter} por el momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante - Nueva alerta */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-[#4A5D4F] rounded-full shadow-[0_8px_20px_rgba(74,93,79,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[#F5F1EB]"
        >
          <Icon name="add" className="text-2xl" />
        </button>
      </div>

      {/* Modal Nueva Alerta - Slide Up Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2E2E2E]/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-[#F5F1EB] rounded-t-[32px] w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl relative">

            {/* Handle bar */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-[#4A5D4F]/20 rounded-full"></div>
            </div>

            <div className="p-6 pt-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#2E2E2E]">Nueva Alerta</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 bg-[#E8E4DD] rounded-full flex items-center justify-center hover:bg-[#D8D4CD] transition-colors text-[#4A5D4F]"
                >
                  <Icon name="close" className="text-lg" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Planta */}
                <div>
                  <label className="text-[#8E877F] text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Asociar a Planta</label>
                  <div className="relative">
                    <select
                      value={newAlertData.plantaId}
                      onChange={(e) => setNewAlertData({ ...newAlertData, plantaId: e.target.value })}
                      className="w-full bg-white border border-[#4A5D4F]/10 rounded-xl px-4 py-3 text-[#2E2E2E] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A5D4F]/20 appearance-none"
                    >
                      <option value="">General (Sin planta específica)</option>
                      {plants.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A5D4F]">
                      <Icon name="expand_more" />
                    </div>
                  </div>
                </div>

                {/* Fecha y Hora Específica */}
                <div>
                  <label className="text-[#8E877F] text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={newAlertData.fecha}
                    onChange={(e) => setNewAlertData({ ...newAlertData, fecha: e.target.value })}
                    className="w-full bg-white border border-[#4A5D4F]/10 rounded-xl px-4 py-3 text-[#2E2E2E] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A5D4F]/20"
                  />
                  <p className="text-[10px] text-[#4CAF50] mt-1.5 flex items-center gap-1 font-bold ml-1">
                    <Icon name="info" className="text-xs" />
                    Te avisaremos 30 min antes
                  </p>
                </div>

                {/* Tipo de Tarea */}
                <div>
                  <label className="text-[#8E877F] text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Tipo de Tarea</label>
                  <div className="grid grid-cols-2 gap-2">
                    {alertTypes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setNewAlertData({ ...newAlertData, tipo: t.value })}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${newAlertData.tipo === t.value
                          ? 'bg-[#4A5D4F] border-[#4A5D4F] text-[#F5F1EB] shadow-md'
                          : 'bg-white border-[#4A5D4F]/5 text-[#4A5D4F] hover:bg-[#F5F7F5]'}`}
                      >
                        <Icon name={t.icon} className="text-lg" />
                        <span className="text-sm font-bold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="text-[#8E877F] text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Mensaje / Tarea *</label>
                  <input
                    type="text"
                    value={newAlertData.mensaje}
                    onChange={(e) => setNewAlertData({ ...newAlertData, mensaje: e.target.value })}
                    placeholder="Ej: Regar con agua destilada"
                    className="w-full bg-white border border-[#4A5D4F]/10 rounded-xl px-4 py-3 text-[#2E2E2E] font-medium placeholder-[#8E877F]/50 focus:outline-none focus:ring-2 focus:ring-[#4A5D4F]/20"
                  />
                </div>

                {/* Prioridad */}
                <div>
                  <label className="text-[#8E877F] text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Prioridad</label>
                  <div className="flex gap-2 bg-white p-1 rounded-xl border border-[#4A5D4F]/5">
                    {['baja', 'media', 'alta'].map(p => (
                      <button
                        key={p}
                        onClick={() => setNewAlertData({ ...newAlertData, prioridad: p as any })}
                        className={`flex-1 py-2 rounded-lg capitalize text-sm font-bold transition-all ${newAlertData.prioridad === p
                            ? (p === 'alta' ? 'bg-[#FEF2F2] text-[#EF4444]' : p === 'media' ? 'bg-[#FFFBEB] text-[#F59E0B]' : 'bg-[#EFF6FF] text-[#3B82F6]') + ' shadow-sm'
                            : 'text-[#8E877F] hover:bg-[#F5F7F5]'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveAlert}
                    disabled={!newAlertData.mensaje || !newAlertData.fecha}
                    className="w-full bg-[#4A5D4F] text-[#F5F1EB] font-bold py-4 rounded-xl shadow-[0_10px_20px_rgba(74,93,79,0.3)] hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    Guardar Alerta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsScreen;
