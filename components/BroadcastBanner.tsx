import React from 'react';
import { useBroadcast } from '../context/BroadcastContext';
import { AlertCircle, Info, CheckCircle, X, AlertTriangle } from 'lucide-react';

export const BroadcastBanner: React.FC = () => {
    const { activeBroadcasts, dismissBroadcast } = useBroadcast();

    if (activeBroadcasts.length === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none p-4 gap-2">
            {activeBroadcasts.map((msg) => (
                <div
                    key={msg.id}
                    className={`
            pointer-events-auto w-full max-w-lg rounded-xl shadow-lg border backdrop-blur-md p-4 flex items-start gap-3 animate-slide-down
            ${msg.type === 'critical' ? 'bg-red-500/90 border-red-400 text-white' : ''}
            ${msg.type === 'warning' ? 'bg-orange-500/90 border-orange-400 text-white' : ''}
            ${msg.type === 'info' ? 'bg-blue-600/90 border-blue-400 text-white' : ''}
            ${msg.type === 'success' ? 'bg-green-600/90 border-green-400 text-white' : ''}
          `}
                >
                    {msg.type === 'critical' && <AlertCircle className="shrink-0 w-6 h-6" />}
                    {msg.type === 'warning' && <AlertTriangle className="shrink-0 w-6 h-6" />}
                    {msg.type === 'info' && <Info className="shrink-0 w-6 h-6" />}
                    {msg.type === 'success' && <CheckCircle className="shrink-0 w-6 h-6" />}

                    <div className="flex-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1">{msg.title}</h4>
                        <p className="text-sm leading-relaxed opacity-90">{msg.message}</p>
                    </div>

                    <button
                        onClick={() => dismissBroadcast(msg.id)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};
