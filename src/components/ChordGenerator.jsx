import React, { useState, useEffect } from 'react';
import { RefreshCcw, Music4, Clock } from 'lucide-react';
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
  const { currentMeasureIndex, currentBeat, isPlaying } = useRhythm();
  
  // Settings
  const [root, setRoot] = useState('G');
  const [tonality, setTonality] = useState('Major'); 
  const [enabledDegrees, setEnabledDegrees] = useState(['I', 'IV', 'V', 'vi', 'i', 'III', 'VI']);
  const [chordsPerBar, setChordsPerBar] = useState(1); // 1, 2, or 4
  
  // Progression: Array of Measures, each containing Array of Chords
  const [progression, setProgression] = useState([]);

  const currentDegreeLabels = tonality === 'Major' ? DEGREES_MAJOR : DEGREES_MINOR;

  const toggleDegree = (deg) => {
    setEnabledDegrees(prev => 
      prev.includes(deg) ? prev.filter(d => d !== deg) : [...prev, deg]
    );
  };

  const generate = () => {
    const keyData = CHORD_DATA[root][tonality];
    
    const pool = currentDegreeLabels
        .filter(deg => enabledDegrees.includes(deg))
        .map(deg => keyData[deg]);

    const finalPool = pool.length > 0 ? pool : [keyData[currentDegreeLabels[0]]];

    // Generate 4 Measures
    const newProg = Array.from({ length: 4 }).map(() => {
        // For each measure, generate N chords
        return Array.from({ length: chordsPerBar }).map(() => 
             finalPool[Math.floor(Math.random() * finalPool.length)]
        );
    });
    setProgression(newProg);
  };

  useEffect(() => { generate(); }, [root, tonality, chordsPerBar]);

  return (
    <div className="h-full flex flex-col p-2">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-white/10">
            <select value={root} onChange={(e) => setRoot(e.target.value)} className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer">
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={() => setTonality(t => t === 'Major' ? 'Minor' : 'Major')} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-orange-400">
                {tonality}
            </button>
        </div>
        
        {/* Harmonic Rhythm Toggle */}
        <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-white/10">
             <Clock size={12} className="text-slate-500" />
             {[1, 2, 4].map(num => (
                 <button 
                    key={num}
                    onClick={() => setChordsPerBar(num)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${chordsPerBar === num ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                 >
                    {num}/bar
                 </button>
             ))}
        </div>

        <button onClick={generate} className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded"><RefreshCcw size={14} /></button>
      </div>

      {/* Toggles */}
      <div className="flex gap-1 justify-between mb-3 px-1">
        {currentDegreeLabels.map((deg) => {
           const isOn = enabledDegrees.includes(deg);
           return (
             <button key={deg} onClick={() => toggleDegree(deg)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${isOn ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-black/20 border-white/5 text-slate-600'}`}>
                {deg}
             </button>
           )
        })}
      </div>
      
      {/* Progression Display */}
      <div className="flex-1 flex gap-2 mb-1 items-stretch min-h-0">
        {progression.map((measureChords, mIdx) => {
          const isCurrentMeasure = isPlaying && (currentMeasureIndex % 4 === mIdx);
          
          return (
            <div key={mIdx} className={`flex-1 flex gap-1 ${isCurrentMeasure ? 'bg-white/5' : ''} p-1 rounded-lg border border-white/5`}>
                {measureChords.map((chord, cIdx) => {
                    // Highlight Logic:
                    // If 1 chord/bar: always active if measure active
                    // If 2 chords/bar: active if beat <= 2 (idx 0) or beat > 2 (idx 1)
                    // If 4 chords/bar: active if beat == cIdx + 1
                    
                    let isActive = false;
                    if (isCurrentMeasure) {
                        if (chordsPerBar === 1) isActive = true;
                        else if (chordsPerBar === 2) isActive = (cIdx === 0 && currentBeat <= 2) || (cIdx === 1 && currentBeat > 2);
                        else if (chordsPerBar === 4) isActive = (currentBeat === cIdx + 1);
                    }

                    return (
                        <div key={cIdx} className={`flex-1 rounded flex items-center justify-center transition-all duration-100 ${isActive ? 'bg-orange-500 text-white scale-105 shadow-lg' : 'bg-slate-800/50 text-slate-500'}`}>
                             <span className="text-xl font-black tracking-tighter">{chord}</span>
                        </div>
                    )
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}