import React from 'react';
import { useRhythm } from '../context/RhythmContext';

const StrumPattern = () => {
  const { currentPattern, currentStepIndex, isCountingIn, countInBeat } = useRhythm();

  if (isCountingIn) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-black/20 rounded-xl border border-white/5">
             <span className="text-6xl font-black text-orange-500 animate-pulse">{countInBeat}</span>
             <span className="ml-4 text-sm font-bold text-slate-500 uppercase tracking-widest">Get Ready</span>
        </div>
    )
  }

  return (
    <div className="flex justify-between items-stretch bg-black/40 p-1 rounded-xl overflow-hidden relative h-full border border-white/5">
        {/* Background Highlighter */}
        <div 
            className="absolute top-0 bottom-0 bg-orange-500/20 transition-all duration-100 ease-linear"
            style={{
                left: currentStepIndex === -1 ? '0%' : `${(currentStepIndex / currentPattern.length) * 100}%`,
                width: `${100 / currentPattern.length}%`,
                opacity: currentStepIndex === -1 ? 0 : 1
            }}
        />
        {currentPattern.map((step, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-center z-10 border-r border-white/5 last:border-0 min-w-[40px]">
                <span className={`text-2xl font-bold transition-all ${currentStepIndex === idx ? 'text-white scale-125' : 'text-slate-600'}`}>
                    {step.strum === 'D' ? '↓' : step.strum === 'U' ? '↑' : step.strum}
                </span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono uppercase">
                    {step.strum === 'D' ? 'Dn' : step.strum === 'U' ? 'Up' : 'Mt'}
                </span>
            </div>
        ))}
    </div>
  );
};

export default StrumPattern;