import React from 'react';
import { Play, Square, Volume2, VolumeX, Settings2, Grid3X3, Activity, Layers } from 'lucide-react';
import { useRhythm } from '../context/RhythmContext';
import { TIME_SIGNATURES } from '../data/rhythmPatterns';

const NoteQuarter = () => (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
        <ellipse cx="4" cy="14" rx="4" ry="3" transform="rotate(-15 4 14)" />
        <rect x="7" y="0" width="1.5" height="14" />
    </svg>
);

const NoteEighth = () => (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
        <ellipse cx="4" cy="14" rx="4" ry="3" transform="rotate(-15 4 14)" />
        <rect x="7" y="0" width="1.5" height="14" />
        <path d="M 8 0 C 14 2, 14 8, 14 10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);

const NoteSixteenth = () => (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
        <ellipse cx="4" cy="14" rx="4" ry="3" transform="rotate(-15 4 14)" />
        <rect x="7" y="0" width="1.5" height="14" />
        <path d="M 8 0 C 14 2, 14 7, 14 9" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M 8 5 C 14 7, 14 12, 14 14" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);

const RhythmFooter = () => {
  const { 
    bpm, setBpm, isPlaying, startPlayback, stopPlayback,
    volume, setVolume, clickType, setClickType,
    timeSig, countIn, setCountIn,
    metronomeResolution, setMetronomeResolution,
    metronomeStyle, setMetronomeStyle
  } = useRhythm();

  return (
    <div className="fixed bottom-0 left-0 w-full h-24 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-6 z-50 flex items-center justify-between">
        
        {/* Left: Play/Stop & Tempo */}
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

        {/* Center: Indicators & Metronome Control */}
        <div className="flex items-center gap-6">
            
            {/* Time Signature Indicator (Read Only) */}
            <div className="flex flex-col items-center">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time Sig</span>
                 <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    {TIME_SIGNATURES.map(ts => (
                        <div 
                            key={ts} 
                            className={`px-3 py-1 rounded font-bold text-xs select-none ${timeSig===ts ? 'bg-white/10 text-white border border-white/20' : 'text-slate-600'}`}
                        >
                            {ts}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            {/* Metronome Mode: Steady vs Pattern */}
            <div className="flex flex-col items-center">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Metronome Style</span>
                 <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => setMetronomeStyle('steady')}
                        className={`p-1.5 rounded hover:bg-white/5 transition-colors ${metronomeStyle === 'steady' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
                        title="Steady Click Only"
                    >
                        <Grid3X3 size={16} />
                    </button>
                    <button 
                        onClick={() => setMetronomeStyle('pattern')}
                        className={`p-1.5 rounded hover:bg-white/5 transition-colors ${metronomeStyle === 'pattern' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
                        title="Pattern Rhythm Only"
                    >
                        <Activity size={16} />
                    </button>
                    <button 
                        onClick={() => setMetronomeStyle('both')}
                        className={`p-1.5 rounded hover:bg-white/5 transition-colors ${metronomeStyle === 'both' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
                        title="Both (Dual Layer)"
                    >
                        <Layers size={16} />
                    </button>
                </div>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            {/* Metronome Resolution Selector */}
            <div className={`flex flex-col items-center transition-opacity duration-300 ${metronomeStyle === 'pattern' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Click Resolution</span>
                 <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => setMetronomeResolution('4n')}
                        className={`w-8 h-7 flex items-center justify-center rounded hover:bg-white/5 transition-colors ${metronomeResolution === '4n' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500'}`}
                        title="Quarter Note"
                    >
                        <NoteQuarter />
                    </button>
                    <button 
                        onClick={() => setMetronomeResolution('8n')}
                        className={`w-8 h-7 flex items-center justify-center rounded hover:bg-white/5 transition-colors ${metronomeResolution === '8n' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500'}`}
                        title="Eighth Note"
                    >
                        <NoteEighth />
                    </button>
                    <button 
                        onClick={() => setMetronomeResolution('16n')}
                        className={`w-8 h-7 flex items-center justify-center rounded hover:bg-white/5 transition-colors ${metronomeResolution === '16n' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500'}`}
                        title="Sixteenth Note"
                    >
                        <NoteSixteenth />
                    </button>
                </div>
            </div>

        </div>

        {/* Right: Audio Settings */}
        <div className="flex items-center gap-4">
            <button onClick={() => setCountIn(!countIn)} className={`px-3 py-1 rounded border text-xs font-bold ${countIn ? 'border-orange-500 text-orange-500' : 'border-slate-700 text-slate-600'}`}>
                Count: {countIn?'ON':'OFF'}
            </button>
            
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