import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const RhythmStaff = () => {
  const { currentPattern, currentStepIndex, regeneratePattern } = useRhythm();

  // Beaming Logic
  const groupedNotes = [];
  let currentGroup = [];
  let currentBeatDuration = 0;

  currentPattern.forEach((step, index) => {
    if (step.strum === ' ' || step.duration >= 0.25) {
      if (currentGroup.length > 0) {
        groupedNotes.push({ type: 'beam', notes: currentGroup });
        currentGroup = [];
        currentBeatDuration = 0;
      }
      groupedNotes.push({ type: 'single', note: step, originalIndex: index });
    } else {
      currentGroup.push({ ...step, originalIndex: index });
      currentBeatDuration += step.duration;
      if (currentBeatDuration >= 0.24) { // Close enough to a beat
        groupedNotes.push({ type: 'beam', notes: currentGroup });
        currentGroup = [];
        currentBeatDuration = 0;
      }
    }
  });
  if (currentGroup.length > 0) groupedNotes.push({ type: 'beam', notes: currentGroup });

  // DRAWING CONFIG
  const noteY = 70; 
  const stemHeight = 35;
  const spacing = 60; 
  const contentWidth = Math.max(600, currentPattern.length * spacing + 100);
  let currentX = 40;

  const renderNoteHead = (x, y, isActive, isRest, isGhost) => {
    const color = isActive ? "#f97316" : "#cbd5e1"; 
    if (isRest) return <rect x={x-6} y={y-10} width="12" height="20" fill={color} rx="2" opacity="0.3" />;
    return (
      <g>
        <ellipse cx={x} cy={y} rx="8" ry="6" fill={isGhost ? 'transparent' : color} stroke={color} strokeWidth="2" transform={`rotate(-15 ${x} ${y})`} />
        {isGhost && <text x={x} y={y + 4} textAnchor="middle" fontSize="14" fill={color} fontWeight="bold" style={{ pointerEvents: 'none' }}>x</text>}
      </g>
    );
  };
  
  const renderStrumSymbol = (x, y, type, isActive) => {
     const color = isActive ? "#f97316" : "#94a3b8"; 
     const symbol = type === 'D' ? '∏' : '∨';
     if (type === 'X') return null; // Mutes don't always need strum symbols, or use specific ones
     return <text x={x} y={type === 'D' ? y - 45 : y - 25} textAnchor="middle" fontSize="18" fill={color} fontWeight="bold">{symbol}</text>;
  };

  return (
    <div className="w-full h-full relative group">
      {/* Regenerate Button Overlay */}
      <button 
        onClick={regeneratePattern}
        className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors z-20 border border-white/5"
        title="New Rhythm Pattern"
      >
        <RefreshCcw size={14} />
      </button>

      <div className="w-full h-full overflow-x-auto bg-black/40 flex items-center no-scrollbar">
        <svg height="140" width={contentWidth}>
          <line x1="20" y1={noteY} x2={contentWidth - 20} y2={noteY} stroke="#475569" strokeWidth="2" />
          
          {groupedNotes.map((group, gIdx) => {
              if (group.type === 'single') {
                  const x = currentX; currentX += spacing;
                  const { note, originalIndex } = group;
                  const isActive = originalIndex === currentStepIndex;
                  const color = isActive ? "#f97316" : "#cbd5e1";
                  return (
                      <g key={gIdx}>
                          {renderNoteHead(x, noteY, isActive, note.strum === ' ', note.strum === 'X')}
                          {note.strum !== ' ' && (
                              <>
                                  <line x1={x + 6} y1={noteY} x2={x + 6} y2={noteY - stemHeight} stroke={color} strokeWidth="2" />
                                  {renderStrumSymbol(x, noteY, note.strum, isActive)}
                                  {/* Tails for single 8ths or 16ths */}
                                  {note.duration <= 0.13 && <path d={`M${x+6} ${noteY - stemHeight} Q${x+18} ${noteY - stemHeight + 12} ${x+18} ${noteY - stemHeight + 25}`} stroke={color} strokeWidth="2" fill="none" />}
                              </>
                          )}
                      </g>
                  );
              } else if (group.type === 'beam') {
                  const startX = currentX;
                  const notePositions = group.notes.map(n => {
                      const x = currentX; currentX += spacing;
                      return { x, note: n, isActive: n.originalIndex === currentStepIndex };
                  });
                  const lastX = notePositions[notePositions.length - 1].x;
                  const beamY = noteY - stemHeight;
                  return (
                      <g key={gIdx}>
                          <line x1={startX + 6} y1={beamY} x2={lastX + 6} y2={beamY} stroke="#cbd5e1" strokeWidth="5" />
                          {notePositions.map(({ x, note, isActive }, i) => {
                              const color = isActive ? "#f97316" : "#cbd5e1";
                              return (
                                  <g key={i}>
                                      {renderNoteHead(x, noteY, isActive, false, note.strum === 'X')}
                                      <line x1={x + 6} y1={noteY} x2={x + 6} y2={beamY} stroke={color} strokeWidth="2" />
                                      {renderStrumSymbol(x, noteY, note.strum, isActive)}
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
    </div>
  );
};

export default RhythmStaff;