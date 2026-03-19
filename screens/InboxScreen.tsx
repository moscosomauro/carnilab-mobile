
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

interface ConversationPreview {
  id: string;
  partner_name: string;
  partner_avatar: string;
  partner_country: string;
  last_message: string;
  last_updated: string;
  is_read: boolean;
}

const InboxScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // 1. Fetch conversations where I am a participant
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${user.uid},participant_b.eq.${user.uid}`)
        .order('last_updated', { ascending: false });

      if (error || !convs) {
        setLoading(false);
        return;
      }

      // 2. Resolve partners (this could be optimized with a join or a view)
      const formatted: ConversationPreview[] = [];

      for (const c of convs) {
        const partnerId = c.participant_a === user.uid ? c.participant_b : c.participant_a;

        // Fetch partner profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, country_code')
          .eq('id', partnerId)
          .single();

        const partnerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario' : 'Usuario';

        formatted.push({
          id: c.id,
          partner_name: partnerName,
          partner_avatar: profile?.avatar_url || "https://images.unsplash.com/photo-1453906971074-ce568cccbc63?w=400&h=400&fit=crop",
          partner_country: profile?.country_code || '🌐',
          last_message: c.last_message || 'Nueva conversación',
          last_updated: c.last_updated,
          is_read: true // TODO: Implement read status logic per user
        });
      }

      setConversations(formatted);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to new conversations or updates? 
    // For MVP just fetch on mount.
  }, [user]);

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      {/* Header */}
      <div className="relative z-10 w-full max-w-[390px] px-6 pt-10 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4A5D4F] active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#2E2E2E] tracking-tight">Mensajes</h1>
          <p className="text-[#8E877F] text-xs font-medium uppercase tracking-widest">Tus conversaciones</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[390px] px-5 pb-20 space-y-4">

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-[#6B8E23] border-t-transparent rounded-full mb-4" />
            <p className="text-xs text-[#8E877F] font-bold uppercase tracking-widest">Cargando chats...</p>
          </div>
        )}

        {/* Conversations List */}
        {!loading && conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="relative bg-white rounded-[24px] p-4 transition-all duration-300 border border-transparent shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#F0F0F0] overflow-hidden border-2 border-white shadow-sm">
                <img src={conv.partner_avatar} className="w-full h-full object-cover" alt={conv.partner_name} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1 py-0.5 text-[10px] shadow-sm border border-gray-100">
                {conv.partner_country === 'AR' ? '🇦🇷' : conv.partner_country}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-base font-black text-[#2E2E2E] truncate">{conv.partner_name}</h3>
                <span className="text-[10px] font-bold text-[#8E877F]/60 ml-2 whitespace-nowrap">{formatFecha(conv.last_updated)}</span>
              </div>
              <p className="text-xs font-medium text-[#8E877F] line-clamp-1 truncate pr-4">
                {conv.last_message}
              </p>
            </div>

            <Icon name="chevron_right" className="text-[#CFC8C0] text-xl" />
          </div>
        ))}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border-4 border-[#F5F1EB]">
              <span className="text-4xl grayscale">🌱</span>
            </div>
            <h3 className="text-lg font-bold text-[#4A5D4F] mb-1">Sin mensajes</h3>
            <p className="text-[#8E877F] text-sm max-w-[200px]">Explora el mapa y contacta a otros cultivadores.</p>
            <button onClick={() => navigate('/discovery')} className="mt-6 px-6 py-3 bg-[#6B8E23] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Ir a Red Global
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav Placeholder (handled by App Layout usually, but ensuring spacing) */}
    </div>
  );
};

export default InboxScreen;
