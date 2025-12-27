import { useState, useCallback } from 'react';
import { STRUMMING_PATTERNS } from '../data/rhythms';

export const useRhythmEngine = () => {
  const [currentPattern, setCurrentPattern] = useState(STRUMMING_PATTERNS[1]); // Default to Island Strum
  const [isPlaying, setIsPlaying] = useState(false);

  const randomizePattern = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * STRUMMING_PATTERNS.length);
    setCurrentPattern(STRUMMING_PATTERNS[randomIndex]);
  }, []);

  const selectPattern = useCallback((id) => {
    const found = STRUMMING_PATTERNS.find(p => p.id === id);
    if (found) setCurrentPattern(found);
  }, []);

  return {
    currentPattern,
    randomizePattern,
    selectPattern,
    allPatterns: STRUMMING_PATTERNS
  };
};