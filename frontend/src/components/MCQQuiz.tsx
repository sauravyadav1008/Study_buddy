import React, { useState } from 'react';
import { Badge } from './ui/Badge';
import { CheckCircle2, XCircle, Info, ChevronRight, RefreshCw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer?: number;
  explanation?: string;
  topic?: string;
}

export interface MCQResult {
  is_correct: boolean;
  correct_option: number;
  explanation: string;
}

interface MCQQuizProps {
  questions: MCQQuestion[];
  onSubmit: (answers: Record<string, number>) => Promise<Record<string, MCQResult>>;
  onClose: () => void;
}

const MCQQuiz: React.FC<MCQQuizProps> = ({ questions, onSubmit, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, MCQResult> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (results) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onSubmit(selectedAnswers);
      setResults(response);
    } catch (error) {
      console.error("Failed to submit quiz", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScore = () => {
    if (!results) return 0;
    return Object.values(results).filter(r => r.is_correct).length;
  };

  const scorePercentage = results ? (getScore() / questions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge className="premium-gradient text-white border-none px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-vibrant-blue/20">
            Knowledge Check
          </Badge>
          <h2 className="text-5xl font-black tracking-tight text-slate-800">MCQ Assessment</h2>
          <p className="text-slate-500 font-bold text-lg">Validate your understanding with these curated questions.</p>
        </div>
        
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card-vibrant p-7 rounded-[2.8rem] flex items-center gap-7 border-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative h-20 w-20">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-100"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${scorePercentage}, 100` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="stroke-vibrant-blue"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-vibrant-blue drop-shadow-lg" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Mastery</p>
                <p className="text-3xl font-black text-slate-800">{getScore()} / {questions.length}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-10 pb-32">
        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="group"
          >
            <div className={cn(
              "glass-card-vibrant rounded-[3rem] overflow-hidden transition-all duration-500 border-white",
              results && results[q.id]?.is_correct ? "border-emerald-200 shadow-emerald-500/10" : 
              results && !results[q.id]?.is_correct ? "border-red-200 shadow-red-500/10" : 
              selectedAnswers[q.id] !== undefined ? "border-vibrant-blue/30 shadow-2xl shadow-vibrant-blue/5 scale-[1.01]" : 
              "hover:border-vibrant-blue/20 hover:shadow-2xl hover:scale-[1.01]"
            )}>
              <div className="p-10 space-y-10">
                <div className="flex items-start justify-between gap-8">
                  <div className="space-y-5 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="h-10 w-10 rounded-2xl premium-gradient flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-vibrant-blue/20 rotate-3">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        Intelligence Probe
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                      {q.question}
                    </h3>
                  </div>
                  {results && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      {results[q.id]?.is_correct ? (
                        <div className="h-14 w-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shadow-lg shadow-red-500/10">
                          <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {q.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === optIdx;
                    const isCorrect = results && results[q.id]?.correct_option === optIdx;
                    const isWrong = results && isSelected && !results[q.id]?.is_correct;

                    return (
                      <button
                        key={optIdx}
                        disabled={!!results}
                        onClick={() => handleOptionSelect(q.id, optIdx)}
                        className={cn(
                          "flex items-center text-left p-3 rounded-[2rem] border-2 transition-all duration-400 group/opt relative overflow-hidden",
                          !results && isSelected && "bg-vibrant-blue/10 border-vibrant-blue text-deep-blue shadow-xl shadow-vibrant-blue/10 font-bold",
                          !results && !isSelected && "bg-white border-slate-100 hover:border-vibrant-blue/30 hover:bg-white hover:shadow-lg",
                          results && isCorrect && "bg-emerald-50 border-emerald-500 text-emerald-900 scale-[1.03] shadow-xl shadow-emerald-500/20 font-black",
                          results && isWrong && "bg-red-50 border-red-500 text-red-900 font-black",
                          results && !isCorrect && !isWrong && "opacity-40 border-slate-200 grayscale-[0.3]"
                        )}
                      >
                        <div className={cn(
                          "h-14 w-14 rounded-[1.4rem] flex items-center justify-center text-base font-black mr-5 shrink-0 transition-all duration-500",
                          !results && isSelected && "bg-deep-blue text-white shadow-xl shadow-vibrant-blue/30 rotate-12",
                          !results && !isSelected && "bg-slate-50 text-slate-400 group-hover/opt:bg-vibrant-blue/10 group-hover/opt:text-vibrant-blue group-hover/opt:rotate-6",
                          results && isCorrect && "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30",
                          results && isWrong && "bg-red-500 text-white shadow-xl shadow-red-500/30",
                          results && !isCorrect && !isWrong && "bg-slate-100"
                        )}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-[15px] font-bold pr-5 leading-tight">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {results && results[q.id]?.explanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-slate-100 bg-slate-50/30"
                  >
                    <div className="p-10 flex gap-7">
                      <div className="h-12 w-12 rounded-[1.2rem] bg-vibrant-blue/10 flex items-center justify-center shrink-0 shadow-inner">
                        <Info className="h-6 w-6 text-vibrant-blue" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-vibrant-blue">Neural Feedback</p>
                        <p className="text-[15px] text-slate-600 font-bold leading-relaxed">
                          {results[q.id].explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
        <div className="max-w-4xl mx-auto flex gap-8">
          <button 
            className="flex-1 rounded-[2.4rem] h-18 glass-card-vibrant border-white text-[13px] font-black text-slate-500 transition-all hover:bg-white active:scale-95 shadow-2xl hover:text-slate-700 uppercase tracking-widest"
            onClick={onClose}
          >
            {results ? "Close Session" : "Cancel Probe"}
          </button>
          {!results ? (
            <button 
              className="flex-[2.5] rounded-[2.4rem] h-18 premium-gradient text-white text-[13px] font-black shadow-2xl shadow-vibrant-blue/30 hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-5 disabled:grayscale disabled:opacity-50 uppercase tracking-[0.2em]"
              disabled={isSubmitting || Object.keys(selectedAnswers).length < questions.length}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  Analyzing Intelligence...
                </>
              ) : (
                <>
                  Submit Assessment
                  <ChevronRight className="h-6 w-6" />
                </>
              )}
            </button>
          ) : (
            <button 
              className="flex-[2.5] rounded-[2.4rem] h-18 accent-gradient text-white text-[13px] font-black shadow-2xl shadow-vibrant-coral/30 hover:scale-[1.02] active:scale-[0.95] transition-all uppercase tracking-[0.2em]"
              onClick={onClose}
            >
              Continue Learning Journey
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQQuiz;
