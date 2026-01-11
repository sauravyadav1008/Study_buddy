import React from 'react';
import type { UserProfile } from '../services/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import ExpandableList from './ExpandableList';

interface SidebarProps {
  profile: UserProfile | null;
  onReset: () => void;
  onAssessmentClick: (type: 'mcq' | 'qa') => void;
  onRevisionClick: () => void;
  onHistoryClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ profile, onReset, onAssessmentClick, onRevisionClick, onHistoryClick }) => {
  const percentage = profile ? Math.round(profile.confidence_score * 100) : 0;

  return (
    <div className="w-[300px] h-full flex flex-col py-6 pl-6 pr-2 bg-transparent">
      <div className="flex-1 flex flex-col glass-card-vibrant min-h-0 rounded-[2.5rem] overflow-hidden border-white/60 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <div className="p-8 flex flex-col flex-1 min-h-0 relative z-10">
          <div className="flex items-center gap-4 mb-12 flex-shrink-0">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-vibrant-blue via-vibrant-coral to-vibrant-blue rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
              <Avatar className="h-14 w-14 border-2 border-white/80 relative shadow-xl">
                <AvatarImage src="/ai-avatar.png" alt="AI" />
                <AvatarFallback className="premium-gradient text-white text-xs font-black shadow-lg">SB</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0.5 right-0.5 h-4 w-4 bg-emerald-400 border-2 border-white rounded-full shadow-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">Study Buddy</h1>
              <p className="text-[10px] text-vibrant-blue font-black uppercase tracking-[0.2em]">Genius Assistant</p>
            </div>
          </div>

          <div className="space-y-10 flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mastery Progress</span>
                <span className="text-sm font-black text-vibrant-blue">{percentage}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100/40 rounded-full overflow-hidden p-[2px] border border-slate-100/50">
                <div 
                  className="h-full premium-gradient rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <ExpandableList
              title="Known Concepts"
              items={profile?.known_concepts || []}
              initialVisibleCount={3}
            />

            <ExpandableList
              title="Skill Matrix"
              items={profile?.topic_mastery ? Object.entries(profile.topic_mastery) : []}
              initialVisibleCount={3}
              renderItem={([topic, mastery], i) => (
                <div key={i} className="space-y-2.5 mb-5 bg-white/30 p-3 rounded-2xl border border-white/50 soft-shadow">
                  <div className="flex justify-between text-[11px] px-1">
                    <span className="text-slate-700 font-bold truncate max-w-[150px]">{topic}</span>
                    <span className="text-vibrant-coral font-black">{Math.round((mastery || 0) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden border border-white/50">
                    <div 
                      className="h-full accent-gradient rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(mastery || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            />

            <div className="space-y-5 pt-6 border-t border-slate-200/30">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] px-1">
                Study Lab
              </h3>
              <div className="flex flex-col gap-3.5">
                <button 
                  className="flex items-center justify-between px-5 py-4 bg-white/60 hover:bg-white text-slate-700 rounded-2xl text-[11px] font-black transition-all border border-white shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
                  onClick={() => onAssessmentClick('mcq')}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🎯</span>
                    Quick MCQ Quiz
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-vibrant-blue">→</span>
                </button>
                <button 
                  className="flex items-center justify-between px-5 py-4 bg-white/60 hover:bg-white text-slate-700 rounded-2xl text-[11px] font-black transition-all border border-white shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
                  onClick={() => onAssessmentClick('qa')}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🧠</span>
                    Interactive Q&A
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-vibrant-blue">→</span>
                </button>
                
                {profile?.weak_areas && profile.weak_areas.length > 0 ? (
                  <button 
                    className="w-full mt-2 accent-gradient text-white py-4 rounded-2xl text-[11px] font-black shadow-xl shadow-coral/20 hover:shadow-2xl hover:shadow-coral/30 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2"
                    onClick={onRevisionClick}
                  >
                    🚀 Boost Weak Topics
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4 flex-shrink-0 pt-8 border-t border-slate-200/30">
            <button 
              onClick={onHistoryClick}
              className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-2xl text-[11px] font-black transition-all border border-transparent hover:border-vibrant-blue/10"
            >
              <span className="text-xl">🕒</span>
              Session History
            </button>
            <button 
              onClick={onReset}
              className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl text-[11px] font-black transition-all border border-transparent hover:border-red-100"
            >
              <span className="text-xl">🔄</span>
              Wipe AI Memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
