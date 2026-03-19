import React, { useEffect } from 'react';
import { Alert } from '../types';
import { Icon } from './Icon';

interface NotificationToastProps {
  alert: Alert;
  onDismiss: () => void;
  onComplete: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ alert, onDismiss, onComplete }) => {
  // Auto-dismiss after 10 seconds if no interaction
  useEffect(() => {
    const timer = setTimeout(onDismiss, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        {/* Glow effect */}
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${alert.color || 'from-blue-500 to-blue-600'}`}></div>
        
        <div className="flex items-start gap-3 pl-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 animate-pulse bg-gradient-to-br ${alert.color || 'from-blue-500 to-blue-600'}`}>
            <Icon name={alert.icon || 'notifications'} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold truncate">Recordatorio: {alert.prioridad.toUpperCase()}</h4>
            <p className="text-blue-200 text-sm truncate">{alert.mensaje}</p>
            <p className="text-white/60 text-xs mt-1 italic">{alert.planta}</p>
          </div>
          <button onClick={onDismiss} className="text-white/60 p-1 hover:bg-white/10 rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-1 pl-2">
          <button 
            onClick={onDismiss} 
            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors"
          >
            Posponer
          </button>
          <button 
            onClick={onComplete} 
            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 rounded-xl text-white text-sm font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95"
          >
            Completar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-150%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};