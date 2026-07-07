import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap, Sparkles, Loader2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { ChatMessage, SavedNote } from '../types';

interface MathTutorProps {
  currentUrl?: string;
  currentTitle?: string;
  onSaveAsNote: (note: SavedNote) => void;
}

export default function MathTutor({ currentUrl, currentTitle, onSaveAsNote }: MathTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: "Hi! I'm your AI Math & Science Tutor. I can help explain tricky equations, guide you through Siyavula math exercises, or generate customized quizzes. What are we studying today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.text,
          contextUrl: currentUrl,
          contextTitle: currentTitle,
          chatHistory: messages.slice(-6) // Send last 6 messages for context
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const tutorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, tutorMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to AI Tutor server.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTutorNote = (tutorText: string) => {
    const summary = tutorText.substring(0, 30) + '...';
    const newNote: SavedNote = {
      id: Date.now().toString(),
      title: `Tutor Note: ${currentTitle || 'Practice Session'}`,
      content: `### AI Tutor Practice Notes\n\n**Context Page:** [${currentTitle || 'Education Page'}](${currentUrl || '#'})\n\n**Tutor Explanation:**\n\n${tutorText}\n\n*Created on: ${new Date().toLocaleDateString()}*`,
      urlContext: currentUrl,
      createdAt: new Date().toLocaleDateString()
    };
    onSaveAsNote(newNote);
  };

  const handleResetChat = () => {
    if (window.confirm("Reset your study conversation with the AI Tutor?")) {
      setMessages([
        {
          id: 'welcome',
          sender: 'tutor',
          text: "Let's start a fresh practice session! Ask me any math or physical sciences question.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5" id="math-tutor-panel">
      {/* Tutor Panel Header */}
      <div className="bg-slate-950 p-4 border-b border-white/5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <GraduationCap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">AI Study Companion</h3>
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 animate-pulse" /> Powered by Gemini AI
            </p>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          title="Reset conversation"
          className="text-slate-500 hover:text-slate-300 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTitle && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 leading-relaxed font-light">
            <span className="font-bold text-indigo-400">Context Node Active:</span> Synthesizing solutions directly from <em>{currentTitle}</em>.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-br-none'
                : 'bg-slate-950 text-slate-300 rounded-bl-none border border-white/5 shadow-2xl'
            }`}>
              {/* Parse rudimentary markdown bullets or formulas */}
              <div className="whitespace-pre-line font-sans font-light">
                {msg.text}
              </div>

              {msg.sender === 'tutor' && msg.id !== 'welcome' && (
                <div className="mt-3.5 pt-2.5 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => handleSaveTutorNote(msg.text)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2.5 py-1 rounded transition-all cursor-pointer"
                    title="Export explanation to study notes"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Clip to Study Notes</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-500 px-1 font-mono">{msg.timestamp}</span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-950 border border-white/5 rounded-xl p-3.5 w-fit shadow-2xl">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>AI Tutor is analyzing your curriculum...</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3.5 text-xs flex gap-2 items-start leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-400">AI Tutor Offline</p>
              <p className="text-[11px] mt-0.5 text-slate-400">{error}</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3.5 bg-slate-950 border-t border-white/5 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question or request a math quiz..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-black/40 border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500/40 outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold p-2.5 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-amber-500/10 disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
