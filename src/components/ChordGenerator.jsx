import React, { useState } from 'react';
import { RefreshCcw, Music4 } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const KEYS = {
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
};

export default function ChordGenerator() {
  const { currentMeasureIndex, isPlaying } = useRhythm();
  const [selectedKey, setSelectedKey] = useState('G');
  const [progression, setProgression] = useState(['G', 'D', 'Em', 'C']);

  const generate = () => {
    const chords = KEYS[selectedKey];
    const newProg = Array.from({ length: 4 }).map(() => {
        return chords[Math.floor(Math.random() * chords.length)];
    });
    setProgression(newProg);
  };

  return (
    <div className="h-full flex flex-col p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <Music4 className="text-orange-500" size={18} />
            <span className="font-bold text-white text-sm">Progression</span>
        </div>
        <select 
            value={selectedKey} 
            onChange={(e) => { setSelectedKey(e.target.value); generate(); }}
            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-bold text-white outline-none"
        >
            {Object.keys(KEYS).map(k => <option key={k} value={k}>Key: {k}</option>)}
        </select>
      </div>
      
      {/* Horizontal Chord Strip */}
      <div className="flex-1 flex gap-2 mb-2 items-stretch min-h-0">
        {progression.map((chord, idx) => {
          // Highlight logic:
          // We mod by 4 because the visual progression has 4 chords.
          // If the engine plays measure 5, we go back to highlight chord 0.
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

      <button onClick={generate} className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/5">
        <RefreshCcw size={12} /> Shuffle Chords
      </button>
    </div>
  );
}