import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Sparkles,
  X,
  Send,
  Bike,
  Shield,
  Search,
  ArrowRight,
  MessageSquare,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedRides?: any[];
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

interface RideMateAIFloatingProps {
  onNavigateTab: (tab: string, payload?: any) => void;
}

export const RideMateAIFloating: React.FC<RideMateAIFloatingProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm RideMate AI, your intelligent bike-pooling assistant for RIGOO (co-founded by M. Rethika & H. Bhavya Sree). How can I assist your commute today?",
      suggestedActions: [
        { label: 'Find rides to LB Nagar', action: 'PROMPT', payload: 'Find rides from Karmanghat to LB Nagar' },
        { label: 'How does fuel sharing work?', action: 'PROMPT', payload: 'How is the fuel cost contribution calculated?' },
        { label: 'Women Safety Policy', action: 'PROMPT', payload: 'Tell me about the Women Rider safety features' },
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAI(query, currentUser);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.text,
        matchedRides: res.matchedRides,
        suggestedActions: res.suggestedActions,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "I am ready to help you match with verified commuters! You can also search routes directly on our Find Ride page.",
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string, payload?: any) => {
    if (action === 'PROMPT') {
      handleSendMessage(payload);
    } else if (action === 'NAVIGATE_FIND_RIDE') {
      onNavigateTab('find-ride', payload);
      setIsOpen(false);
    } else if (action === 'NAVIGATE_OFFER_RIDE') {
      onNavigateTab('offer-ride');
      setIsOpen(false);
    } else if (action === 'NAVIGATE_SAFETY') {
      onNavigateTab('safety');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-gradient-to-r from-[#1769D2] to-[#123F7A] text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-105 transition transform active:scale-95 flex items-center gap-2 group"
          title="Open RideMate AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#123F7A] animate-pulse" />
          </div>
          <span className="font-extrabold text-sm tracking-tight pr-1">
            RideMate AI
          </span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[85vh] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#123F7A] to-[#1769D2] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">RideMate AI</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-400 text-slate-900">
                    Lyra RAG
                  </span>
                </div>
                <p className="text-[10px] text-blue-100">RIGOO Intelligent Transit Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1769D2] text-white font-medium rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Embedded Matched Rides inside chat */}
                {msg.matchedRides && msg.matchedRides.length > 0 && (
                  <div className="mt-2 space-y-2 w-full max-w-[95%]">
                    {msg.matchedRides.slice(0, 2).map((r: any) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-xs flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{r.start_location?.split(',')[0]} → {r.destination?.split(',')[0]}</p>
                          <p className="text-slate-500">{r.rider?.full_name} · {r.departure_time} · ₹{r.fuel_contribution}</p>
                        </div>
                        <button
                          onClick={() => onNavigateTab('find-ride')}
                          className="px-2.5 py-1 rounded-lg bg-[#1769D2] text-white font-bold text-[10px]"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Action Suggestion Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act.action, act.payload)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-[#1769D2] hover:bg-blue-100 transition"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs w-36">
                <span className="w-2 h-2 rounded-full bg-[#1769D2] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#1769D2] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#1769D2] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask RideMate or search a commute..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2] focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#1769D2] hover:bg-[#123F7A] text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
