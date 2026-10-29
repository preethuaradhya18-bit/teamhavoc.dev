import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../api';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  CornerDownLeft, 
  ChevronDown 
} from 'lucide-react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Greetings! I am your Solarpunk AI Helpdesk Assistant for NetZero Prints (Team Havoc.dev). How can I assist you with carbon tracking, earning eco-coins, or verified audits today?",
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const promptPills = [
    'How do I earn coins?',
    'How does proof audit work?',
    'Top ways to cut electricity carbon?',
    'How do I export my ESG PDF report?',
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();

      const botReply = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        text: data.reply || "I'm analyzing your request against our Solarpunk database. Please check our dashboard tabs for real-time tracking.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'bot',
          text: "I'm momentarily syncing with the local engine. You can ask me how to earn coins, upload verified bills, or use the forecast sliders!",
          time: 'Now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open Solarpunk AI Helpdesk"
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-110 active:scale-95 transition-all group relative"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 rounded-full border-2 border-[#070C09] animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#070C09]" />
        </button>
      )}

      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-[#070C09]/95 backdrop-blur-2xl border border-emerald-500/40 rounded-3xl shadow-[0_16px_60px_0_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/80 to-black/80 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-400 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Solarpunk AI Helpdesk</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Online • Team Havoc.dev</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs font-mono">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-emerald-500 text-black font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-br-sm'
                      : 'bg-white/[0.05] text-slate-200 border border-emerald-500/20 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Pills */}
          <div className="px-3 py-2 border-t border-emerald-500/15 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-black/40">
            {promptPills.map((pill) => (
              <button
                key={pill}
                onClick={() => handleSendMessage(pill)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono transition-all"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-black/60 border-t border-emerald-500/20 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Ask anything about NetZero Prints..."
              className="flex-1 bg-black/60 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
