import React, { useState } from 'react';
import { Badge } from './ui/Badge';
import { Lightbulb, CheckCircle2, RefreshCw, ChevronRight, BrainCircuit, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface QAQuestion {
  id: string;
  question: string;
  suggested_answer_key_points?: string;
  topic?: string;
}

export interface QAResult {
  correctness_score: number;
  completeness_score: number;
  clarity_score: number;
  total_score: number;
  feedback: string;
}

interface QAQuizProps {
  questions: QAQuestion[];
  onSubmit: (answers: Record<string, string>) => Promise<Record<string, QAResult>>;
  onClose: () => void;
}

const QAQuiz: React.FC<QAQuizProps> = ({ questions, onSubmit, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QAResult> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, text: string) => {
    if (results) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = async () => {
    const allAnswered = questions.every(q => (answers[q.id]?.trim()?.length || 0) >= 50);
    if (!allAnswered) {
      alert("Please provide answers of at least 50 characters for each question.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onSubmit(answers);
      setResults(response);
    } catch (error) {
      console.error("Failed to submit QA", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOverallGrade = () => {
    if (!results) return "";
    const total = Object.values(results).reduce((acc, r) => acc + (r.total_score || 0), 0);
    const avg = total / questions.length;
    if (avg >= 8.5) return "Elite Scholar";
    if (avg >= 7) return "Advanced Learner";
    if (avg >= 4) return "Competent";
    return "Foundation Building";
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge className="accent-gradient text-white border-none px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-vibrant-coral/20">
            Deep Dive
          </Badge>
          <h2 className="text-5xl font-black tracking-tight text-slate-800">Q&A Assessment</h2>
          <p className="text-slate-500 font-bold text-lg">Demonstrate your mastery through detailed explanations.</p>
        </div>
        
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="glass-card-vibrant px-8 py-5 rounded-[2.5rem] flex items-center gap-5 border-white shadow-2xl"
            >
              <div className="h-14 w-14 rounded-[1.2rem] premium-gradient flex items-center justify-center shadow-lg shadow-vibrant-blue/20">
                <BrainCircuit className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Status</p>
                <p className="text-xl font-black text-slate-800 leading-none tracking-tight">{getOverallGrade()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-12 pb-32">
        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <div className="glass-card-vibrant rounded-[3.5rem] overflow-hidden border-white shadow-2xl relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="p-10 space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <span className="h-10 w-10 rounded-2xl accent-gradient flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-vibrant-coral/20 -rotate-3">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Conceptual Evaluation
                  </span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight max-w-2xl">
                  {q.question}
                </h3>

                <div className="relative group">
                  <textarea
                    disabled={!!results}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Articulate your understanding here..."
                    className={cn(
                      "w-full min-h-[220px] p-10 rounded-[2.8rem] border-2 bg-white/50 resize-none transition-all text-lg leading-relaxed font-bold placeholder:text-slate-300",
                      results ? "opacity-70 bg-slate-50/50 cursor-default border-slate-100" : "border-slate-100 focus:border-vibrant-coral/30 focus:bg-white focus:shadow-2xl"
                    )}
                  />
                  {!results && (
                    <div className={cn(
                      "absolute bottom-8 right-8 text-[11px] font-black px-5 py-2.5 rounded-2xl shadow-xl transition-all uppercase tracking-widest",
                      (answers[q.id]?.length || 0) >= 50 ? "accent-gradient text-white shadow-vibrant-coral/20" : "bg-slate-100 text-slate-400"
                    )}>
                      {answers[q.id]?.length || 0} / 50+ chars
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {results && results[q.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8 pt-8 border-t border-slate-100"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ScoreMetric label="Accuracy" score={results[q.id].correctness_score} max={5} icon={<Target className="w-4 h-4"/>} />
                        <ScoreMetric label="Depth" score={results[q.id].completeness_score} max={3} icon={<BrainCircuit className="w-4 h-4"/>} />
                        <ScoreMetric label="Structure" score={results[q.id].clarity_score} max={2} icon={<Sparkles className="w-4 h-4"/>} />
                      </div>

                      <div className="bg-vibrant-blue/5 rounded-[2.8rem] p-10 flex gap-8 border border-vibrant-blue/10 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-vibrant-blue/5 rounded-full blur-2xl -mr-16 -mt-16" />
                        <div className="h-14 w-14 rounded-[1.2rem] bg-white flex items-center justify-center shrink-0 shadow-xl relative z-10">
                          <CheckCircle2 className="h-8 w-8 text-vibrant-blue" />
                        </div>
                        <div className="space-y-3 relative z-10">
                          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-vibrant-blue">Tutor Analysis</p>
                          <p className="text-[16px] text-slate-700 font-bold leading-relaxed">
                            {results[q.id].feedback}
                          </p>
                        </div>
                      </div>

                      {q.suggested_answer_key_points && (
                        <div className="bg-emerald-50/40 rounded-[2rem] p-8 flex gap-6 border border-emerald-100/50">
                          <Lightbulb className="h-7 w-7 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Model Insights</p>
                            <p className="text-[15px] text-slate-600 font-bold leading-relaxed italic">
                              {q.suggested_answer_key_points}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
        <div className="max-w-4xl mx-auto flex gap-8">
          <button 
            className="flex-1 rounded-[2.4rem] h-18 glass-card-vibrant border-white text-[13px] font-black text-slate-500 transition-all hover:bg-white active:scale-95 shadow-2xl uppercase tracking-widest"
            onClick={onClose}
          >
            {results ? "Finish Review" : "Abandon Test"}
          </button>
          {!results ? (
            <button 
              className="flex-[2.5] rounded-[2.4rem] h-18 accent-gradient text-white text-[13px] font-black shadow-2xl shadow-vibrant-coral/30 hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-5 disabled:grayscale disabled:opacity-50 uppercase tracking-[0.2em]"
              disabled={isSubmitting || !questions.every(q => (answers[q.id]?.length || 0) >= 50)}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  Evaluating Depth...
                </>
              ) : (
                <>
                  Submit Responses
                  <ChevronRight className="h-6 w-6" />
                </>
              )}
            </button>
          ) : (
            <button 
              className="flex-[2.5] rounded-[2.4rem] h-18 premium-gradient text-white text-[13px] font-black shadow-2xl shadow-vibrant-blue/30 hover:scale-[1.02] active:scale-[0.95] transition-all uppercase tracking-[0.2em]"
              onClick={onClose}
            >
              Return to Study Hall
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ScoreMetric = ({ label, score, max, icon }: { label: string, score: number, max: number, icon: React.ReactNode }) => (
  <div className="bg-white/50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-lg font-black text-slate-800 leading-none">{score}</span>
        <span className="text-[10px] font-bold text-slate-300 leading-none mb-0.5">/ {max}</span>
      </div>
    </div>
    <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className="h-full premium-gradient rounded-full" 
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
  </div>
);

export default QAQuiz;
