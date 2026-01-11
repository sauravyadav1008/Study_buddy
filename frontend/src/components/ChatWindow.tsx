import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, GraduationCap, Paperclip } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MCQQuiz from './MCQQuiz';
import type { MCQQuestion, MCQResult } from './MCQQuiz';
import QAQuiz from './QAQuiz';
import type { QAQuestion, QAResult } from './QAQuiz';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading: boolean;
  error?: string | null;
  mode?: 'study' | 'mcq' | 'qa';
  quizQuestions?: (MCQQuestion | QAQuestion)[];
  onSubmitMCQ?: (answers: Record<string, number>) => Promise<Record<string, MCQResult>>;
  onSubmitQA?: (answers: Record<string, string>) => Promise<Record<string, QAResult>>;
  onCloseQuiz?: () => void;
  onUploadFile?: (file: File) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, onSendMessage, loading, error, mode = 'study',
  quizQuestions = [], onSubmitMCQ, onSubmitQA, onCloseQuiz, onUploadFile
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative bg-transparent">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 pb-44 pt-16 custom-scrollbar"
      >
        <AnimatePresence mode="wait">
          {mode === 'mcq' || mode === 'qa' ? (
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full max-w-4xl mx-auto"
            >
              {quizQuestions.length > 0 ? (
                mode === 'mcq' ? (
                  <MCQQuiz 
                    questions={quizQuestions as MCQQuestion[]} 
                    onSubmit={onSubmitMCQ!} 
                    onClose={onCloseQuiz!} 
                  />
                ) : (
                  <QAQuiz 
                    questions={quizQuestions as QAQuestion[]} 
                    onSubmit={onSubmitQA!} 
                    onClose={onCloseQuiz!} 
                  />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
                    <div className="relative h-24 w-24 rounded-[2rem] glass-card-vibrant flex items-center justify-center shadow-2xl border-white">
                      <GraduationCap className="h-12 w-12 text-primary animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Crafting Your Session</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Personalizing Intelligence...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full flex flex-col items-center justify-center text-center space-y-12 max-w-2xl mx-auto pb-10"
            >
              <div className="space-y-6">
                <div className="relative mx-auto h-28 w-28 floating">
                  <div className="absolute inset-0 premium-gradient blur-3xl opacity-30 rounded-full" />
                  <div className="absolute inset-0 accent-gradient blur-2xl opacity-20 rounded-full translate-x-4 translate-y-4" />
                  <div className="relative h-full w-full rounded-[2.8rem] glass-card-vibrant flex items-center justify-center shadow-2xl border-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="h-12 w-12 text-vibrant-blue relative z-10" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-5xl font-black tracking-tight text-slate-800">
                    Hey, <span className="font-black text-black">Scholar!</span>
                  </h2>
                  <p className="text-lg text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                    Ready to transform your learning journey? I'm your AI companion for mastery.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto w-full space-y-2"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {loading && (
                <div className="flex justify-start mb-12 ml-14">
                  <div className="glass-card-vibrant px-8 py-5 rounded-[2.2rem] rounded-tl-sm flex gap-2.5 border-white shadow-lg">
                    <div className="w-2.5 h-2.5 bg-vibrant-blue/60 rounded-full animate-bounce [animation-duration:0.8s]" />
                    <div className="w-2.5 h-2.5 bg-vibrant-blue/60 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                    <div className="w-2.5 h-2.5 bg-vibrant-blue/60 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 backdrop-blur-md border border-red-100 text-red-600 text-[13px] px-8 py-5 rounded-[2.2rem] mb-12 flex items-center gap-5 shadow-xl"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="font-black flex-1 uppercase tracking-wider">{error}</span>
                  <button 
                    onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) onSendMessage(lastUserMsg.content);
                    }}
                    className="px-6 py-2.5 bg-white rounded-2xl text-[11px] font-black hover:bg-red-600 hover:text-white transition-all shadow-md active:scale-95"
                  >
                    RETRY
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-10 transition-all duration-700 ease-in-out",
        mode !== 'study' ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}>
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-vibrant-blue/20 to-vibrant-coral/20 rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <form 
            onSubmit={handleSubmit} 
            className="relative glass-card-vibrant p-2.5 rounded-[3rem] flex items-center gap-3 border-white shadow-2xl transition-all group-focus-within:border-vibrant-blue/30 group-focus-within:scale-[1.01]"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.doc,.png,.jpg,.jpeg"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-50/50 hover:bg-vibrant-blue/10 text-slate-400 hover:text-vibrant-blue transition-all ml-2 group/clip"
            >
              <Paperclip className="h-6 w-6 group-hover/clip:rotate-12 transition-transform" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or drop study material..."
              disabled={loading}
              className="flex-1 h-16 bg-transparent border-none focus:ring-0 text-slate-800 font-bold placeholder:text-slate-400 px-5 text-[15px]"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="h-16 px-10 rounded-[2.4rem] premium-gradient text-white font-black text-[13px] shadow-2xl shadow-vibrant-blue/25 hover:shadow-vibrant-blue/40 transition-all hover:scale-[1.02] active:scale-[0.95] flex items-center gap-4 disabled:grayscale disabled:opacity-50 uppercase tracking-widest"
            >
              Send
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="flex justify-center gap-10 mt-5">
            <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
              <div className="h-1.5 w-1.5 rounded-full bg-vibrant-blue shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              Cognitive Engine
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
              <div className="h-1.5 w-1.5 rounded-full bg-vibrant-coral shadow-[0_0_8px_rgba(255,127,80,0.5)]" />
              Neural Mastery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
