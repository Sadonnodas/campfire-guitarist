import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { RHYTHM_PATTERNS, TIME_SIGNATURES } from '../data/rhythmPatterns';

// Import sounds (Keep your existing imports)
import sound1 from '../assets/sounds/1.wav';
import sound2 from '../assets/sounds/2.wav';
import sound3 from '../assets/sounds/3.wav';
import sound4 from '../assets/sounds/4.wav';

const SOUND_MAP = { 1: sound1, 2: sound2, 3: sound3, 4: sound4 };

const RhythmContext = createContext();
export const useRhythm = () => useContext(RhythmContext);

const TIME_SIG_CONFIG = {
  '4/4': { countInLimit: 4, intervalMult: 1.0 },
  '3/4': { countInLimit: 3, intervalMult: 1.0 },
  '6/8': { countInLimit: 6, intervalMult: 0.5 },
};

export const RhythmProvider = ({ children }) => {
  const [bpm, setBpm] = useState(70);
  const [timeSig, setTimeSig] = useState('4/4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [clickType, setClickType] = useState('accented'); 

  // Engine State
  // Initialize with the first pattern matching 4/4
  const [currentPattern, setCurrentPattern] = useState(
    RHYTHM_PATTERNS.find(p => p.timeSig === '4/4').steps
  );
  
  const [currentPatternId, setCurrentPatternId] = useState(
    RHYTHM_PATTERNS.find(p => p.timeSig === '4/4').id
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0); 
  const [measureProgress, setMeasureProgress] = useState(0);
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

  // Select a specific pattern by ID
  const selectPattern = useCallback((id) => {
    const found = RHYTHM_PATTERNS.find(p => p.id === id);
    if (found) {
        setTimeSig(found.timeSig); // Auto-switch time sig if needed
        setCurrentPattern(found.steps);
        setCurrentPatternId(found.id);
        stopPlayback();
    }
  }, []);

  // Randomize within current Time Sig
  const regeneratePattern = useCallback(() => {
    const options = RHYTHM_PATTERNS.filter(p => p.timeSig === timeSig);
    if (!options.length) return;
    const randomIdx = Math.floor(Math.random() * options.length);
    const selected = options[randomIdx];
    
    setCurrentPattern(selected.steps);
    setCurrentPatternId(selected.id);
    stopPlayback();
  }, [timeSig]);

  // When Time Sig changes manually via footer, pick a default pattern for it
  useEffect(() => {
    // Only switch pattern if the current pattern doesn't match the new time sig
    const currentPatternObj = RHYTHM_PATTERNS.find(p => p.id === currentPatternId);
    
    if (!currentPatternObj || currentPatternObj.timeSig !== timeSig) {
        const options = RHYTHM_PATTERNS.filter(p => p.timeSig === timeSig);
        if (options.length > 0) {
            setCurrentPattern(options[0].steps);
            setCurrentPatternId(options[0].id);
        }
        stopPlayback();
    }
  }, [timeSig]);

  // --- AUDIO INIT (Same as before) ---
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

  const playOscillator = (freq) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.frequency.value = freq;
    osc.type = 'sine';
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

  // --- SCHEDULER (Same logic, verified works with new pattern data structure) ---
  const stopPlayback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    engineState.current.isPlaying = false;
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentStepIndex(-1);
    setCurrentMeasureIndex(0);
    setMeasureProgress(0);
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

    if (isMeasureStart) playClick(true);
    else if (isBeatStart) playClick(false);

    setCurrentStepIndex(idx);
    setCurrentMeasureIndex(engineState.current.measureIndex);
    setMeasureProgress(accTime);

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
      currentStepIndex, currentPattern, currentPatternId,
      regeneratePattern, selectPattern,
      isCountingIn, countInBeat, currentMeasureIndex, measureProgress
    }}>
      {children}
    </RhythmContext.Provider>
  );
};
export default RhythmProvider;