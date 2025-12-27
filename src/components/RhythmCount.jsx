import React, { useState } from 'react';
import { useRhythm } from '../context/RhythmContext';

const RhythmCount = () => {
  const { measureProgress, timeSig, isPlaying } = useRhythm();
  const [resolution, setResolution] = useState('8th'); // '4th', '8th', '16th'

  // --- GENERATE GRID ---
  // Returns array of { label: string, time: number }
  const getGrid = () => {
    const items = [];
    
    // Config based on Time Signature
    let beatsPerBar = 4;
    if (timeSig === '3/4') beatsPerBar = 3;
    if (timeSig === '6/8') beatsPerBar = 6; // Usually counted 1-6 in 8ths

    if (timeSig === '6/8') {
        // Special logic for 6/8
        if (resolution === '16th') {
             for(let i=1; i<=6; i++) {
                 const t = (i-1) * 0.125;
                 items.push({ label: `${i}`, time: t });
                 items.push({ label: '+', time: t + 0.0625 });
             }
        } else {
             // 8th (Standard) or 4th (Dotted?) - Let's stick to 1-6 for simplicity
             for(let i=1; i<=6; i++) {
                 items.push({ label: `${i}`, time: (i-1) * 0.125 });
             }
        }
    } else {
        // Standard 4/4 and 3/4 logic
        for (let i = 1; i <= beatsPerBar; i++) {
            const beatTime = (i - 1) * 0.25; // 0.0, 0.25, 0.5...
            
            // BEAT (Always show)
            items.push({ label: `${i}`, time: beatTime });

            if (resolution === '8th' || resolution === '16th') {
                items.push({ label: '+', time: beatTime + 0.125 });
            }

            if (resolution === '16th') {
                // Insert 'e' and 'a'
                // Note: Array order matters for display, so we insert differently
                // Actually simpler to just generate linear list
            }
        }
    }
    
    // Re-generate linear sorted list for cleaner code (handles the 16th insertion better)
    const linearGrid = [];
    if (timeSig !== '6/8') {
        for (let i = 1; i <= beatsPerBar; i++) {
            const t = (i - 1) * 0.25;
            linearGrid.push({ label: `${i}`, time: t, isBeat: true });
            
            if (resolution === '16th') {
                linearGrid.push({ label: 'e', time: t + 0.0625, isSub: true });
                linearGrid.push({ label: '+', time: t + 0.125, isSub: true });
                linearGrid.push({ label: 'a', time: t + 0.1875, isSub: true });
            } else if (resolution === '8th') {
                linearGrid.push({ label: '+', time: t + 0.125, isSub: true });
            }
        }
        return linearGrid;
    } else {
        // 6/8 Logic
        for(let i=1; i<=6; i++) {
             const t = (i-1) * 0.125;
             linearGrid.push({ label: `${i}`, time: t, isBeat: true });
             if (resolution === '16th') {
                 linearGrid.push({ label: '+', time: t + 0.0625, isSub: true });
             }
        }
        return linearGrid;
    }
  };

  const gridItems = getGrid();

  return (
    <div className="h-full flex flex-col p-2">
      {/* Settings Header */}
      <div className="flex justify-end mb-2 bg-black/20 p-1 rounded-lg">
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
             // Highlight Logic
             // We check if current measureProgress matches the item time.
             // Using a small epsilon because floats are imprecise.
             const isActive = isPlaying && Math.abs(measureProgress - item.time) < 0.01;
             
             return (
                 <div 
                    key={idx} 
                    className={`flex-1 flex flex-col items-center justify-center h-full rounded-lg transition-all duration-100 ${
                        isActive 
                        ? 'bg-orange-500 text-white scale-110 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-10' 
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