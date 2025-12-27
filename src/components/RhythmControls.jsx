import React from 'react';
import { Play, Square } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';

const RhythmControls = () => {
  const { 
    bpm, setBpm, 
    timeSig, setTimeSig, 
    countIn, setCountIn, 
    isPlaying, startPlayback 
  } = useRhythm();

  return (
    <div className="flex flex-col gap-4">
      {/* Time Signature */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 mb-2 uppercase block">Time Signature</label>
        <div className="flex gap-1">
          {['4/4', '3/4', '6/8', '2/2'].map((ts) => (
            <button
              key={ts}
              onClick={() => { if(isPlaying) startPlayback(); setTimeSig(ts); }}
              className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${timeSig === ts ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-black/20 text-slate-400 hover:bg-white/5'}`}
            >
              {ts}
            </button>
          ))}
        </div>
      </div>

      {/* BPM Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tempo</label>
            <span className="text-xs font-bold text-orange-400">{bpm} BPM</span>
        </div>
        <input 
            type="range" min="40" max="180" step="5" value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>

      {/* Toggles & Actions */}
      <div className="flex items-center gap-3">
         <button 
            onClick={() => setCountIn(!countIn)} 
            className={`flex-1 text-[10px] py-2 rounded font-semibold border transition-all ${countIn ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-slate-700 text-slate-600 hover:border-slate-600'}`}
        >
            Count-In: {countIn ? 'ON' : 'OFF'}
        </button>
      </div>

      <button
        onClick={startPlayback}
        className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
          isPlaying 
            ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
            : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-400 hover:to-amber-500'
        }`}
      >
        {isPlaying ? <><Square size={16} fill="currentColor"/> STOP</> : <><Play size={16} fill="currentColor"/> START</>}
      </button>
    </div>
  );
};

export default RhythmControls;