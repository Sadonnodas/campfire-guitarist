import React, { useState, useEffect } from 'react';
import { Wand2, Edit, Save, Plus, ArrowRight, RotateCcw } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const PatternCreator = () => {
  const { createNewRandomPattern, currentPattern, currentPatternId, savePattern } = useRhythm();
  const [mode, setMode] = useState('generate'); // 'generate' or 'edit'

  // --- GENERATOR STATE ---
  const [genTimeSig, setGenTimeSig] = useState('4/4');
  const [allowedTypes, setAllowedTypes] = useState({
      quarter: true,
      eighth: true,
      sixteenth: false,
      dotted8: false,
      dotted4: false,
      triplet: false
  });

  // --- EDITOR STATE ---
  const [editSteps, setEditSteps] = useState([]);
  
  // Sync editor with current pattern when opening
  useEffect(() => {
    setEditSteps(currentPattern);
  }, [currentPattern]);

  const handleGenerate = () => {
      const types = Object.keys(allowedTypes).filter(k => allowedTypes[k]);
      if (types.length === 0) {
          alert("Please select at least one rhythm type.");
          return;
      }
      createNewRandomPattern({
          timeSig: genTimeSig,
          allowedTypes: types
      });
  };

  // --- EDITOR FUNCTIONS ---
  const toggleStrum = (index) => {
      const newSteps = [...editSteps];
      const s = newSteps[index];
      // Cycle: D -> U -> Rest -> D
      if (s.strum === 'D') s.strum = 'U';
      else if (s.strum === 'U') s.strum = ' ';
      else s.strum = 'D';
      
      setEditSteps(newSteps);
  };

  const handleSaveEdit = () => {
      savePattern({
          id: currentPatternId, // Overwrite current if custom
          steps: editSteps,
          // If it was a default pattern, savePattern context logic will force a new ID creation
      });
      alert("Pattern Saved!");
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
        {/* TABS */}
        <div className="flex border-b border-white/5 bg-black/20">
            <button 
                onClick={() => setMode('generate')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mode==='generate' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                <Wand2 size={14} /> New Random
            </button>
            <button 
                onClick={() => setMode('edit')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mode==='edit' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                <Edit size={14} /> Edit Current
            </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">
            
            {/* --- GENERATOR MODE --- */}
            {mode === 'generate' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Time Signature</label>
                        <div className="flex gap-2">
                            {['4/4', '3/4', '6/8'].map(ts => (
                                <button 
                                    key={ts}
                                    onClick={() => setGenTimeSig(ts)}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold border ${genTimeSig === ts ? 'bg-white/10 border-white/30 text-white' : 'border-slate-700 text-slate-500'}`}
                                >
                                    {ts}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Allowed Rhythms</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'quarter', label: 'Quarter (1/4)' },
                                { id: 'eighth', label: 'Eighth (1/8)' },
                                { id: 'sixteenth', label: 'Sixteenth (1/16)' },
                                { id: 'dotted4', label: 'Dotted Quarter' },
                                { id: 'dotted8', label: 'Dotted Eighth' },
                                { id: 'triplet', label: 'Triplets' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setAllowedTypes(p => ({...p, [type.id]: !p[type.id]}))}
                                    className={`py-2 px-3 rounded text-left text-xs font-semibold border transition-all ${allowedTypes[type.id] ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-black/20 border-transparent text-slate-500'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        className="w-full py-3 mt-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                        <Wand2 size={16} /> Generate Pattern
                    </button>
                </div>
            )}

            {/* --- EDITOR MODE --- */}
            {mode === 'edit' && (
                <div className="space-y-4">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold text-center">Tap steps to change strum</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {editSteps.map((step, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => toggleStrum(idx)}
                                    className={`
                                        h-12 min-w-[30px] flex-1 rounded flex flex-col items-center justify-center border transition-all
                                        ${step.strum !== ' ' ? 'bg-white/10 border-white/20' : 'bg-black/40 border-slate-800 opacity-50'}
                                    `}
                                    title={`Duration: ${step.duration.toFixed(3)}`}
                                >
                                    <span className={`text-lg font-black ${step.strum === 'D' ? 'text-orange-400' : (step.strum === 'U' ? 'text-blue-400' : 'text-slate-600')}`}>
                                        {step.strum === 'D' ? '↓' : (step.strum === 'U' ? '↑' : '-')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-4">
                            Note: Full duration editing (adding/removing beats) requires regeneration to keep the measure valid. 
                            Use the Generator tab to create new base structures!
                        </p>
                        <button 
                            onClick={handleSaveEdit}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PatternCreator;