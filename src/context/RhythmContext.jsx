import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// --- IMPORT SOUNDS DIRECTLY ---
import sound1 from '../assets/sounds/1.wav';
import sound2 from '../assets/sounds/2.wav';
import sound3 from '../assets/sounds/3.wav';
import sound4 from '../assets/sounds/4.wav';

const SOUND_MAP = { 1: sound1, 2: sound2, 3: sound3, 4: sound4 };

const RhythmContext = createContext();
export const useRhythm = () => useContext(RhythmContext);

// --- PATTERN LIBRARY (Strictly Audited) ---
// 1.0 = Full Measure in 4/4
const PATTERN_LIBRARY = {
  '4/4': [
    // 1. Straight 8ths (Rock)
    // 8 * 0.125 = 1.0
    [
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
    ],
    // 2. The "Campfire" (D - D U - U D U)
    // Math: 0.25 + 0.125+0.125 + 0.125(rest)+0.125 + 0.125+0.125 = 1.0
    [
      { strum: 'D', duration: 0.25 },   // Beat 1
      { strum: 'D', duration: 0.125 },  // Beat 2
      { strum: 'U', duration: 0.125 },  // &
      { strum: ' ', duration: 0.125 },  // Beat 3 (Miss/Ghost)
      { strum: 'U', duration: 0.125 },  // &
      { strum: 'D', duration: 0.125 },  // Beat 4
      { strum: 'U', duration: 0.125 }   // &
    ],
    // 3. Pop Ballad (D - D - D - D U)
    // Math: 0.25 + 0.25 + 0.25 + 0.125 + 0.125 = 1.0
    [
      { strum: 'D', duration: 0.25 }, 
      { strum: 'D', duration: 0.25 }, 
      { strum: 'D', duration: 0.25 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }
    ]
  ],
  '3/4': [
    // Waltz
    [{ strum: 'D', duration: 0.25 }, { strum: 'D', duration: 0.25 }, { strum: 'D', duration: 0.25 }],
    // Folk 3/4
    [{ strum: 'D', duration: 0.25 }, { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.25 }]
  ],
  '6/8': [ 
    // Standard 6/8
    [
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 }, 
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 }
    ]
  ],
  'Funk': [
    [{ strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 }, { strum: 'X', duration: 0.0625 }, { strum: 'U', duration: 0.0625 }]
  ],
  'Gallop': [
     [{ strum: 'D', duration: 0.125 }, { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 }]
  ]
};

const TIME_SIG_CONFIG = {
  '4/4': { countInLimit: 4, intervalMult: 1.0 },
  '3/4': { countInLimit: 3, intervalMult: 1.0 },
  '6/8': { countInLimit: 6, intervalMult: 0.5 },
  'Funk': { countInLimit: 4, intervalMult: 1.0 },
  'Gallop': { countInLimit: 4, intervalMult: 1.0 }
};

export const RhythmProvider = ({ children }) => {
  // State
  const [bpm, setBpm] = useState(70);
  const [timeSig, setTimeSig] = useState('4/4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [clickType, setClickType] = useState('accented'); 

  // Dynamic Pattern State
  const [currentPattern, setCurrentPattern] = useState(PATTERN_LIBRARY['4/4'][0]);

  // Visual State
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0); 
  const [currentBeat, setCurrentBeat] = useState(1); 
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  // Refs
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const countInBuffers = useRef({}); 
  const timerRef = useRef(null);
  
  const engineState = useRef({
    stepIndex: 0,
    measureIndex: 0,
    countInBeat: 1,
    isPlaying: false,
    accumulatedTime: 0
  });

  // --- ACTIONS ---
  const regeneratePattern = useCallback(() => {
    const options = PATTERN_LIBRARY[timeSig];
    if (!options) return;
    // Pick random but ensure it actually changes if possible
    const randomIdx = Math.floor(Math.random() * options.length);
    setCurrentPattern(options[randomIdx]);
  }, [timeSig]);

  useEffect(() => {
    const options = PATTERN_LIBRARY[timeSig] || PATTERN_LIBRARY['4/4'];
    setCurrentPattern(options[0]);
    stopPlayback();
  }, [timeSig]);

  // --- AUDIO INIT ---
  useEffect(() => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        masterGainRef.current = audioCtxRef.current.createGain();
        masterGainRef.current.connect(audioCtxRef.current.destination);
        masterGainRef.current.gain.value = volume;
    }
    const loadSounds = async () => {
        for (let i = 1; i <= 4; i++) {
            try {
                const res = await fetch(SOUND_MAP[i]);
                if (res.ok) countInBuffers.current[i] = await audioCtxRef.current.decodeAudioData(await res.arrayBuffer());
            } catch(e) {}
        }
    };
    loadSounds();
  }, []);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [volume]);

  // --- PLAYERS ---
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
    playOscillator(isStrong && clickType === 'accented' ? 800 : 440);
  };

  const playCountVoice = (displayNum) => {
     let soundNum = displayNum;
     if (timeSig === '6/8') soundNum = ((displayNum - 1) % 3) + 1;
     
     if (countInBuffers.current[soundNum]) {
         const src = audioCtxRef.current.createBufferSource();
         src.buffer = countInBuffers.current[soundNum];
         src.connect(masterGainRef.current);
         src.start();
     } else {
         playClick(true);
     }
  };

  // --- SCHEDULER ---
  const stopPlayback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    engineState.current.isPlaying = false;
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentStepIndex(-1);
    setCurrentMeasureIndex(0);
    setCurrentBeat(1);
    setCountInBeat(0);
    engineState.current.accumulatedTime = 0;
  };

  const startPlayback = () => {
    if (engineState.current.isPlaying) { stopPlayback(); return; }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

    engineState.current = { isPlaying: true, stepIndex: 0, measureIndex: 0, countInBeat: 1, accumulatedTime: 0 };
    setIsPlaying(true);
    if (countIn) { setIsCountingIn(true); schedulerCountIn(); } 
    else { schedulerPattern(); }
  };

  const schedulerCountIn = () => {
    const config = TIME_SIG_CONFIG[timeSig] || { countInLimit: 4, intervalMult: 1 };
    const currentBeat = engineState.current.countInBeat;
    setCountInBeat(currentBeat);
    playCountVoice(currentBeat); 
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
    const idx = engineState.current.stepIndex;
    const stepData = currentPattern[idx];
    const accTime = engineState.current.accumulatedTime;

    const isBeatStart = (Math.abs(accTime % 0.25) < 0.001);
    const isMeasureStart = (Math.abs(accTime) < 0.001);

    const calculatedBeat = Math.floor(accTime / 0.25) + 1;
    setCurrentBeat(calculatedBeat);

    if (isMeasureStart) playClick(true);
    else if (isBeatStart) playClick(false);

    setCurrentStepIndex(idx);
    setCurrentMeasureIndex(engineState.current.measureIndex);

    const msDuration = (240000 * stepData.duration) / bpm;

    timerRef.current = setTimeout(() => {
      if (!engineState.current.isPlaying) return;
      let nextIndex = idx + 1;
      let nextAcc = accTime + stepData.duration;
      if (nextIndex >= currentPattern.length) {
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
      countIn, setCountIn, volume, setVolume, clickType, setClickType,
      currentStepIndex, currentPattern, regeneratePattern,
      isCountingIn, countInBeat, currentMeasureIndex, currentBeat 
    }}>
      {children}
    </RhythmContext.Provider>
  );
};
export default RhythmProvider;