import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const StrumPattern = () => {
  const { 
    currentPattern, 
    currentStepIndex, 
    isCountingIn, 
    countInBeat, 
    generateRandomPattern, 
    savePattern 
  } = useRhythm();

  // Handle the "New Rhythm" button click
  const handleRegenerate = (e) => {
    e.stopPropagation(); // Prevent drag events if parent is draggable
    const newPattern = generateRandomPattern();
    savePattern(newPattern);
  };

  if (isCountingIn) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-black/20 rounded-xl border border-white/5">
             <span className="text-6xl font-black text-orange-500 animate-pulse">{countInBeat}</span>
             <span className="ml-4 text-sm font-bold text-slate-500 uppercase tracking-widest">Get Ready</span>
        </div>
    )
  }

  return (
    <div className="flex justify-between items-stretch bg-black/40 p-1 rounded-xl overflow-hidden relative h-full border border-white/5 group">
        
        {/* Regenerate Button (Visible on Hover in top-right) */}
        <button 
          onClick={handleRegenerate}
          className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-orange-500 text-slate-400 hover:text-white rounded-lg transition-all z-30 border border-white/5 opacity-0 group-hover:opacity-100 shadow-lg"
          title="Randomize Pattern"
        >
          <RefreshCcw size={14} />
        </button>

        {/* Orange Background Highlighter/Cursor */}
        <div 
            className="absolute top-0 bottom-0 bg-orange-500/20 transition-all duration-100 ease-linear pointer-events-none"
            style={{
                left: currentStepIndex === -1 ? '0%' : `${(currentStepIndex / currentPattern.length) * 100}%`,
                width: `${100 / currentPattern.length}%`,
                opacity: currentStepIndex === -1 ? 0 : 1
            }}
        />

        {/* Pattern Steps */}
        {currentPattern.map((step, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-center z-10 border-r border-white/5 last:border-0 min-w-[40px]">
                <span className={`text-3xl font-black transition-all duration-75 ${currentStepIndex === idx ? 'text-white scale-125' : 'text-slate-600'}`}>
                    {/* Visual Arrow Representation */}
                    {step.strum === 'D' ? '↓' : step.strum === 'U' ? '↑' : ''}
                    {step.strum === ' ' && <span className="w-2 h-2 rounded-full bg-slate-800" />} 
                </span>
                
                <span className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-wider">
                    {step.strum === 'D' ? 'Dn' : step.strum === 'U' ? 'Up' : ''}
                </span>
            </div>
        ))}
    </div>
  );
};

export default StrumPattern;