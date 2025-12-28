import React, { useState } from 'react';
import { useRhythm } from '../context/RhythmContext';

const RhythmCount = () => {
  const { measureProgress, timeSig, isPlaying, isCountingIn, countInBeat } = useRhythm();
  const [resolution, setResolution] = useState('8th'); 

  // --- COUNT IN OVERLAY MODE ---
  if (isCountingIn) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-black/40 rounded-xl border border-white/5 relative overflow-hidden">
             {/* Pulsing Count */}
             <div className="flex flex-col items-center z-10 animate-in zoom-in duration-300 key={countInBeat}">
                 <span className="text-8xl font-black text-orange-500 tracking-tighter drop-shadow-lg">
                    {/* For 6/8, map 4,5,6 to 1,2,3 visually */}
                    {timeSig === '6/8' ? ((countInBeat - 1) % 3) + 1 : countInBeat}
                 </span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Get Ready</span>
             </div>
             
             {/* Background Pulse Effect */}
             <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
        </div>
      )
  }

  // --- STANDARD GRID DISPLAY ---
  const getGrid = () => {
    const items = [];
    
    if (timeSig === '6/8') {
        if (resolution === '16th') {
             for(let i=1; i<=6; i++) {
                 const t = (i-1) * 0.125;
                 items.push({ label: `${i}`, time: t, isBeat: true });
                 items.push({ label: '+', time: t + 0.0625, isBeat: false });
             }
        } else {
             for(let i=1; i<=6; i++) {
                 items.push({ label: `${i}`, time: (i-1) * 0.125, isBeat: true });
             }
        }
    } else {
        const beats = timeSig === '3/4' ? 3 : 4;
        if (resolution === '4th') {
            for(let i=1; i<=beats; i++) items.push({ label: `${i}`, time: (i-1)*0.25, isBeat: true });
        } else if (resolution === '8th') {
            for(let i=1; i<=beats; i++) {
                const t = (i-1)*0.25;
                items.push({ label: `${i}`, time: t, isBeat: true });
                items.push({ label: '+', time: t+0.125, isBeat: false });
            }
        } else {
            for(let i=1; i<=beats; i++) {
                const t = (i-1)*0.25;
                items.push({ label: `${i}`, time: t, isBeat: true });
                items.push({ label: 'e', time: t+0.0625, isBeat: false });
                items.push({ label: '+', time: t+0.125, isBeat: false });
                items.push({ label: 'a', time: t+0.1875, isBeat: false });
            }
        }
    }
    return items;
  };

  const gridItems = getGrid();
  
  // Normalize measure progress for 6/8 (0.75 total) vs 4/4 (1.0 total)
  const duration = timeSig === '6/8' || timeSig === '3/4' ? 0.75 : 1.0;
  // If loop wraps, ensure we don't flash index 0 at end
  const currentProgress = measureProgress >= duration - 0.01 ? 0 : measureProgress;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 p-2 gap-2">
      {/* Res Toggles */}
      <div className="flex justify-center gap-1 border-b border-white/5 pb-2">
         {['4th', '8th', '16th'].map(res => (
             <button 
                key={res}
                onClick={() => setResolution(res)}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${resolution === res ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
             >
                {res}
             </button>
         ))}
      </div>

      {/* Grid Display */}
      <div className="flex-1 flex items-center justify-between gap-1">
         {gridItems.map((item, idx) => {
             const isActive = isPlaying && Math.abs(currentProgress - item.time) < (resolution === '16th' ? 0.03 : 0.06);
             
             return (
                 <div 
                    key={idx} 
                    className={`flex-1 flex flex-col items-center justify-center h-full rounded-lg transition-all duration-75 ${
                        isActive 
                        ? 'bg-orange-500 text-white scale-110 shadow-lg z-10' 
                        : 'bg-white/5 text-slate-600'
                    }`}
                 >
                    <span className={`font-black ${item.isBeat ? 'text-2xl lg:text-4xl' : 'text-lg lg:text-2xl opacity-60'}`}>
                        {item.label}
                    </span>
                 </div>
             )
         })}
      </div>
    </div>
  );
};

export default RhythmCount;