import React, { useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const RhythmStaff = () => {
  const { currentPattern, currentStepIndex, regeneratePattern } = useRhythm();
  const containerRef = useRef(null);
  
  // 1. Process Pattern for Drawing
  let accumulated = 0;
  const notesWithPosition = currentPattern.map((step, index) => {
    const startPos = accumulated;
    accumulated += step.duration;
    return { ...step, originalIndex: index, startPos };
  });
  
  // Total duration (e.g. 1.0 for 4/4)
  const totalDuration = accumulated || 1;

  // 2. Beaming Logic
  const groupedNotes = [];
  let currentGroup = [];
  let groupStartTime = -1;

  // Helper to push groups safely
  const pushGroup = () => {
    if (currentGroup.length === 0) return;
    
    // FIX: If a "beam" group has only 1 note, treat it as a single note so it gets a flag
    if (currentGroup.length === 1) {
        groupedNotes.push({ type: 'single', note: currentGroup[0] });
    } else {
        groupedNotes.push({ type: 'beam', notes: currentGroup, startTime: groupStartTime });
    }
    currentGroup = [];
  };

  notesWithPosition.forEach((note) => {
    // Break beams on rests or long notes (>= quarter note)
    if (note.strum === ' ' || note.duration >= 0.25) {
      pushGroup();
      groupedNotes.push({ type: 'single', note: note });
    } else {
      if (currentGroup.length === 0) groupStartTime = note.startPos;
      currentGroup.push(note);
      
      // Break beams on beats (every 0.25)
      // Check if this note ends on or crosses a beat boundary
      const noteEnd = note.startPos + note.duration;
      // Use small epsilon for float comparison
      if ((noteEnd + 0.001) % 0.25 < 0.01) {
         pushGroup();
      }
    }
  });
  pushGroup();

  // 3. Coordinate System
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 180;
  const PADDING_X = 60;
  const DRAWABLE_WIDTH = SVG_WIDTH - (PADDING_X * 2);
  
  const getX = (time) => {
    return PADDING_X + ((time / totalDuration) * DRAWABLE_WIDTH);
  };

  const NOTE_Y = 100;
  const STEM_HEIGHT = 45;

  // --- RENDER HELPERS ---

  const renderRest = (x, y, duration, color) => {
    // EIGHTH REST (looks like a 7 with a ball)
    if (duration <= 0.13) {
        return (
            <g transform={`translate(${x - 4}, ${y - 15}) scale(1.5)`}>
                <circle cx="2" cy="3" r="2.5" fill={color} />
                <path d="M 2 3 Q 8 0 4 10 L 0 20" stroke={color} strokeWidth="1.5" fill="none" />
            </g>
        );
    } 
    // QUARTER REST (Squiggle)
    else {
        return (
            <g transform={`translate(${x - 5}, ${y - 20}) scale(1.2)`}>
                <path 
                    d="M 2 0 L 8 8 L 2 18 L 7 22 L 4 28" 
                    stroke={color} 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                <path 
                    d="M 4 28 Q 2 32 6 30" 
                    stroke={color} 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeLinecap="round"
                />
            </g>
        );
    }
  };

  const renderNoteHead = (x, y, isActive, isRest, isGhost, duration) => {
    const color = isActive ? "#f97316" : "#cbd5e1"; 
    
    if (isRest) {
        return renderRest(x, y, duration, color);
    }
    
    return (
      <g>
        <ellipse 
            cx={x} cy={y} 
            rx="9" ry="7" 
            fill={isGhost ? 'transparent' : color} 
            stroke={color} 
            strokeWidth="2" 
            transform={`rotate(-15 ${x} ${y})`} 
        />
        {isGhost && <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill={color} fontWeight="bold" style={{ pointerEvents: 'none' }}>x</text>}
      </g>
    );
  };
  
  const renderStrumSymbol = (x, y, type, isActive) => {
     const color = isActive ? "#f97316" : "#94a3b8"; 
     if (type === 'X') return null; 
     
     return (
        <text 
            x={x} y={type === 'D' ? y - 60 : y - 25} 
            textAnchor="middle" 
            fontSize="20" 
            fill={color} 
            fontWeight="bold"
        >
            {type === 'D' ? '∏' : '∨'}
        </text>
     );
  };

  return (
    <div className="w-full h-full relative group bg-black/20" ref={containerRef}>
      <button 
        onClick={regeneratePattern}
        className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors z-20 border border-white/5"
        title="New Rhythm Pattern"
      >
        <RefreshCcw size={14} />
      </button>

      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full">
        <line x1="20" y1={NOTE_Y} x2={SVG_WIDTH - 20} y2={NOTE_Y} stroke="#475569" strokeWidth="2" />
        
        {groupedNotes.map((group, gIdx) => {
            if (group.type === 'single') {
                const x = getX(group.note.startPos);
                const { note } = group;
                const isActive = note.originalIndex === currentStepIndex;
                const color = isActive ? "#f97316" : "#cbd5e1";
                
                return (
                    <g key={gIdx}>
                        {renderNoteHead(x, NOTE_Y, isActive, note.strum === ' ', note.strum === 'X', note.duration)}
                        {note.strum !== ' ' && (
                            <>
                                {/* Stem */}
                                <line x1={x + 8} y1={NOTE_Y} x2={x + 8} y2={NOTE_Y - STEM_HEIGHT} stroke={color} strokeWidth="2" />
                                {renderStrumSymbol(x, NOTE_Y, note.strum, isActive)}
                                
                                {/* Flag (if 8th note and single) */}
                                {note.duration <= 0.13 && (
                                    <path d={`M${x+8} ${NOTE_Y - STEM_HEIGHT} Q${x+20} ${NOTE_Y - STEM_HEIGHT + 15} ${x+20} ${NOTE_Y - STEM_HEIGHT + 30}`} stroke={color} strokeWidth="3" fill="none" />
                                )}
                                {/* Double Flag (if 16th note and single) */}
                                {note.duration <= 0.07 && (
                                    <path d={`M${x+8} ${NOTE_Y - STEM_HEIGHT + 10} Q${x+20} ${NOTE_Y - STEM_HEIGHT + 25} ${x+20} ${NOTE_Y - STEM_HEIGHT + 40}`} stroke={color} strokeWidth="3" fill="none" />
                                )}
                            </>
                        )}
                    </g>
                );
            } else if (group.type === 'beam') {
                const startX = getX(group.notes[0].startPos) + 8;
                const lastX = getX(group.notes[group.notes.length-1].startPos) + 8;
                const beamY = NOTE_Y - STEM_HEIGHT;
                
                return (
                    <g key={gIdx}>
                        {/* Beam Bar */}
                        <line x1={startX} y1={beamY} x2={lastX} y2={beamY} stroke="#cbd5e1" strokeWidth="6" />
                        
                        {group.notes.map((note, i) => {
                            const x = getX(note.startPos);
                            const isActive = note.originalIndex === currentStepIndex;
                            const color = isActive ? "#f97316" : "#cbd5e1";
                            return (
                                <g key={i}>
                                    {renderNoteHead(x, NOTE_Y, isActive, false, note.strum === 'X', note.duration)}
                                    <line x1={x + 8} y1={NOTE_Y} x2={x + 8} y2={beamY} stroke={color} strokeWidth="2" />
                                    {renderStrumSymbol(x, NOTE_Y, note.strum, isActive)}
                                </g>
                            )
                        })}
                    </g>
                );
            }
            return null;
        })}
      </svg>
    </div>
  );
};

export default RhythmStaff;