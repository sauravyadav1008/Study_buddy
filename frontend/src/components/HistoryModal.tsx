import React from 'react';
import type { SessionHistory } from '../services/api';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { GraduationCap, Sparkles } from 'lucide-react';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: SessionHistory[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col glass-card-vibrant shadow-[0_0_100px_rgba(0,0,0,0.2)] border-white rounded-[3rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-6 pt-8 px-10 bg-white/50">
                    <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-vibrant-blue/20 rotate-3">
                            <GraduationCap className="h-7 w-7 text-white" />
                        </div>
                        Learning Journey
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-vibrant-blue/10 rounded-full h-10 w-10 text-slate-400 font-bold transition-all hover:rotate-90">
                        ✕
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white/30">
                    {history.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No history discovered</p>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto">Start a session to build your personal learning repository.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {history.map((session) => (
                                <div key={session.session_id} className="glass-card-vibrant border-white rounded-[2.5rem] p-8 space-y-6 transition-all hover:shadow-2xl hover:scale-[1.01] group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-[11px] font-black text-vibrant-blue uppercase tracking-[0.2em] mb-1.5">
                                                {new Date(session.created_at).toLocaleDateString(undefined, {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <h4 className="font-black text-xl text-slate-800 tracking-tight">Study Session</h4>
                                        </div>
                                        <Badge className="text-[11px] bg-white border-slate-100 text-slate-500 rounded-2xl py-2 px-5 font-black shadow-sm">
                                            {session.messages.length} Interactions
                                        </Badge>
                                    </div>

                                    {(session.mastered_concepts.length > 0 || session.weak_areas.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {session.mastered_concepts.length > 0 && (
                                                <div className="space-y-2.5">
                                                    <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-500 font-black px-1">Mastered</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {session.mastered_concepts.map((concept, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 text-[10px] py-1.5 px-3.5 rounded-xl font-bold">
                                                                {concept}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {session.weak_areas.length > 0 && (
                                                <div className="space-y-2.5">
                                                    <p className="text-[10px] uppercase tracking-[0.25em] text-vibrant-coral font-black px-1">Needs Review</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {session.weak_areas.map((area, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-vibrant-coral/10 text-vibrant-coral border-vibrant-coral/10 text-[10px] py-1.5 px-3.5 rounded-xl font-bold">
                                                                {area}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-5 border-t border-slate-100 relative z-10">
                                        <p className="text-[11px] text-slate-400 italic truncate font-bold flex items-center gap-2">
                                            <span className="text-vibrant-blue text-lg">“</span>
                                            {session.messages[session.messages.length - 1]?.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="p-8 border-t border-slate-100 flex justify-end bg-white/50">
                    <Button 
                        onClick={onClose} 
                        className="premium-gradient hover:scale-[1.05] text-white rounded-[1.5rem] px-10 h-14 text-[13px] font-black shadow-xl shadow-vibrant-blue/20 transition-all uppercase tracking-widest"
                    >
                        Close Repository
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default HistoryModal;
