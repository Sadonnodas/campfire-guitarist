import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// --- IMPORT SOUNDS DIRECTLY ---
import sound1 from '../assets/sounds/1.wav';
import sound2 from '../assets/sounds/2.wav';
import sound3 from '../assets/sounds/3.wav';
import sound4 from '../assets/sounds/4.wav';

const SOUND_MAP = {
  1: sound1,
  2: sound2,
  3: sound3,
  4: sound4
};

const RhythmContext = createContext();
export const useRhythm = () => useContext(RhythmContext);

// --- MUSIC DATA ---
const PATTERNS = {
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

// Config determines how many beats to count and how fast
const TIME_SIG_CONFIG = {
  '4/4': { countInLimit: 4, intervalMult: 1.0 },   // Standard Quarter Notes
  '3/4': { countInLimit: 3, intervalMult: 1.0 },   // Standard Quarter Notes
  '6/8': { countInLimit: 6, intervalMult: 0.5 },   // Eighth Notes (Twice as fast)
  'Funk': { countInLimit: 4, intervalMult: 1.0 },
  'Gallop': { countInLimit: 4, intervalMult: 1.0 }
};

export const RhythmProvider = ({ children }) => {
  // --- STATE ---
  const [bpm, setBpm] = useState(70);
  const [timeSig, setTimeSig] = useState('4/4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [clickType, setClickType] = useState('accented'); 

  // Visual State
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0); 
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  // --- REFS ---
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const countInBuffers = useRef({}); 
  const timerRef = useRef(null);
  
  // Engine State
  const engineState = useRef({
    stepIndex: 0,
    measureIndex: 0,
    countInBeat: 1,
    isPlaying: false,
    accumulatedTime: 0
  });

  // --- AUDIO SETUP ---
  useEffect(() => {
    // 1. Init Audio Context
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        masterGainRef.current = audioCtxRef.current.createGain();
        masterGainRef.current.connect(audioCtxRef.current.destination);
        masterGainRef.current.gain.value = volume;
    }
    
    // 2. Load Sounds
    const loadSounds = async () => {
        for (let i = 1; i <= 4; i++) {
            try {
                const url = SOUND_MAP[i];
                const response = await fetch(url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
                    countInBuffers.current[i] = audioBuffer;
                }
            } catch(e) { 
                console.error(`Error loading sound ${i}`, e); 
            }
        }
    };
    loadSounds();
  }, []);

  // Update Volume Live
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [volume]);

  // --- AUDIO HELPERS ---
  const playOscillator = (freq, type = 'sine') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.frequency.value = freq;
    osc.type = type;
    
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playClick = (isStrong) => {
    let freq = isStrong ? 800 : 440;
    if (clickType === 'flat') freq = 440;
    playOscillator(freq);
  };

  const playCountVoice = (displayNum) => {
     // Logic to map the count beat to the sound file
     // For 6/8: 1->1, 2->2, 3->3, 4->1, 5->2, 6->3
     let soundNum = displayNum;
     if (timeSig === '6/8') {
        soundNum = ((displayNum - 1) % 3) + 1;
     }

     if (countInBuffers.current[soundNum]) {
         const src = audioCtxRef.current.createBufferSource();
         src.buffer = countInBuffers.current[soundNum];
         src.connect(masterGainRef.current);
         src.start();
     } else {
         playClick(true);
     }
  };

  // --- SCHEDULING ---

  const stopPlayback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    engineState.current.isPlaying = false;
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentStepIndex(-1);
    setCurrentMeasureIndex(0);
    setCountInBeat(0);
    engineState.current.accumulatedTime = 0;
  };

  const startPlayback = () => {
    if (engineState.current.isPlaying) { 
        stopPlayback(); 
        return; 
    }

    if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
    }

    engineState.current = {
        isPlaying: true,
        stepIndex: 0,
        measureIndex: 0,
        countInBeat: 1,
        accumulatedTime: 0
    };
    
    setIsPlaying(true);

    if (countIn) {
      setIsCountingIn(true);
      schedulerCountIn();
    } else {
      schedulerPattern();
    }
  };

  const schedulerCountIn = () => {
    const config = TIME_SIG_CONFIG[timeSig] || { countInLimit: 4, intervalMult: 1 };
    const currentBeat = engineState.current.countInBeat;
    
    setCountInBeat(currentBeat);
    playCountVoice(currentBeat); 

    // Calculate Interval: (60000 / BPM) * Multiplier
    // e.g. 6/8 -> Mult is 0.5 (Eighth Notes)
    const msInterval = (60000 / bpm) * config.intervalMult;

    timerRef.current = setTimeout(() => {
      if (!engineState.current.isPlaying) return;

      if (currentBeat < config.countInLimit) {
        engineState.current.countInBeat++;
        schedulerCountIn();
      } else {
        setIsCountingIn(false);
        setCountInBeat(0);
        schedulerPattern();
      }
    }, msInterval);
  };

  const schedulerPattern = () => {
    const pattern = PATTERNS[timeSig] || PATTERNS['4/4'];
    const idx = engineState.current.stepIndex;
    const stepData = pattern[idx];
    const accTime = engineState.current.accumulatedTime;

    // Metronome Logic
    const isBeatStart = (Math.abs(accTime % 0.25) < 0.001);
    const isMeasureStart = (Math.abs(accTime) < 0.001);

    if (isMeasureStart) {
        playClick(true);
    } else if (isBeatStart) {
        playClick(false);
    }

    // Visuals
    setCurrentStepIndex(idx);
    setCurrentMeasureIndex(engineState.current.measureIndex);

    // Schedule Next
    const msDuration = (240000 * stepData.duration) / bpm;

    timerRef.current = setTimeout(() => {
      if (!engineState.current.isPlaying) return;

      let nextIndex = idx + 1;
      let nextAcc = accTime + stepData.duration;

      if (nextIndex >= pattern.length) {
          nextIndex = 0;
          nextAcc = 0;
          engineState.current.measureIndex++; 
      }

      engineState.current.stepIndex = nextIndex;
      engineState.current.accumulatedTime = nextAcc;
      
      schedulerPattern();
    }, msDuration);
  };

  return (
    <RhythmContext.Provider value={{
      bpm, setBpm, timeSig, setTimeSig,
      isPlaying, startPlayback, stopPlayback,
      countIn, setCountIn, volume, setVolume,
      clickType, setClickType,
      currentStepIndex, 
      currentPattern: PATTERNS[timeSig] || PATTERNS['4/4'],
      isCountingIn, countInBeat,
      currentMeasureIndex 
    }}>
      {children}
    </RhythmContext.Provider>
  );
};

export default RhythmProvider;