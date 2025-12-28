import React, { useState } from 'react';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';
import { RHYTHM_PATTERNS, TIME_SIGNATURES } from '../data/rhythmPatterns';

const PatternPreview = ({ steps }) => {
    return (
        <div className="flex gap-1 h-8 items-center opacity-60">
            {steps.map((step, idx) => (
                <div key={idx} className="flex-1 text-center">
                    <span className="text-xs font-bold text-slate-400">
                        {step.strum === 'D' ? '↓' : step.strum === 'U' ? '↑' : ''}
                    </span>
                </div>
            ))}
        </div>
    );
};

const PatternBrowser = () => {
  const { currentPatternId, selectPattern, startPlayback, stopPlayback, isPlaying } = useRhythm();
  const [filterTimeSig, setFilterTimeSig] = useState('ALL');
  
  const filteredPatterns = RHYTHM_PATTERNS.filter(p => 
    filterTimeSig === 'ALL' || p.timeSig === filterTimeSig
  );

  const handleSelect = (id) => {
      selectPattern(id);
  };

  const handlePlayPreview = (e, id) => {
      e.stopPropagation();
      selectPattern(id);
      // Small timeout to allow state to settle before playing
      setTimeout(() => startPlayback(), 50);
  };

  return (
    <div className="h-full flex flex-col">
        {/* Filter Bar */}
        <div className="flex gap-2 p-2 border-b border-white/5 bg-black/20">
            <button 
                onClick={() => setFilterTimeSig('ALL')}
                className={`px-3 py-1 rounded text-[10px] font-bold ${filterTimeSig === 'ALL' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                ALL
            </button>
            {TIME_SIGNATURES.map(ts => (
                <button 
                    key={ts} 
                    onClick={() => setFilterTimeSig(ts)}
                    className={`px-3 py-1 rounded text-[10px] font-bold ${filterTimeSig === ts ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    {ts}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredPatterns.map(pattern => {
                const isActive = pattern.id === currentPatternId;
                
                return (
                    <div 
                        key={pattern.id}
                        onClick={() => handleSelect(pattern.id)}
                        className={`group p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 flex items-center gap-3 relative
                            ${isActive ? 'bg-white/5 border-orange-500/50' : 'bg-black/20 border-white/5'}
                        `}
                    >
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'text-orange-500 bg-orange-500/10' : 'text-slate-600 bg-black/40'}`}>
                            {isActive ? <CheckCircle size={16} /> : <span className="text-[10px] font-bold">{pattern.timeSig}</span>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{pattern.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{pattern.category} • {pattern.description}</p>
                            
                            {/* Visual Preview (Visible on Hover/Active) */}
                            <div className={`mt-1 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <PatternPreview steps={pattern.steps} />
                            </div>
                        </div>

                        {/* Play Button (Hover) */}
                        <button 
                            onClick={(e) => handlePlayPreview(e, pattern.id)}
                            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <PlayCircle size={20} />
                        </button>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default PatternBrowser;