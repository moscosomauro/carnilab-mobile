import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_status: boolean;
}

interface ChatParticipant {
    id: string;
    name: string;
    avatar: string;
    country: string;
}

const ChatScreen: React.FC = () => {
    const { conversationId } = useParams<{ conversationId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [participant, setParticipant] = useState<ChatParticipant | null>(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Conversation & Participant Info
    useEffect(() => {
        if (!user || !conversationId) return;

        const fetchDetails = async () => {
            // Get conversation to find the other participant
            const { data: conv, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (error || !conv) {
                console.error("Error fetching conversation:", error);
                navigate('/inbox');
                return;
            }

            const otherUserId = conv.participant_a === user.uid ? conv.participant_b : conv.participant_a;

            // Get profile of the other user
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, country_code')
                .eq('id', otherUserId)
                .single();

            setParticipant({
                id: otherUserId,
                name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario' : 'Usuario',
                avatar: profile?.avatar_url || "https://images.unsplash.com/photo-1453906971074-ce568cccbc63?w=400&h=400&fit=crop",
                country: profile?.country_code || '🌐'
            });
        };

        fetchDetails();
    }, [conversationId, user, navigate]);

    // 2. Realtime Messaging
    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
            setLoading(false);
        };

        fetchMessages();

        // Subscription
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !conversationId) return;

        const msgContent = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.uid,
                content: msgContent
            });

        if (error) {
            console.error("Error sending message:", error);
            // Ideally revert UI state
        } else {
            // Update conversation last_message
            await supabase
                .from('conversations')
                .update({
                    last_message: msgContent,
                    last_updated: new Date()
                })
                .eq('id', conversationId);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#6B8E23] border-t-transparent rounded-full" /></div>;

    return (
        <div className="flex flex-col h-screen bg-[#F5F1EB]">
            {/* Paper texture */}
            <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

            {/* Header */}
            <div className="relative z-10 px-6 pt-10 pb-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm flex items-center gap-4">
                <button onClick={() => navigate('/inbox')} className="w-10 h-10 rounded-full bg-[#F5F1EB] flex items-center justify-center text-[#8E877F] active:scale-95 transition-all">
                    <Icon name="arrow_back" className="text-xl" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={participant?.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="Avatar" />
                        <span className="absolute -bottom-1 -right-1 text-sm">{participant?.country === 'AR' ? '🇦🇷' : participant?.country}</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-[#2E2E2E] leading-none">{participant?.name}</h1>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#6B8E23]" />
                            <span className="text-[10px] uppercase font-bold text-[#8E877F] tracking-widest">En línea</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 relative z-10">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${isMe
                                ? 'bg-[#6B8E23] text-white rounded-tr-none'
                                : 'bg-white text-[#4A5D4F] rounded-tl-none border border-white'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 px-4 py-4 bg-white border-t border-gray-100 flex items-center gap-3 safe-area-bottom">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-[#F5F1EB] rounded-full px-6 py-3.5 text-sm font-bold text-[#2E2E2E] placeholder:text-[#CFC8C0] focus:outline-none focus:ring-2 focus:ring-[#6B8E23]/20 transition-all border border-transparent focus:border-[#6B8E23]"
                />
                <button
                    onClick={handleSend}
                    className="w-12 h-12 rounded-full bg-[#6B8E23] text-white flex items-center justify-center shadow-xl shadow-[#6B8E23]/20 active:scale-95 transition-transform"
                >
                    <Icon name="send" className="text-lg ml-1" />
                </button>
            </div>
        </div>
    );
};

export default ChatScreen;
