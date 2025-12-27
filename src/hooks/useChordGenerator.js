import { useState, useCallback } from 'react';
import { COWBOY_CHORDS } from '../data/chords';

export const useChordGenerator = (initialCount = 4) => {
  // Initialize with a default progression (G D Em C is a classic)
  const [progression, setProgression] = useState([
    COWBOY_CHORDS[0], // G
    COWBOY_CHORDS[2], // D
    COWBOY_CHORDS[3], // Em
    COWBOY_CHORDS[1]  // C
  ]);

  const generateProgression = useCallback(() => {
    const newChords = Array.from({ length: initialCount }).map(() => {
      const randomIndex = Math.floor(Math.random() * COWBOY_CHORDS.length);
      return COWBOY_CHORDS[randomIndex];
    });
    setProgression(newChords);
  }, [initialCount]);

  return {
    progression,
    generateProgression
  };
};