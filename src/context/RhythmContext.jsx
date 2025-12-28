import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { RHYTHM_PATTERNS } from '../data/rhythmPatterns';

// --- SOUND IMPORTS ---
import sound1 from '../assets/sounds/1.wav';
import sound2 from '../assets/sounds/2.wav';
import sound3 from '../assets/sounds/3.wav';
import sound4 from '../assets/sounds/4.wav';

const SOUND_MAP = { 1: sound1, 2: sound2, 3: sound3, 4: sound4 };
const RhythmContext = createContext();
export const useRhythm = () => useContext(RhythmContext);

const MEASURE_DURATIONS = { '4/4': 1.0, '3/4': 0.75, '6/8': 0.75 };

export const RhythmProvider = ({ children }) => {
  const [bpm, setBpm] = useState(70);
  const [timeSig, setTimeSig] = useState('4/4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [clickType, setClickType] = useState('accented'); 

  // --- AUDIO SETTINGS ---
  // '4n', '8n', '16n'
  const [metronomeResolution, setMetronomeResolution] = useState('4n');
  
  // 'steady' (Real Metronome), 'pattern' (Rhythm Guide), 'both' (Dual)
  const [metronomeStyle, setMetronomeStyle] = useState('pattern'); 

  // --- PATTERN STATE ---
  const [customPatterns, setCustomPatterns] = useState(() => {
    try {
      const saved = localStorage.getItem('campfire_custom_patterns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const defaultPattern = RHYTHM_PATTERNS[0] || { steps: [], id: 'default', timeSig: '4/4' };
  const [currentPattern, setCurrentPattern] = useState(defaultPattern.steps);
  const [currentPatternId, setCurrentPatternId] = useState(defaultPattern.id);

  // Engine State
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

  // --- AUTO-DETECT RESOLUTION ---
  useEffect(() => {
    if (timeSig === '6/8') {
        setMetronomeResolution('8n'); 
    } else {
        setMetronomeResolution('4n'); 
    }
  }, [timeSig]);

  // --- ACTIONS ---
  const selectPattern = useCallback((id) => {
    const all = [...RHYTHM_PATTERNS, ...customPatterns];
    const found = all.find(p => p.id === id);
    if (found) {
        if (found.timeSig !== timeSig) setTimeSig(found.timeSig);
        setCurrentPattern(found.steps);
        setCurrentPatternId(found.id);
        stopPlayback();
    }
  }, [customPatterns, timeSig]);

  const savePattern = useCallback((newPattern) => {
    const patternObj = {
        id: `custom_${Date.now()}`,
        name: `My Rhythm #${customPatterns.length + 1}`,
        category: 'User',
        description: 'Custom generated pattern',
        ...newPattern
    };
    
    const updated = [...customPatterns, patternObj];
    setCustomPatterns(updated);
    localStorage.setItem('campfire_custom_patterns', JSON.stringify(updated));
    setCurrentPattern(patternObj.steps);
    setCurrentPatternId(patternObj.id);
  }, [customPatterns]);

  const renamePattern = useCallback((id, newName) => {
    const updated = customPatterns.map(p => 
      p.id === id ? { ...p, name: newName } : p
    );
    setCustomPatterns(updated);
    localStorage.setItem('campfire_custom_patterns', JSON.stringify(updated));
  }, [customPatterns]);

  const deletePattern = useCallback((id) => {
    const updated = customPatterns.filter(p => p.id !== id);
    setCustomPatterns(updated);
    localStorage.setItem('campfire_custom_patterns', JSON.stringify(updated));

    if (currentPatternId === id) {
        const fallback = RHYTHM_PATTERNS[0];
        setCurrentPattern(fallback.steps);
        setCurrentPatternId(fallback.id);
        setTimeSig(fallback.timeSig);
        stopPlayback();
    }
  }, [customPatterns, currentPatternId]);

  const generateRandomPattern = useCallback(() => {
    const targetDuration = MEASURE_DURATIONS[timeSig] || 1.0;
    let currentDuration = 0;
    const steps = [];

    let lengths = [0.125, 0.25];
    if (timeSig === '4/4') lengths.push(0.375, 0.5);
    if (timeSig === '6/8') lengths = [0.125, 0.375]; 

    while (currentDuration < targetDuration - 0.01) {
        const remaining = targetDuration - currentDuration;
        let validLengths = lengths.filter(l => l <= remaining + 0.001);
        if (validLengths.length === 0) validLengths = [remaining];
        
        const len = validLengths[Math.floor(Math.random() * validLengths.length)];
        const isDown = Math.random() > 0.3; 
        const type = Math.random() > 0.85 ? ' ' : (isDown ? 'D' : 'U');

        steps.push({ strum: type, duration: len });
        currentDuration += len;
    }
    return { timeSig, steps };
  }, [timeSig]);

  // --- AUDIO ENGINE ---
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
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    countInBuffers.current[i] = await audioCtxRef.current.decodeAudioData(arrayBuffer);
                }
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

  const playTone = (freq, type = 'sine', duration = 0.1, ramp = 0.001, volStart = 0.5) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.frequency.value = freq;
    osc.type = type;
    
    gain.gain.setValueAtTime(volStart, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(ramp, ctx.currentTime + duration);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  // 1. STEADY CLICK (The Metronome)
  const playClick = (isMeasureStart) => {
    // Sharp, crisp beep
    const freq = isMeasureStart ? 1000 : 500;
    playTone(freq, 'square', 0.05, 0.001, 0.3);
  };

  // 2. RHYTHM SOUND (The Strum)
  const playStrumSound = (isDown) => {
    // Softer, breathy noise or tone to distinguish from click
    // Using a saw wave with lower pitch
    const freq = isDown ? 200 : 300;
    playTone(freq, 'triangle', 0.1, 0.01, 0.4);
  };

  const playCountVoice = (beatNum) => {
     if (!audioCtxRef.current) return;
     let fileIndex = beatNum;
     if (timeSig === '6/8') {
        if (beatNum > 4) fileIndex = ((beatNum - 1) % 4) + 1; 
     }
     const buffer = countInBuffers.current[fileIndex];
     if (buffer) {
         const src = audioCtxRef.current.createBufferSource();
         src.buffer = buffer;
         src.connect(masterGainRef.current);
         src.start();
     } else {
         playTone(800, 'square', 0.1);
     }
  };

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
    const limit = timeSig === '6/8' ? 6 : (timeSig === '3/4' ? 3 : 4);
    const intervalMult = timeSig === '6/8' ? 0.5 : 1.0;
    const currentBeat = engineState.current.countInBeat;
    setCountInBeat(currentBeat);
    playCountVoice(currentBeat);

    const msInterval = (60000 / bpm) * intervalMult;

    timerRef.current = setTimeout(() => {
      if (!engineState.current.isPlaying) return;
      if (currentBeat < limit) {
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
    
    if (!stepData) { stopPlayback(); return; }

    const accTime = engineState.current.accumulatedTime;
    const isMeasureStart = (Math.abs(accTime) < 0.001);

    // --- 1. DETERMINE STEADY METRONOME TRIGGER ---
    let interval = 0.25; 
    if (metronomeResolution === '8n') interval = 0.125;
    if (metronomeResolution === '16n') interval = 0.0625;

    const isSteadyClickTime = (Math.abs(accTime % interval) < 0.001);

    // --- 2. PLAY SOUNDS BASED ON MODE ---
    const playSteady = metronomeStyle === 'steady' || metronomeStyle === 'both';
    const playPattern = metronomeStyle === 'pattern' || metronomeStyle === 'both';

    // A. Steady Metronome Click
    if (playSteady && isSteadyClickTime) {
        playClick(isMeasureStart);
    }

    // B. Rhythm Guide (The "Pattern" sound)
    // Only play if it's NOT a rest/miss
    if (playPattern && stepData.strum !== ' ') {
        // If we are in "Both" mode, we might have a collision where steady click and strum happen at exact same time.
        // We can either play both, or let them layer.
        // To make it clearer, let's play the strum.
        playStrumSound(stepData.strum === 'D');
    }

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
      metronomeResolution, setMetronomeResolution, 
      metronomeStyle, setMetronomeStyle, // New State
      currentStepIndex, currentPattern, currentPatternId,
      selectPattern, generateRandomPattern, savePattern, renamePattern, deletePattern,
      isCountingIn, countInBeat, currentMeasureIndex, measureProgress,
      allPatterns: [...RHYTHM_PATTERNS, ...customPatterns]
    }}>
      {children}
    </RhythmContext.Provider>
  );
};
export default RhythmProvider;