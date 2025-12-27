import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Music, Eye, EyeOff, Layers } from 'lucide-react';
import RhythmStaff from './RhythmStaff';
import StrumPattern from './StrumPattern';

// --- Constants ---
const TIME_SIG_CONFIG = {
  '4/4': { countInLimit: 4 },
  '3/4': { countInLimit: 3 },
  '6/8': { countInLimit: 6 },
  'Funk': { countInLimit: 4 },
  'Gallop': { countInLimit: 4 }
};

const RhythmTrainer = ({ volume = 0.5 }) => {
  // Logic State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(70);
  const [timeSig, setTimeSig] = useState('4/4');
  const [countIn, setCountIn] = useState(true);
  
  // View State
  const [showStaff, setShowStaff] = useState(true);
  const [showStrum, setShowStrum] = useState(true);
  
  // Playback State
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  const timerRef = useRef(null);
  const stepRef = useRef(0);
  const countInRef = useRef(0);
  
  // --- WEB AUDIO API ENGINE ---
  const audioCtxRef = useRef(null);

  const playClick = (beatNumber, isStrong) => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sound Design
    // Beat 1 = Higher pitch (800Hz), Others = Lower (440Hz)
    osc.frequency.value = isStrong ? 800 : 440; 
    osc.type = 'sine';

    // Volume Envelope (Quick decay)
    gainNode.gain.setValueAtTime(volume, ctx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  // --- DATA: Rhythm Patterns ---
  const patterns = {
    '4/4': [
      { strum: 'D', duration: 0.25 }, { strum: 'D', duration: 0.25 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
    ],
    '3/4': [
      { strum: 'D', duration: 0.25 }, { strum: 'D', duration: 0.125 }, 
      { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.25 },
    ],
    '6/8': [
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.125 }, 
      { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 },
    ],
    'Funk': [
      { strum: 'D', duration: 0.25 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.25 }
    ],
    'Gallop': [
      { strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.25 } 
    ]
  };

  const currentPattern = patterns[timeSig] || patterns['4/4'];

  const stopPlayback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentStepIndex(-1);
    setCountInBeat(0);
  };

  const startPlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    // Init Audio Context on first user interaction
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setIsPlaying(true);
    stepRef.current = 0;
    countInRef.current = 1;

    if (countIn) {
      setIsCountingIn(true);
      runCountIn();
    } else {
      runPattern();
    }
  };

  const runCountIn = () => {
    const config = TIME_SIG_CONFIG[timeSig] || { countInLimit: 4 };
    const limit = config.countInLimit;
    
    setCountInBeat(countInRef.current);
    
    // Play Click (Beat 1 is strong)
    playClick(countInRef.current, countInRef.current === 1);

    const msPerBeat = 60000 / bpm;
    
    timerRef.current = window.setTimeout(() => {
      if (countInRef.current < limit) {
        countInRef.current += 1;
        runCountIn();
      } else {
        setIsCountingIn(false);
        setCountInBeat(0);
        runPattern();
      }
    }, msPerBeat);
  };

  const runPattern = () => {
    const stepIndex = stepRef.current;
    const stepData = currentPattern[stepIndex];
    
    // Play metronome tick on the start of the pattern (Beat 1)
    // Or simpler: play a tick on every "Down" that lands on a beat? 
    // For now, let's just click on the very first step of the loop (1)
    if (stepIndex === 0) playClick(1, true);

    setCurrentStepIndex(stepIndex);
    const msDuration = (240000 * stepData.duration) / bpm;

    timerRef.current = window.setTimeout(() => {
      stepRef.current = (stepIndex + 1) % currentPattern.length;
      runPattern();
    }, msDuration);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="h-full flex flex-col justify-between">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-orange-500" />
          Rhythm Trainer
        </h2>
        <button
            onClick={startPlayback}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
            isPlaying 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
            }`}
        >
            {isPlaying ? <><Square size={16} fill="currentColor"/> Stop</> : <><Play size={16} fill="currentColor"/> Start</>}
        </button>
      </div>

      {/* --- SETTINGS GRID --- */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        
        {/* Pattern Select */}
        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
          <div className="flex gap-1 overflow-x-auto pb-1">
             {['4/4', '3/4', '6/8', 'Funk', 'Gallop'].map((ts) => (
                <button key={ts} onClick={() => { stopPlayback(); setTimeSig(ts); }}
                  className={`px-3 py-1 text-[10px] font-bold rounded whitespace-nowrap ${timeSig === ts ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  {ts}
                </button>
             ))}
          </div>
        </div>

        {/* BPM */}
        <div className="bg-black/20 p-2 rounded-lg border border-white/5 flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tempo</span>
            <input 
                type="range" min="40" max="180" step="5" value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-xs font-bold text-orange-500 w-12 text-right">{bpm}</span>
        </div>
      </div>

      {/* --- VISUALIZER AREA --- */}
      <div className="flex-1 relative min-h-[100px] flex flex-col justify-center">
        {isCountingIn && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-xl">
             <span className="text-6xl font-black text-orange-500 animate-pulse">{countInBeat}</span>
          </div>
        )}

        <div className={`flex flex-col gap-2 transition-opacity duration-300 ${isCountingIn ? 'opacity-20' : 'opacity-100'}`}>
            {showStaff && <RhythmStaff steps={currentPattern} activeIndex={currentStepIndex} />}
            {showStrum && <StrumPattern currentPattern={currentPattern} currentStepIndex={currentStepIndex} />}
        </div>
      </div>

       {/* View Toggles (Bottom of Card) */}
       <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
            <button onClick={() => setShowStaff(!showStaff)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${showStaff ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-500'}`}>Staff</button>
            <button onClick={() => setShowStrum(!showStrum)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${showStrum ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-500'}`}>Strum</button>
            <button onClick={() => setCountIn(!countIn)} className={`flex-1 py-1 rounded border transition-colors ${countIn ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-slate-800 text-slate-600'}`}>Count: {countIn?'ON':'OFF'}</button>
        </div>
    </div>
  );
};

export default RhythmTrainer;