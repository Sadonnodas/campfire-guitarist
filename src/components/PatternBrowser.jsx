import React, { useState } from 'react';
import { CheckCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

// --- VISUALIZERS ---

const MiniStrum = ({ steps }) => (
    <div className="flex gap-0.5 h-full items-center">
        {steps.map((step, idx) => (
            <div key={idx} className="w-3 text-center flex items-center justify-center">
                <span className={`text-[10px] font-black ${step.strum === ' ' ? 'opacity-0' : 'opacity-80'}`}>
                    {step.strum === 'D' ? '↓' : '↑'}
                </span>
            </div>
        ))}
    </div>
);

const MiniStaff = ({ steps, timeSig }) => {
    const width = 120;
    const height = 30;
    const y = 22;
    const stemH = 15;
    
    const totalDur = steps.reduce((a, b) => a + b.duration, 0) || 1;
    
    let acc = 0;
    const notes = steps.map(step => {
        const start = acc;
        acc += step.duration;
        return { ...step, start, isEighth: Math.abs(step.duration - 0.125) < 0.01 };
    });

    const groups = [];
    let currentGroup = [];
    const boundary = timeSig === '6/8' ? 0.375 : 0.25;

    notes.forEach(note => {
        if (currentGroup.length > 0) {
             const first = currentGroup[0];
             const groupBeat = Math.floor(first.start / boundary);
             const noteBeat = Math.floor(note.start / boundary);
             
             if (groupBeat === noteBeat && note.isEighth && note.strum !== ' ') {
                 currentGroup.push(note);
             } else {
                 groups.push(currentGroup);
                 currentGroup = [note];
             }
        } else {
            currentGroup = [note];
        }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    return (
        <svg width={width} height={height} className="opacity-70">
            <line x1={0} y1={y} x2={width} y2={y} stroke="#64748b" strokeWidth="1" />
            
            {groups.map((group, gIdx) => {
                const isBeam = group.length > 1;
                
                if (isBeam) {
                    const startX = (group[0].start / totalDur) * (width - 10) + 5;
                    const endX = (group[group.length-1].start / totalDur) * (width - 10) + 5;
                    const beamY = y - stemH;

                    return (
                        <g key={gIdx}>
                             <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#cbd5e1" strokeWidth="3" />
                             {group.map((note, nIdx) => {
                                 const x = (note.start / totalDur) * (width - 10) + 5;
                                 return (
                                     <g key={nIdx}>
                                        <ellipse cx={x} cy={y} rx="2.5" ry="2" fill="#cbd5e1" transform={`rotate(-15 ${x} ${y})`} />
                                        <line x1={x+2} y1={y} x2={x+2} y2={beamY} stroke="#cbd5e1" strokeWidth="1" />
                                     </g>
                                 )
                             })}
                        </g>
                    )
                } else {
                    const note = group[0];
                    const x = (note.start / totalDur) * (width - 10) + 5;
                    const isRest = note.strum === ' ';
                    
                    if (isRest) return <circle key={gIdx} cx={x} cy={y-5} r="1" fill="#64748b" />;
                    
                    return (
                        <g key={gIdx}>
                            <ellipse cx={x} cy={y} rx="2.5" ry="2" fill="#cbd5e1" transform={`rotate(-15 ${x} ${y})`} />
                            <line x1={x+2} y1={y} x2={x+2} y2={y-stemH} stroke="#cbd5e1" strokeWidth="1" />
                            {note.isEighth && <path d={`M${x+2} ${y-stemH} c 2 2 4 4 4 8`} stroke="#cbd5e1" strokeWidth="1" fill="none" />}
                        </g>
                    );
                }
            })}
        </svg>
    )
}

// --- MAIN COMPONENT ---

const PatternBrowser = () => {
  const { allPatterns, currentPatternId, selectPattern, generateRandomPattern, savePattern, renamePattern, deletePattern } = useRhythm();
  const [filter, setFilter] = useState('ALL');
  
  // --- EDIT STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleGenerate = () => {
      const newPattern = generateRandomPattern();
      savePattern(newPattern);
  };

  const startEditing = (e, pattern) => {
      e.stopPropagation();
      setEditingId(pattern.id);
      setEditName(pattern.name);
  };

  const saveEdit = () => {
      if (editingId && editName.trim()) {
          renamePattern(editingId, editName.trim());
      }
      setEditingId(null);
      setEditName('');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom pattern?')) {
        deletePattern(id);
    }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') setEditingId(null);
  };

  const filtered = allPatterns.filter(p => filter === 'ALL' || p.timeSig === filter);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
        {/* Header / Filter */}
        <div className="p-2 border-b border-white/5 flex gap-2 shrink-0">
            <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 text-xs text-white rounded px-2 outline-none border border-white/10"
            >
                <option value="ALL">All Times</option>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
            </select>
            <button 
                onClick={handleGenerate}
                className="flex-1 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white text-xs font-bold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 border border-orange-500/20"
            >
                <Plus size={12} /> Create Random
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filtered.map(p => {
                const isActive = p.id === currentPatternId;
                const isCustom = p.id.startsWith('custom');
                const isEditing = editingId === p.id;

                return (
                    <div 
                        key={p.id}
                        onClick={() => !isEditing && selectPattern(p.id)}
                        className={`p-2 rounded-lg border cursor-pointer group transition-all ${isActive ? 'bg-white/5 border-orange-500/50' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                        {/* Title Row */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex flex-col flex-1 mr-2">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <input 
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={handleKeyDown}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-slate-950 text-white text-sm font-bold rounded px-1 py-0.5 outline-none border border-orange-500 w-full"
                                        />
                                    ) : (
                                        <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>{p.name}</h4>
                                    )}
                                    
                                    {!isEditing && (
                                        <>
                                            <span className="text-[9px] text-slate-900 bg-slate-400/80 px-1.5 py-0.5 rounded font-black font-mono shrink-0">{p.timeSig}</span>
                                            {isCustom && <span className="text-[9px] text-blue-400 shrink-0">Custom</span>}
                                        </>
                                    )}
                                </div>
                                <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {p.description || "No description"}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                                {/* Edit & Delete for Custom Patterns */}
                                {isCustom && !isEditing && (
                                    <>
                                        <button 
                                            onClick={(e) => startEditing(e, p)}
                                            className="text-slate-500 hover:text-white transition-colors p-1"
                                            title="Rename"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, p.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </>
                                )}
                                {isActive && <CheckCircle size={14} className="text-orange-500 mt-1" />}
                            </div>
                        </div>
                        
                        {/* Dual Preview Row */}
                        <div className="flex items-center gap-4 bg-black/20 rounded p-2 h-10 overflow-hidden">
                            <div className="flex-1 border-r border-white/5">
                                <MiniStaff steps={p.steps} timeSig={p.timeSig} />
                            </div>
                            <div className="shrink-0 text-slate-400">
                                <MiniStrum steps={p.steps} />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default PatternBrowser;