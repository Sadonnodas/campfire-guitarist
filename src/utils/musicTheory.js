// Data for chromatic scales
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Scale Intervals (semitones)
const INTERVALS = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10] // Natural Minor
};

// Configuration: Which keys strictly prefer FLATS by default?
// (Other keys will default to SHARPS)
const PREFER_FLATS = {
  Major: ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
  Minor: ['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'] 
  // e.g., D Minor uses Bb (1 flat), so it prefers flats.
  // e.g., E Minor uses F# (1 sharp), so it does NOT prefer flats.
};

// Helper to get a note name from a semitone index (0-11)
const getNoteName = (index, useFlats) => {
  const i = (index + 1200) % 12; // Handle negative or overflow safely
  return useFlats ? NOTES_FLAT[i] : NOTES_SHARP[i];
};

/**
 * Returns a list of all selectable roots, including common enharmonics.
 */
export const getAllKeys = () => [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

/**
 * Generates diatonic chords for a specific key.
 * Handles enharmonic spelling (Sharps vs Flats) automatically.
 */
export const getDiatonicChords = (root, scaleType = 'Major') => {
  // 1. Determine Flavor (Sharp or Flat)
  let useFlats = false;

  // Rule A: If the user selected a root with a "b" (e.g., Eb), force Flats.
  // Rule B: If the user selected a root with a "#" (e.g., C#), force Sharps.
  // Rule C: If natural (e.g., "F"), check standard music theory preferences.
  if (root.includes('b')) {
    useFlats = true;
  } else if (root.includes('#')) {
    useFlats = false;
  } else {
    // Natural note roots (C, D, E, F, G, A, B)
    if (PREFER_FLATS[scaleType].includes(root)) {
      useFlats = true;
    }
  }

  // 2. Find the numeric index of the root (0-11)
  // We check both arrays to ensure we find the index regardless of spelling
  let rootIndex = NOTES_SHARP.indexOf(root);
  if (rootIndex === -1) rootIndex = NOTES_FLAT.indexOf(root);

  // 3. Generate Scale Notes
  const scaleIntervals = INTERVALS[scaleType];
  const scaleNotes = scaleIntervals.map(interval => 
    getNoteName(rootIndex + interval, useFlats)
  );

  // 4. Map to Diatonic Chords
  // Major Scale Pattern: I, ii, iii, IV, V, vi, vii°
  // Minor Scale Pattern: i, ii°, III, iv, v, VI, VII
  const CHORD_SUFFIXES = {
    Major: ['', 'm', 'm', '', '', 'm', 'dim'],
    Minor: ['m', 'dim', '', 'm', 'm', '', '']
  };

  const suffixes = CHORD_SUFFIXES[scaleType];
  
  // Roman Numeral Logic
  const ROMAN_BASE = ['I','II','III','IV','V','VI','VII'];

  return scaleNotes.map((noteName, i) => {
    const suffix = suffixes[i];
    let roman = ROMAN_BASE[i];

    // Adjust Roman Numeral Case
    if (scaleType === 'Minor') {
        // Minor Scale base: i, ii, III, iv, v, VI, VII
        const isMajorChord = ['', 'dim'].includes(suffix) === false; // III, VI, VII are Major in minor key
        if (!isMajorChord) roman = roman.toLowerCase();
        
        // Special fix for ii° in minor (it's dim)
        if (i === 1) roman = roman.toLowerCase();
        // Special fix for iv, v (they are minor)
        if (i === 3 || i === 4) roman = roman.toLowerCase();
    } else {
        // Major Scale base
        if (suffix === 'm' || suffix === 'dim') roman = roman.toLowerCase();
    }

    if (suffix === 'dim') roman += '°';

    return {
      name: noteName + suffix,
      roman: roman,
      degree: i + 1
    };
  });
};