import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';
import { getAllKeys, getDiatonicChords } from '../utils/musicTheory';

const ChordGenerator = () => {
  const { timeSig, isPlaying, currentMeasureIndex, measureProgress } = useRhythm();
  
  // Settings
  const [selectedKey, setSelectedKey] = useState('G');
  const [scaleType, setScaleType] = useState('Major');
  const [progression, setProgression] = useState([]);
  const [chordsPerBar, setChordsPerBar] = useState(1);
  
  // Degree Filtering (1=I, 2=ii, etc.)
  const [allowedDegrees, setAllowedDegrees] = useState({
      1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false
  });

  // Load available keys
  const keys = getAllKeys();

  const getDegreeLabel = (degree) => {
      const romals = scaleType === 'Major' 
        ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
        : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
      return romals[degree - 1];
  };

  const toggleDegree = (deg) => {
      setAllowedDegrees(prev => ({...prev, [deg]: !prev[deg]}));
  };

  const generate = () => {
    const diatonicChords = getDiatonicChords(selectedKey, scaleType); 
    const pool = diatonicChords.filter(c => allowedDegrees[c.degree]);
    const safePool = pool.length > 0 ? pool : [diatonicChords[0]];

    const newProg = [];
    for(let i=0; i<4; i++) {
        const barChords = [];
        for(let j=0; j<chordsPerBar; j++) {
            const randomIdx = Math.floor(Math.random() * safePool.length);
            barChords.push(safePool[randomIdx]);
        }
        newProg.push(barChords);
    }
    setProgression(newProg);
  };

  // Trigger generate on setting changes
  useEffect(() => {
    generate();
  }, [selectedKey, scaleType, chordsPerBar]); 

  // Visual calculation
  const measureDuration = timeSig === '6/8' ? 0.75 : (timeSig === '3/4' ? 0.75 : 1.0);
  const normalizedProgress = measureProgress / measureDuration; 
  const activeChordIdx = Math.floor(normalizedProgress * chordsPerBar);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Top Bar Controls */}
      <div className="flex flex-wrap gap-2 p-2 border-b border-white/5 bg-black/20 items-center">
        <select 
            value={selectedKey} 
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
        >
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <select 
            value={scaleType} 
            onChange={(e) => setScaleType(e.target.value)}
            className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
        >
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
        </select>

        <button 
            onClick={() => setChordsPerBar(chordsPerBar === 1 ? 2 : 1)}
            className="px-3 py-1 bg-slate-800 text-xs rounded text-slate-300 border border-white/10 hover:text-white"
        >
            {chordsPerBar} / Bar
        </button>

        <div className="flex-1" />
        
        <button 
            onClick={generate}
            className="flex items-center gap-1 px-3 py-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white text-xs rounded border border-orange-500/20 transition-all"
        >
            <RefreshCcw size={12} /> Generate
        </button>
      </div>

      {/* Degree Checkboxes (High Contrast) */}
      <div className="flex gap-1 px-2 py-1 bg-black/40 justify-center">
          {[1,2,3,4,5,6,7].map(d => (
              <button 
                key={d}
                onClick={() => toggleDegree(d)}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                    allowedDegrees[d] 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' 
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                }`}
              >
                  {getDegreeLabel(d)}
              </button>
          ))}
      </div>

      {/* Progression Display */}
      <div className="flex-1 p-4 flex items-center gap-2 overflow-x-auto">
          {progression.map((bar, barIdx) => {
              const isCurrentBar = isPlaying && (currentMeasureIndex % 4 === barIdx);
              
              return (
                  <div key={barIdx} className={`flex-1 flex gap-1 p-2 rounded-xl border transition-colors duration-200 ${isCurrentBar ? 'bg-white/5 border-white/20' : 'border-transparent'}`}>
                      {bar.map((chord, cIdx) => {
                          const isActive = isCurrentBar && activeChordIdx === cIdx;
                          return (
                              <div key={cIdx} className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-100 ${isActive ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>
                                  <span className="text-2xl font-black tracking-tight">{chord.name}</span>
                                  <span className="text-[10px] opacity-60 font-mono">{chord.roman}</span>
                              </div>
                          );
                      })}
                  </div>
              )
          })}
      </div>
    </div>
  );
};

export default ChordGenerator;