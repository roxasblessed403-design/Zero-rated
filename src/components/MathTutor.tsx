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
    <div className="flex flex-col h-full bg-t-surface border-l border-t-border transition-colors duration-200" id="math-tutor-panel">
      {/* Tutor Panel Header */}
      <div className="bg-t-muted p-4 border-b border-t-border flex items-center justify-between shadow-xs shrink-0 transition-colors">
        <div className="flex items-center gap-2">
          <div className="bg-t-muted/80 p-2 rounded-lg border border-t-border transition-colors">
            <GraduationCap className="w-5 h-5 text-t-text" />
          </div>
          <div>
            <h3 className="font-bold text-t-dark-text text-sm tracking-wide transition-colors">AI Study Companion</h3>
            <p className="text-[9px] text-t-muted-text font-semibold uppercase tracking-widest flex items-center gap-0.5 transition-colors">
              Powered by Gemini AI
            </p>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          title="Reset conversation"
          className="text-t-muted-text hover:text-t-text p-1.5 hover:bg-t-muted rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-t-surface transition-colors">
        {currentTitle && (
          <div className="bg-t-muted border border-t-border rounded-xl p-3 text-xs text-t-text leading-relaxed font-light transition-colors">
            <span className="font-bold text-t-dark-text">Context Node Active:</span> Synthesizing solutions directly from <em>{currentTitle}</em>.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed transition-colors duration-150 ${
              msg.sender === 'user'
                ? 'bg-t-muted text-t-text border border-t-border rounded-br-none'
                : 'bg-t-surface text-t-text rounded-bl-none border border-t-border shadow-xs'
            }`}>
              {/* Parse rudimentary markdown bullets or formulas */}
              <div className="whitespace-pre-line font-sans font-light">
                {msg.text}
              </div>

              {msg.sender === 'tutor' && msg.id !== 'welcome' && (
                <div className="mt-3.5 pt-2.5 border-t border-t-border flex justify-end transition-colors">
                  <button
                    onClick={() => handleSaveTutorNote(msg.text)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-t-text hover:text-t-dark-text hover:bg-t-muted border border-t-border px-2.5 py-1 rounded transition-all cursor-pointer"
                    title="Export explanation to study notes"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Clip to Study Notes</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[9px] text-t-muted-text px-1 font-mono transition-colors">{msg.timestamp}</span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-t-text bg-t-muted border border-t-border rounded-xl p-3.5 w-fit shadow-xs transition-colors">
            <Loader2 className="w-4 h-4 animate-spin text-t-text" />
            <span>AI Tutor is analyzing your curriculum...</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/10 border border-rose-900/30 text-rose-300 rounded-xl p-3.5 text-xs flex gap-2 items-start leading-relaxed transition-colors">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-400">AI Tutor Offline</p>
              <p className="text-[11px] mt-0.5 text-rose-300/80">{error}</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3.5 bg-t-muted border-t border-t-border shrink-0 transition-colors">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question or request a math quiz..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-t-surface border border-t-border text-t-text placeholder-t-muted-text/70 rounded-xl px-3.5 py-2.5 text-xs focus:border-t-text outline-none disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="bg-t-accent hover:bg-t-hover text-t-surface font-semibold p-2.5 rounded-xl transition-all flex items-center justify-center shadow-xs disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
