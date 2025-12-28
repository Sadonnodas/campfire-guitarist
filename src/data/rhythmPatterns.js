export const TIME_SIGNATURES = ['4/4', '3/4', '6/8'];

export const RHYTHM_PATTERNS = [
  // --- 4/4 PATTERNS ---
  {
    id: '44_rock_standard',
    name: 'The Driver',
    timeSig: '4/4',
    category: 'Rock',
    description: 'Constant 8th notes. Driving and energetic.',
    steps: [
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
    ]
  },
  {
    id: '44_island',
    name: 'Island Strum',
    timeSig: '4/4',
    category: 'Pop/Folk',
    description: 'The essential campfire strum. Syncopated feel.',
    steps: [
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: ' ', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }
    ]
  },
  {
    id: '44_funk_16',
    name: 'Funky 16ths',
    timeSig: '4/4',
    category: 'Funk',
    description: 'Quick 16th note motion (1-e-&-a).',
    steps: [
      // Beat 1 (D . D U)
      { strum: 'D', duration: 0.125 }, // 1 & e
      { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 }, // & a
      // Beat 2 (Miss . D U)
      { strum: ' ', duration: 0.125 }, 
      { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      // Beat 3 (D U D U) - 16ths
      { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      { strum: 'D', duration: 0.0625 }, { strum: 'U', duration: 0.0625 },
      // Beat 4 (D . . .)
      { strum: 'D', duration: 0.25 }
    ]
  },
  {
    id: '44_triplet_feel',
    name: 'Blues Shuffle',
    timeSig: '4/4',
    category: 'Blues',
    description: 'Triplet feel in 4/4 (Swing).',
    // Using decimal approx for triplets (0.0833...)
    steps: [
      // Beat 1 (Long Short)
      { strum: 'D', duration: 0.1666 }, { strum: 'U', duration: 0.0834 },
      // Beat 2
      { strum: 'D', duration: 0.1666 }, { strum: 'U', duration: 0.0834 },
      // Beat 3
      { strum: 'D', duration: 0.1666 }, { strum: 'U', duration: 0.0834 },
      // Beat 4
      { strum: 'D', duration: 0.1666 }, { strum: 'U', duration: 0.0834 },
    ]
  },
  {
    id: '44_pop_ballad',
    name: 'Pop Ballad',
    timeSig: '4/4',
    category: 'Pop',
    description: 'Spacious and open. Great for slow songs.',
    steps: [
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }
    ]
  },
  {
    id: '44_syncopated',
    name: 'Wonder Strum',
    timeSig: '4/4',
    category: 'Pop',
    description: 'Features a dotted rhythm opener.',
    steps: [
      { strum: 'D', duration: 0.375 }, // Dotted quarter (1 & 2)
      { strum: 'U', duration: 0.125 }, // & (of 2)
      { strum: ' ', duration: 0.125 }, { strum: 'U', duration: 0.125 }, // (3) &
      { strum: 'D', duration: 0.25 }, // 4
    ]
  },

  // --- 3/4 PATTERNS ---
  {
    id: '34_waltz_basic',
    name: 'Basic Waltz',
    timeSig: '3/4',
    category: 'Folk',
    description: 'ONE two three, ONE two three.',
    steps: [
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.25 }
    ]
  },
  {
    id: '34_waltz_filled',
    name: 'Filled Waltz',
    timeSig: '3/4',
    category: 'Folk',
    description: 'Adding motion to the 2nd and 3rd beats.',
    steps: [
      { strum: 'D', duration: 0.25 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }
    ]
  },

  // --- 6/8 PATTERNS ---
  {
    id: '68_folk_picker',
    name: 'Folk Picker',
    timeSig: '6/8',
    category: 'Folk',
    description: 'Emphasis on the outer beats.',
    steps: [
      { strum: 'D', duration: 0.375 }, // Dotted quarter
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 }
    ]
  },
  {
    id: '68_slow_blues',
    name: 'Slow Blues',
    timeSig: '6/8',
    category: 'Blues',
    description: 'ONE-and-a TWO-and-a.',
    steps: [
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 },
      { strum: 'D', duration: 0.125 }, { strum: 'U', duration: 0.125 }, { strum: 'D', duration: 0.125 }
    ]
  }
];