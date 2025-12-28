import React from 'react';
import { useRhythm } from '../context/RhythmContext';

const RhythmStaff = () => {
  const { currentPattern, currentStepIndex, timeSig } = useRhythm();

  // STAFF CONFIG
  const STAFF_Y = 80;
  const STEM_HEIGHT = 45;
  const TOTAL_WIDTH = 550;
  
  const patternDuration = currentPattern.reduce((acc, step) => acc + step.duration, 0) || 1;
  const getX = (time) => (time / patternDuration) * (TOTAL_WIDTH - 40) + 20;

  // --- 1. IDENTIFY & PROCESS NOTES ---
  let accumulated = 0;
  const processedNotes = currentPattern.map((step, idx) => {
    const d = step.duration;
    // Tolerances for float precision
    const isSixteenth = Math.abs(d - 0.0625) < 0.02; 
    const isEighth = Math.abs(d - 0.125) < 0.02;     
    const isQuarter = Math.abs(d - 0.25) < 0.02;     
    const isTriplet = Math.abs(d - (1/12)) < 0.02;   
    const isDotted8 = Math.abs(d - 0.1875) < 0.02;   
    const isDotted4 = Math.abs(d - 0.375) < 0.02;    

    const note = {
        ...step,
        start: accumulated,
        originalIndex: idx,
        isSixteenth, isEighth, isQuarter, isTriplet, isDotted8, isDotted4,
        isRest: step.strum === ' ',
        // Rests are NEVER beamable
        isBeamable: (d < 0.24) && step.strum !== ' ' 
    };
    accumulated += d;
    return note;
  });

  // --- 2. GROUPING LOGIC ---
  const groups = [];
  let currentGroup = [];
  const BEAT_BOUNDARY = timeSig === '6/8' ? 0.375 : 0.25;

  processedNotes.forEach((note) => {
    if (currentGroup.length > 0) {
        const first = currentGroup[0];
        
        // Calculate Beat Blocks
        const groupBeat = Math.floor((first.start + 0.001) / BEAT_BOUNDARY);
        const noteBeat = Math.floor((note.start + 0.001) / BEAT_BOUNDARY);
        
        // Grouping Rules: Same Beat + Both are Notes (Not Rests)
        const sameBeat = groupBeat === noteBeat;
        const bothBeamable = note.isBeamable && first.isBeamable;

        if (sameBeat && bothBeamable) {
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

  const renderRestSymbol = (x, y, note, isActive) => {
      const color = isActive ? "#f97316" : "#64748b"; // Orange or Slate
      
      if (note.isQuarter || note.isDotted4 || note.duration >= 0.2) {
          // Quarter Rest (Squiggly)
          return (
              <path 
                d={`M${x-4} ${y-12} L${x+2} ${y-6} L${x-5} ${y+2} L${x+2} ${y+8} Q${x+5} ${y+12} ${x} ${y+15}`} 
                fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
              />
          );
      }
      
      if (note.isEighth || note.isDotted8 || note.isTriplet) {
          // Eighth Rest (7-style dot)
          return (
              <g transform={`translate(${x-4}, ${y-5}) scale(0.9)`}>
                  <circle cx="2" cy="4" r="3.5" fill={color} />
                  <path d="M4 2 Q8 0 8 -8 M8 -8 L0 16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
          );
      }

      if (note.isSixteenth) {
          // Sixteenth Rest (Double 7-style)
          return (
            <g transform={`translate(${x-4}, ${y}) scale(0.9)`}>
                <circle cx="2" cy="0" r="3" fill={color} />
                <path d="M4 -2 Q8 -4 8 -12 M8 -12 L-2 12" stroke={color} strokeWidth="2" fill="none" />
                <circle cx="0" cy="10" r="3" fill={color} />
                <path d="M2 8 Q6 6 6 -2" stroke={color} strokeWidth="2" fill="none" />
            </g>
          );
      }

      // Fallback for weird durations: Simple Block
      return <rect x={x-3} y={y-4} width="6" height="8" fill={color} rx="1" />;
  };

  const renderNoteHead = (x, y, isActive, note) => {
     const fill = isActive ? "#f97316" : "#cbd5e1";
     const showDot = note.isDotted4 || note.isDotted8;

     return (
        <g>
            <ellipse cx={x} cy={y} rx="6" ry="5" fill={fill} transform={`rotate(-15 ${x} ${y})`} />
            {showDot && <circle cx={x + 10} cy={y} r="2" fill={fill} />}
        </g>
     );
  };

  const renderSingleFlag = (x, y, note, color) => {
      // No flags for quarters or rests
      if (note.isQuarter || note.isDotted4 || note.isRest) return null;

      const topY = y - STEM_HEIGHT;
      
      // Eighth Flag
      if (note.isEighth || note.isDotted8 || note.isTriplet) {
        return <path d={`M${x+6} ${topY} c 6 8 8 12 8 20`} stroke={color} strokeWidth="2" fill="none" />;
      }
      // Sixteenth Flag (Double)
      if (note.isSixteenth) {
        return (
            <g>
                <path d={`M${x+6} ${topY} c 6 8 8 12 8 20`} stroke={color} strokeWidth="2" fill="none" />
                <path d={`M${x+6} ${topY+8} c 6 8 8 12 8 20`} stroke={color} strokeWidth="2" fill="none" />
            </g>
        );
      }
      return null;
  };

  const renderStrumArrow = (x, y, type, isActive) => {
      const color = isActive ? "#f97316" : "#64748b";
      if (type === 'D') return <path d={`M${x-3} ${y+45} h6 v-4 h-6 z`} stroke={color} strokeWidth="2" fill="none"/>; 
      if (type === 'U') return <path d={`M${x} ${y+40} l-3 5 h6 z`} fill={color} />;
      return null;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${TOTAL_WIDTH} 200`} preserveAspectRatio="xMidYMid meet">
        
        {/* Staff Line */}
        <line x1="20" y1={STAFF_Y} x2={TOTAL_WIDTH-20} y2={STAFF_Y} stroke="#334155" strokeWidth="2" />

        {groups.map((group, gIdx) => {
            const isBeam = group.length > 1;
            const hasTriplets = group.some(n => n.isTriplet);

            if (isBeam) {
                // --- BEAMED GROUP ---
                const first = group[0];
                const last = group[group.length - 1];
                const startX = getX(first.start) + 6; 
                const endX = getX(last.start) + 6;
                const beamY = STAFF_Y - STEM_HEIGHT;

                return (
                    <g key={gIdx}>
                        {hasTriplets && (
                            <g>
                                <text x={(startX + endX)/2} y={beamY - 10} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">3</text>
                                <path d={`M${startX} ${beamY-5} v-5 h${endX-startX} v5`} fill="none" stroke="#94a3b8" strokeWidth="1" />
                            </g>
                        )}

                        <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#cbd5e1" strokeWidth="5" />

                        {group.map((note, nIdx) => {
                            const x = getX(note.start);
                            const isActive = note.originalIndex === currentStepIndex;
                            const color = isActive ? "#f97316" : "#cbd5e1";
                            
                            // Sub-beam for 16ths
                            let drawSubBeamRight = false;
                            if (nIdx < group.length - 1) {
                                const next = group[nIdx+1];
                                if (note.isSixteenth && (next.isSixteenth || next.isDotted8)) drawSubBeamRight = true;
                                if (note.isDotted8 && next.isSixteenth) drawSubBeamRight = true; 
                            }
                            const subBeamY = beamY + 8; 

                            return (
                                <g key={nIdx}>
                                    <line x1={x + 6} y1={STAFF_Y} x2={x + 6} y2={beamY} stroke={color} strokeWidth="2" />
                                    {drawSubBeamRight && (
                                        <line x1={x+6} y1={subBeamY} x2={getX(group[nIdx+1].start)+6} y2={subBeamY} stroke="#cbd5e1" strokeWidth="3" />
                                    )}
                                    {renderNoteHead(x, STAFF_Y, isActive, note)}
                                    {renderStrumArrow(x, STAFF_Y, note.strum, isActive)}
                                </g>
                            )
                        })}
                    </g>
                )
            } else {
                // --- SINGLE ITEM (NOTE OR REST) ---
                const note = group[0];
                const x = getX(note.start);
                const isActive = note.originalIndex === currentStepIndex;
                const color = isActive ? "#f97316" : "#cbd5e1";

                if (note.isRest) {
                    return (
                        <g key={gIdx}>
                            {renderRestSymbol(x, STAFF_Y, note, isActive)}
                        </g>
                    );
                }

                return (
                    <g key={gIdx}>
                        {renderNoteHead(x, STAFF_Y, isActive, note)}
                        <line x1={x + 6} y1={STAFF_Y} x2={x + 6} y2={STAFF_Y - STEM_HEIGHT} stroke={color} strokeWidth="2" />
                        {renderSingleFlag(x, STAFF_Y, note, color)}
                        {renderStrumArrow(x, STAFF_Y, note.strum, isActive)}
                    </g>
                );
            }
        })}
      </svg>
    </div>
  );
};

export default RhythmStaff;