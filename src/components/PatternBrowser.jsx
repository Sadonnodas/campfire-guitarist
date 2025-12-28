import React, { useState } from 'react';
import { CheckCircle, Plus, Pencil, Trash2, Wand2, Play, Save, RotateCcw } from 'lucide-react';
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
        const d = step.duration;
        return { 
            ...step, 
            start, 
            isSixteenth: Math.abs(d - 0.0625) < 0.02,
            isEighth: Math.abs(d - 0.125) < 0.02,
            isRest: step.strum === ' ',
            isBeamable: (d < 0.24) && step.strum !== ' '
        };
    });

    const groups = [];
    let currentGroup = [];
    const boundary = timeSig === '6/8' ? 0.375 : 0.25;

    notes.forEach(note => {
        if (currentGroup.length > 0) {
             const first = currentGroup[0];
             const groupBeat = Math.floor(first.start / boundary);
             const noteBeat = Math.floor(note.start / boundary);
             
             if (groupBeat === noteBeat && note.isBeamable && currentGroup[0].isBeamable) {
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
                             <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#cbd5e1" strokeWidth="2" />
                             {group.map((note, nIdx) => {
                                 const x = (note.start / totalDur) * (width - 10) + 5;
                                 let subBeam = false;
                                 if (nIdx < group.length - 1) {
                                     if (note.isSixteenth && group[nIdx+1].isSixteenth) subBeam = true;
                                 }
                                 return (
                                     <g key={nIdx}>
                                        <ellipse cx={x} cy={y} rx="2.5" ry="2" fill="#cbd5e1" transform={`rotate(-15 ${x} ${y})`} />
                                        <line x1={x+2} y1={y} x2={x+2} y2={beamY} stroke="#cbd5e1" strokeWidth="1" />
                                        {subBeam && <line x1={x+2} y1={beamY+4} x2={(group[nIdx+1].start / totalDur)*(width-10)+7} y2={beamY+4} stroke="#cbd5e1" strokeWidth="2" />}
                                     </g>
                                 )
                             })}
                        </g>
                    )
                } else {
                    const note = group[0];
                    const x = (note.start / totalDur) * (width - 10) + 5;
                    
                    if (note.isRest) return <circle key={gIdx} cx={x} cy={y-5} r="1.5" fill="#64748b" />;
                    
                    return (
                        <g key={gIdx}>
                            <ellipse cx={x} cy={y} rx="2.5" ry="2" fill="#cbd5e1" transform={`rotate(-15 ${x} ${y})`} />
                            <line x1={x+2} y1={y} x2={x+2} y2={y-stemH} stroke="#cbd5e1" strokeWidth="1" />
                            {note.isEighth && <path d={`M${x+2} ${y-stemH} c 2 2 4 4 4 8`} stroke="#cbd5e1" strokeWidth="1" fill="none" />}
                            {note.isSixteenth && (
                                <g>
                                    <path d={`M${x+2} ${y-stemH} c 2 2 4 4 4 8`} stroke="#cbd5e1" strokeWidth="1" fill="none" />
                                    <path d={`M${x+2} ${y-stemH+4} c 2 2 4 4 4 8`} stroke="#cbd5e1" strokeWidth="1" fill="none" />
                                </g>
                            )}
                        </g>
                    );
                }
            })}
        </svg>
    )
}

// --- MAIN COMPONENT ---

const PatternBrowser = () => {
  const { allPatterns, currentPatternId, selectPattern, previewDraftPattern, savePattern, renamePattern, deletePattern } = useRhythm();
  const [filter, setFilter] = useState('ALL');
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genTimeSig, setGenTimeSig] = useState('4/4');
  const [genTypes, setGenTypes] = useState({ 
      quarter: true, 
      eighth: true, 
      sixteenth: false, 
      triplet: false,
      dotted4: false,
      dotted8: false 
  });
  const [draftSteps, setDraftSteps] = useState(null);
  const [draftName, setDraftName] = useState('');

  // --- ACTIONS ---

  const handleOpenGenerator = () => {
      setIsModalOpen(true);
      setDraftSteps(null);
      setDraftName('');
  };

  const handlePreview = () => {
      const types = Object.keys(genTypes).filter(k => genTypes[k]);
      if (types.length === 0) return alert("Select at least one rhythm type");
      
      const steps = previewDraftPattern({ timeSig: genTimeSig, allowedTypes: types });
      setDraftSteps(steps);
  };

  const handleSaveDraft = () => {
      if (!draftName.trim()) return alert("Please name your rhythm");
      savePattern({
          name: draftName,
          timeSig: genTimeSig,
          steps: draftSteps
      });
      setIsModalOpen(false);
  };

  const startEditing = (e, pattern) => {
      e.stopPropagation();
      setEditingId(pattern.id);
      setEditName(pattern.name);
  };

  const saveEdit = () => {
      if (editingId && editName.trim()) renamePattern(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this pattern?')) deletePattern(id);
  };

  const filtered = allPatterns.filter(p => filter === 'ALL' || p.timeSig === filter);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 relative">
        
        {/* --- GENERATOR MODAL --- */}
        {isModalOpen && (
            <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><Wand2 size={18} className="text-orange-500" /> New Random Rhythm</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">Close</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Time Sig */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Time Signature</label>
                        <div className="flex gap-2">
                            {['4/4', '3/4', '6/8'].map(ts => (
                                <button key={ts} onClick={() => setGenTimeSig(ts)} className={`flex-1 py-2 rounded font-bold text-sm border ${genTimeSig === ts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                    {ts}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rhythms */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Include Rhythms</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'quarter', label: 'Quarter Notes' },
                                { id: 'eighth', label: 'Eighth Notes' },
                                { id: 'sixteenth', label: 'Sixteenths' },
                                { id: 'triplet', label: 'Triplets' },
                                { id: 'dotted4', label: 'Dotted Quarter' },
                                { id: 'dotted8', label: 'Dotted 8th' },
                            ].map(t => (
                                <button key={t.id} onClick={() => setGenTypes(p=>({...p, [t.id]:!p[t.id]}))} className={`py-2 px-3 rounded text-left text-xs font-semibold border transition-all ${genTypes[t.id] ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-black/20 border-transparent text-slate-500'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Action */}
                    <div className="pt-2">
                        <button onClick={handlePreview} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2">
                            <Wand2 size={16} /> {draftSteps ? 'Regenerate' : 'Generate Pattern'}
                        </button>
                    </div>

                    {/* Save Section */}
                    {draftSteps && (
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 space-y-3 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wide justify-center">
                                <span>Press <Play size={10} className="inline mx-1"/> to Preview</span>
                            </div>
                            <input 
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                placeholder="Give it a name..."
                                className="w-full bg-slate-950 text-white text-sm p-3 rounded-lg border border-slate-700 outline-none focus:border-orange-500"
                            />
                            <button onClick={handleSaveDraft} className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                                <Save size={16} /> Save to Library
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- BROWSER HEADER --- */}
        <div className="p-2 border-b border-white/5 flex gap-2 shrink-0">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-800 text-xs text-white rounded px-2 outline-none border border-white/10">
                <option value="ALL">All Times</option>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
            </select>
            <button onClick={handleOpenGenerator} className="flex-1 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white text-xs font-bold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 border border-orange-500/20">
                <Plus size={12} /> Create Random
            </button>
        </div>

        {/* --- LIST --- */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filtered.map(p => {
                const isActive = p.id === currentPatternId;
                const isCustom = p.id.startsWith('custom');
                const isEditing = editingId === p.id;

                return (
                    <div key={p.id} onClick={() => !isEditing && selectPattern(p.id)} className={`p-2 rounded-lg border cursor-pointer group transition-all ${isActive ? 'bg-white/5 border-orange-500/50' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex flex-col flex-1 mr-2">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={saveEdit} className="bg-slate-950 text-white text-sm font-bold rounded px-1 py-0.5 outline-none border border-orange-500 w-full"/>
                                    ) : (
                                        <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>{p.name}</h4>
                                    )}
                                    {!isEditing && <span className="text-[9px] text-slate-900 bg-slate-400/80 px-1.5 py-0.5 rounded font-black font-mono shrink-0">{p.timeSig}</span>}
                                </div>
                                <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{p.description || "No description"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {isCustom && !isEditing && (
                                    <>
                                        <button onClick={(e) => startEditing(e, p)} className="text-slate-500 hover:text-white p-1"><Pencil size={12} /></button>
                                        <button onClick={(e) => handleDelete(e, p.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                                    </>
                                )}
                                {isActive && <CheckCircle size={14} className="text-orange-500 mt-1" />}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-black/20 rounded p-2 h-10 overflow-hidden">
                            <div className="flex-1 border-r border-white/5"><MiniStaff steps={p.steps} timeSig={p.timeSig} /></div>
                            <div className="shrink-0 text-slate-400"><MiniStrum steps={p.steps} /></div>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default PatternBrowser;