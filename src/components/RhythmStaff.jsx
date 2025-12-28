import React from 'react';
import { useRhythm } from '../context/RhythmContext';

const RhythmStaff = () => {
  const { currentPattern, currentStepIndex, timeSig } = useRhythm();

  // STAFF CONFIG
  const STAFF_Y = 60;
  const STEM_HEIGHT = 35;
  const TOTAL_WIDTH = 550;
  
  // Total musical duration of the pattern (e.g., 4/4 = 1.0, 6/8 = 0.75)
  const patternDuration = currentPattern.reduce((acc, step) => acc + step.duration, 0) || 1;

  // Helper to map musical time (0 -> 1.0) to X pixels
  const getX = (time) => (time / patternDuration) * (TOTAL_WIDTH - 40) + 20;

  // --- PROCESSING STEPS INTO VISUAL NOTES ---
  let accumulated = 0;
  const processedNotes = currentPattern.map((step, idx) => {
    const note = {
        ...step,
        start: accumulated,
        originalIndex: idx,
        isDotted: (Math.abs(step.duration - 0.375) < 0.01) || (Math.abs(step.duration - 0.75) < 0.01),
        isQuarter: Math.abs(step.duration - 0.25) < 0.01,
        isEighth: Math.abs(step.duration - 0.125) < 0.01,
        isHalf: Math.abs(step.duration - 0.5) < 0.01,
    };
    accumulated += step.duration;
    return note;
  });

  // --- BEAMING LOGIC ---
  const groups = [];
  let currentGroup = [];
  
  // Define beat boundaries for grouping
  const GROUP_BOUNDARY = timeSig === '6/8' ? 0.375 : 0.25;

  processedNotes.forEach((note, i) => {
    if (currentGroup.length > 0) {
        const firstInGroup = currentGroup[0];
        const currentBeatStart = Math.floor(firstInGroup.start / GROUP_BOUNDARY) * GROUP_BOUNDARY;
        const noteBeatStart = Math.floor(note.start / GROUP_BOUNDARY) * GROUP_BOUNDARY;

        const isSameBeat = Math.abs(currentBeatStart - noteBeatStart) < 0.001;
        const canBeam = note.isEighth && note.strum !== ' ' && isSameBeat;

        if (canBeam) {
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


  // --- RENDERING HELPERS ---
  const renderNoteHead = (x, y, isActive, isHollow, isRest, isDotted) => (
    <g>
        {isRest ? (
            <path d={`M${x-4} ${y-10} L${x+4} ${y-5} L${x-4} ${y} L${x+4} ${y+5} L${x-2} ${y+10} Q${x} ${y+15} ${x-5} ${y+12}`} 
                  fill="none" stroke={isActive ? "#f97316" : "#94a3b8"} strokeWidth="2.5" />
        ) : (
            <>
                <ellipse cx={x} cy={y} rx="6" ry="5" 
                         fill={isHollow ? "none" : (isActive ? "#f97316" : "#cbd5e1")} 
                         stroke={isActive ? "#f97316" : "#cbd5e1"} strokeWidth="2" 
                         transform={`rotate(-15 ${x} ${y})`} />
                {isDotted && <circle cx={x + 10} cy={y} r="2" fill={isActive ? "#f97316" : "#cbd5e1"} />}
            </>
        )}
    </g>
  );

  const renderStrumSymbol = (x, y, type, isActive) => {
      if (type === 'D') return <path d={`M${x-3} ${y+45} h6 v-4 h-6 z`} stroke={isActive ? "#f97316" : "#64748b"} strokeWidth="2" fill="none"/>; 
      if (type === 'U') return <path d={`M${x} ${y+40} l-3 5 h6 z`} fill={isActive ? "#f97316" : "#64748b"} />;
      return null;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${TOTAL_WIDTH} 180`} preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1={STAFF_Y} x2={TOTAL_WIDTH-20} y2={STAFF_Y} stroke="#334155" strokeWidth="2" />

        {groups.map((group, gIdx) => {
            const isBeam = group.length > 1;
            
            if (isBeam) {
                const first = group[0];
                const last = group[group.length - 1];
                const startX = getX(first.start) + 6; 
                const endX = getX(last.start) + 6;
                const beamY = STAFF_Y - STEM_HEIGHT;

                return (
                    <g key={gIdx}>
                        <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#cbd5e1" strokeWidth="5" />
                        
                        {group.map((note, nIdx) => {
                            const x = getX(note.start);
                            const isActive = note.originalIndex === currentStepIndex;
                            const color = isActive ? "#f97316" : "#cbd5e1";
                            return (
                                <g key={nIdx}>
                                    {renderNoteHead(x, STAFF_Y, isActive, false, false, note.isDotted)}
                                    <line x1={x + 6} y1={STAFF_Y} x2={x + 6} y2={beamY} stroke={color} strokeWidth="2" />
                                    {renderStrumSymbol(x, STAFF_Y, note.strum, isActive)}
                                </g>
                            )
                        })}
                    </g>
                )
            } else {
                const note = group[0];
                const x = getX(note.start);
                const isActive = note.originalIndex === currentStepIndex;
                const color = isActive ? "#f97316" : "#cbd5e1";
                const isRest = note.strum === ' ';
                const isHollow = note.isHalf;

                return (
                    <g key={gIdx}>
                        {renderNoteHead(x, STAFF_Y, isActive, isHollow, isRest, note.isDotted)}
                        
                        {!isRest && (
                            <>
                                <line x1={x + 6} y1={STAFF_Y} x2={x + 6} y2={STAFF_Y - STEM_HEIGHT} stroke={color} strokeWidth="2" />
                                {note.isEighth && <path d={`M${x+6} ${STAFF_Y - STEM_HEIGHT} c 4 5 8 8 8 16`} stroke={color} strokeWidth="2" fill="none" />}
                            </>
                        )}
                        {renderStrumSymbol(x, STAFF_Y, note.strum, isActive)}
                    </g>
                );
            }
        })}
      </svg>
    </div>
  );
};

export default RhythmStaff;