export const STRUMMING_PATTERNS = [
  {
    id: 'common_time',
    name: 'The Standard',
    difficulty: 'Easy',
    description: 'Straight 8th notes. Good for driving rock songs.',
    // D=Down, U=Up, X=Mute, -=Space/Miss
    sequence: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U']
  },
  {
    id: 'island_strum',
    name: 'Island Strum',
    difficulty: 'Medium',
    description: 'The most essential campfire pattern.',
    // 1 - 2 & - & 4 & (Miss on 1-and and 3)
    sequence: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U']
  },
  {
    id: 'pop_ballad',
    name: 'Pop Ballad',
    difficulty: 'Easy',
    description: 'Simple and spacious.',
    sequence: ['D', '-', 'D', '-', 'D', '-', 'D', 'U']
  },
  {
    id: 'country_swing',
    name: 'Country Swing',
    difficulty: 'Hard',
    description: 'Accent the backbeat.',
    sequence: ['D', '-', 'D', 'U', 'D', '-', 'D', 'U']
  }
];