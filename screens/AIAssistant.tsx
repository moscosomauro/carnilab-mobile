
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { CarniBotIcon } from '../components/CarniBotIcon';
import { useApp } from '../context/AppContext';
import { askCarniBot } from '../utils/carniBot';

interface Message {
  id: number;
  role: 'user' | 'model';
  text: string;
  image?: string;
}

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plants, addAlert, addDiaryEntry } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'model',
      text: '¡Hola! Soy Carni Bot 🌿. Puedo ayudarte a identificar tus plantas carnívoras, darte consejos de cuidado o diagnosticar problemas. ¡Envíame una foto o descríbeme tu consulta!'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Initial State passing from other screens
  useEffect(() => {
    const state = location.state as { initialImage?: string, initialPrompt?: string } | null;
    if (state) {
      if (state.initialImage && !selectedImage) {
        setSelectedImage(state.initialImage);
      }
      if (state.initialPrompt && !inputText) {
        setInputText(state.initialPrompt);
      }
      // Limpiar state para evitar recargas infinitas si se hace refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    // 1. Add User Message to UI
    const newUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: inputText,
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 2. Llamada directa a Gemini desde el dispositivo (con herramientas locales)
      const textResponse = await askCarniBot(
        [...messages, newUserMsg].map(m => ({ role: m.role, text: m.text })),
        newUserMsg.image || null,
        plants,
        { addAlert, addDiaryEntry }
      );

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'model',
        text: textResponse
      }]);

    } catch (error: any) {
      console.error("Error calling Carni Bot AI:", error);
      let errorMessage = `Hubo un error al conectar con Carni Bot. Detalles: ${error.message || JSON.stringify(error)}`;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'model',
        text: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col font-display items-center">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-4 sticky top-0 z-20 w-full max-w-[390px] shadow-[0_4px_20px_rgba(74,93,79,0.05)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#F5F7F5] rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors text-[#4A5D4F]"
          >
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-[#2E2E2E] flex items-center gap-2">
              <span className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#4CAF50]">
                <CarniBotIcon className="w-5 h-5" />
              </span>
              Carni Bot
            </h1>
            <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider ml-10 -mt-1">Asistente Experto</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 w-full max-w-[390px] overflow-y-auto p-5 space-y-6 pb-32 relative z-10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-[24px] p-5 shadow-sm ${msg.role === 'user'
                ? 'bg-[#4A5D4F] text-[#F5F1EB] rounded-tr-sm'
                : 'bg-white text-[#4A5D4F] rounded-tl-sm border border-[#4A5D4F]/5'
                }`}
            >
              {msg.image && (
                <div className="rounded-xl overflow-hidden mb-3 border-2 border-white/20">
                  <img
                    src={msg.image}
                    alt="User upload"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-[24px] p-4 rounded-tl-sm border border-[#4A5D4F]/5 flex gap-2 items-center shadow-sm">
              <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full max-w-[390px] bg-white border-t border-[#4A5D4F]/10 p-4 pb-6 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] rounded-t-[30px]">
        <div className="flex flex-col gap-2">
          {selectedImage && (
            <div className="relative w-20 h-20 mb-2">
              <img src={selectedImage} className="w-full h-full object-cover rounded-xl border-2 border-[#4CAF50]" alt="Preview" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-[#EF4444] rounded-full p-1 shadow-md text-white border-2 border-white"
              >
                <Icon name="close" className="text-xs" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-[#F5F7F5] rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors shrink-0 text-[#4CAF50] active:scale-95"
            >
              <Icon name="add_a_photo" className="text-xl" />
            </button>

            <div className="flex-1 bg-[#F5F7F5] rounded-[24px] flex items-center border border-transparent focus-within:border-[#4CAF50]/30 focus-within:bg-white transition-all">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="w-full bg-transparent border-none text-[#2E2E2E] p-3.5 max-h-32 focus:ring-0 resize-none placeholder-[#8E877F]/50 text-sm font-medium"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className="w-12 h-12 bg-[#4A5D4F] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 disabled:shadow-none text-[#F5F1EB]"
            >
              <Icon name="send" className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
