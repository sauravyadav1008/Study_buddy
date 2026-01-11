import React from "react";
import ExpandableList from "../components/ExpandableList";

const DemoPage: React.FC = () => {
  const masteredConcepts = [
    "React Hooks",
    "Tailwind CSS",
    "TypeScript",
    "State Management",
    "API Integration",
    "Unit Testing",
    "Responsive Design",
    "Accessibility",
  ];

  const topicMastery = [
    ["Frontend", 0.9],
    ["Backend", 0.75],
    ["Database", 0.6],
    ["DevOps", 0.4],
    ["UI/UX", 0.85],
  ] as [string, number][];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-8 flex flex-col items-center justify-center space-y-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-vibrant-blue/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-vibrant-coral/10 rounded-full blur-[120px] -ml-48 -mb-48 animate-pulse-slow" />

      <div className="w-full max-w-sm p-10 glass-card-vibrant rounded-[3rem] border-white shadow-2xl space-y-10 relative z-10">
        <div className="space-y-2">
          <p className="text-[11px] font-black text-vibrant-blue uppercase tracking-[0.25em]">Preview Mode</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Design DNA
          </h2>
        </div>

        <ExpandableList
          title="Mastered Concepts"
          items={masteredConcepts}
          initialVisibleCount={4}
        />

        <ExpandableList
          title="Skill Matrix"
          items={topicMastery}
          initialVisibleCount={3}
          renderItem={([topic, mastery], i) => (
            <div key={i} className="space-y-2.5 mb-5 bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between text-[11px] px-1">
                <span className="text-slate-700 font-bold truncate max-w-[120px]">
                  {topic}
                </span>
                <span className="text-vibrant-coral font-black">{Math.round(mastery * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden border border-white/50">
                <div 
                  className="h-full accent-gradient rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${mastery * 100}%` }}
                />
              </div>
            </div>
          )}
        />
        
        <div className="pt-6 border-t border-slate-100">
           <button className="w-full h-14 premium-gradient text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-vibrant-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
             Primary Action
           </button>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
