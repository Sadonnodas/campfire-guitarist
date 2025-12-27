import React, { useState, useEffect } from 'react';
import { RefreshCcw, Music4, Settings2 } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

// --- CHORD DATA BASE ---
const KEYS = ['C', 'G', 'D', 'A', 'E'];
const CHORD_DATA = {
  'G': { 
    Major: { I: 'G', ii: 'Am', iii: 'Bm', IV: 'C', V: 'D', vi: 'Em', vii: 'F#dim' },
    Minor: { i: 'Gm', ii: 'Adim', III: 'Bb', iv: 'Cm', v: 'Dm', VI: 'Eb', VII: 'F' }
  },
  'C': { 
    Major: { I: 'C', ii: 'Dm', iii: 'Em', IV: 'F', V: 'G', vi: 'Am', vii: 'Bdim' },
    Minor: { i: 'Cm', ii: 'Ddim', III: 'Eb', iv: 'Fm', v: 'Gm', VI: 'Ab', VII: 'Bb' }
  },
  'D': { 
    Major: { I: 'D', ii: 'Em', iii: 'F#m', IV: 'G', V: 'A', vi: 'Bm', vii: 'C#dim' },
    Minor: { i: 'Dm', ii: 'Edim', III: 'F', iv: 'Gm', v: 'Am', VI: 'Bb', VII: 'C' }
  },
  'A': { 
    Major: { I: 'A', ii: 'Bm', iii: 'C#m', IV: 'D', V: 'E', vi: 'F#m', vii: 'G#dim' },
    Minor: { i: 'Am', ii: 'Bdim', III: 'C', iv: 'Dm', v: 'Em', VI: 'F', VII: 'G' }
  },
  'E': { 
    Major: { I: 'E', ii: 'F#m', iii: 'G#m', IV: 'A', V: 'B', vi: 'C#m', vii: 'D#dim' },
    Minor: { i: 'Em', ii: 'F#dim', III: 'G', iv: 'Am', v: 'Bm', VI: 'C', VII: 'D' }
  },
};

const DEGREES_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];
const DEGREES_MINOR = ['i', 'ii', 'III', 'iv', 'v', 'VI', 'VII'];

export default function ChordGenerator() {
  const { currentMeasureIndex, isPlaying } = useRhythm();
  
  // Settings
  const [root, setRoot] = useState('G');
  const [tonality, setTonality] = useState('Major'); // 'Major' or 'Minor'
  const [enabledDegrees, setEnabledDegrees] = useState(['I', 'IV', 'V', 'vi', 'i', 'III', 'VI']); // Defaults mixed to cover both
  const [progression, setProgression] = useState([]);

  // Load available degrees based on tonality
  const currentDegreeLabels = tonality === 'Major' ? DEGREES_MAJOR : DEGREES_MINOR;

  // Toggle Logic
  const toggleDegree = (deg) => {
    setEnabledDegrees(prev => 
      prev.includes(deg) ? prev.filter(d => d !== deg) : [...prev, deg]
    );
  };

  const generate = () => {
    const keyData = CHORD_DATA[root][tonality];
    
    // Filter available chords based on enabled degrees
    const pool = currentDegreeLabels
        .filter(deg => enabledDegrees.includes(deg))
        .map(deg => keyData[deg]);

    // Fallback if nothing selected
    const finalPool = pool.length > 0 ? pool : [keyData[currentDegreeLabels[0]]];

    const newProg = Array.from({ length: 4 }).map(() => {
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    });
    setProgression(newProg);
  };

  // Initial Generate
  useEffect(() => { generate(); }, [root, tonality]);

  return (
    <div className="h-full flex flex-col p-2">
      
      {/* Top Bar: Key & Tonality */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-white/10">
            <select 
                value={root} 
                onChange={(e) => setRoot(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
            >
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <button 
                onClick={() => setTonality(t => t === 'Major' ? 'Minor' : 'Major')}
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-orange-400 transition-colors"
            >
                {tonality}
            </button>
        </div>
        
        <button onClick={generate} className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors" title="Regenerate">
            <RefreshCcw size={14} />
        </button>
      </div>

      {/* Scale Degree Toggles */}
      <div className="flex gap-1 justify-between mb-3 px-1">
        {currentDegreeLabels.map((deg) => {
           const isOn = enabledDegrees.includes(deg);
           return (
             <button 
                key={deg} 
                onClick={() => toggleDegree(deg)}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                    isOn 
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                    : 'bg-black/20 border-white/5 text-slate-600 hover:border-white/10'
                }`}
             >
                {deg}
             </button>
           )
        })}
      </div>
      
      {/* Progression Display */}
      <div className="flex-1 flex gap-2 mb-1 items-stretch min-h-0">
        {progression.map((chord, idx) => {
          const isActive = isPlaying && (currentMeasureIndex % 4 === idx);
          return (
            <div 
              key={idx} 
              className={`flex-1 rounded-lg flex flex-col items-center justify-center border relative transition-all duration-200 ${
                isActive 
                  ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105 z-10' 
                  : 'bg-slate-800/50 text-slate-400 border-white/5'
              }`}
            >
              <span className="text-2xl lg:text-3xl font-black tracking-tighter">{chord}</span>
              <span className={`absolute top-1 right-2 text-[8px] font-mono ${isActive ? 'text-white/80' : 'text-slate-600'}`}>
                {idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}