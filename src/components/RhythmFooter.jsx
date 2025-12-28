import React from 'react';
import { Play, Square, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';
import { TIME_SIGNATURES } from '../data/rhythmPatterns';

const RhythmFooter = () => {
  const { 
    bpm, setBpm, isPlaying, startPlayback, stopPlayback,
    volume, setVolume, clickType, setClickType,
    timeSig, setTimeSig, countIn, setCountIn
  } = useRhythm();

  return (
    <div className="fixed bottom-0 left-0 w-full h-24 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-6 z-50 flex items-center justify-between">
        
        {/* Left: Play/Stop */}
        <div className="flex items-center gap-6">
            <button 
                onClick={isPlaying ? stopPlayback : startPlayback}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                    isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                }`}
            >
                {isPlaying ? <Square size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
            </button>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master Tempo</span>
                <span className="text-2xl font-black text-white leading-none">{bpm} <span className="text-sm font-normal text-slate-500">BPM</span></span>
                <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-32 h-1 mt-2 bg-slate-700 rounded-lg accent-orange-500 cursor-pointer"/>
            </div>
        </div>

        {/* Center: Time Sig */}
        <div className="flex gap-2">
            {TIME_SIGNATURES.map(ts => (
                <button key={ts} onClick={() => setTimeSig(ts)} className={`px-4 py-2 rounded font-bold text-sm transition-colors ${timeSig===ts ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:bg-white/5'}`}>
                    {ts}
                </button>
            ))}
        </div>

        {/* Right: Audio Settings */}
        <div className="flex items-center gap-4">
            {/* Click Type */}
            <button onClick={() => setClickType(clickType === 'accented' ? 'flat' : 'accented')} className="flex flex-col items-end mr-4 group">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 group-hover:text-white transition-colors">
                    <Settings2 size={10} /> Click Tone
                </span>
                <span className="text-xs font-bold text-orange-400">{clickType === 'accented' ? 'High/Low' : 'Flat'}</span>
            </button>

            {/* Count In */}
            <button onClick={() => setCountIn(!countIn)} className={`px-3 py-1 rounded border text-xs font-bold ${countIn ? 'border-orange-500 text-orange-500' : 'border-slate-700 text-slate-600'}`}>
                Count: {countIn?'ON':'OFF'}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-full border border-white/5">
                <button onClick={() => setVolume(volume > 0 ? 0 : 0.5)} className="text-slate-400 hover:text-white">
                    {volume === 0 ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 h-1 bg-slate-600 rounded accent-slate-300"/>
            </div>
        </div>
    </div>
  );
};

export default RhythmFooter;