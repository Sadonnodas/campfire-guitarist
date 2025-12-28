// Note Durations
const D = {
    WHOLE: 1.0,
    HALF: 0.5,
    QUARTER: 0.25,
    DOTTED_QUARTER: 0.375,
    EIGHTH: 0.125,
    DOTTED_EIGHTH: 0.1875,
    SIXTEENTH: 0.0625,
    TRIPLET: 1/12 // approx 0.0833
};
  
// Configuration for valid notes per Time Signature
const MEASURE_LENGTHS = { '4/4': 1.0, '3/4': 0.75, '6/8': 0.75 };
  
export const generateValidPattern = (timeSig, allowedTypes) => {
    const targetTotal = MEASURE_LENGTHS[timeSig];
    let steps = [];
    let currentTotal = 0;
  
    // Safety loop to prevent infinite recursion
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (Math.abs(currentTotal - targetTotal) > 0.001 && attempts < MAX_ATTEMPTS) {
        // 1. Calculate Remaining Space
        const remaining = targetTotal - currentTotal;
  
        // 2. Filter allowed types that fit in remaining space
        let options = [];
        
        if (allowedTypes.includes('16th') && remaining >= D.SIXTEENTH) options.push(D.SIXTEENTH);
        if (allowedTypes.includes('8th') && remaining >= D.EIGHTH) options.push(D.EIGHTH);
        if (allowedTypes.includes('dotted8') && remaining >= D.DOTTED_EIGHTH) options.push(D.DOTTED_EIGHTH);
        if (allowedTypes.includes('quarter') && remaining >= D.QUARTER) options.push(D.QUARTER);
        if (allowedTypes.includes('dotted4') && remaining >= D.DOTTED_QUARTER) options.push(D.DOTTED_QUARTER);
        
        // Special Handling for Triplets (Must fit a Quarter note block 0.25)
        // We add them as a block of 3
        if (allowedTypes.includes('triplet') && remaining >= D.QUARTER) {
             options.push('TRIPLET_BLOCK');
        }

        // Fallback: If nothing fits (gap is tiny), fill with 16th or smallest unit
        if (options.length === 0) {
            // Reset and try again if we painted ourselves into a corner
            steps = [];
            currentTotal = 0;
            attempts++;
            continue; 
        }

        // 3. Pick Random Option
        const choice = options[Math.floor(Math.random() * options.length)];

        if (choice === 'TRIPLET_BLOCK') {
            // Add 3 triplets
            steps.push({ duration: D.TRIPLET, type: 'triplet' });
            steps.push({ duration: D.TRIPLET, type: 'triplet' });
            steps.push({ duration: D.TRIPLET, type: 'triplet' });
            currentTotal += D.QUARTER;
        } else {
            steps.push({ duration: choice, type: 'normal' });
            currentTotal += choice;
        }
    }

    // 4. Assign Strums (Smart Logic)
    // We assume standard Down/Up motion: Down on beats, Up on off-beats
    let acc = 0;
    return steps.map(s => {
        const start = acc;
        acc += s.duration;
        
        // Determine Strum Direction based on start time
        // Beats (0.0, 0.25, 0.5) are usually Downs
        // Offbeats (0.125, 0.375) are usually Ups
        // 16ths (0.0625) are Ups or Downs depending on position
        
        // Simple heuristic:
        // If it starts on a 8th note grid (0, 0.125, 0.25...) -> Check parity
        // 0 -> D, 0.125 -> U, 0.25 -> D ...
        
        const eighthGrid = Math.round(start / 0.125);
        const isEighthGrid = Math.abs(start - (eighthGrid * 0.125)) < 0.01;
        
        let strum = 'D';
        if (isEighthGrid) {
            strum = (eighthGrid % 2 === 0) ? 'D' : 'U';
        } else {
            // Likely a 16th note off-grid
            strum = 'U';
        }

        // Randomly insert Rests (20% chance), but never on the very first beat of measure
        const isRest = start > 0 && Math.random() > 0.8;
        
        return {
            strum: isRest ? ' ' : strum,
            duration: s.duration
        };
    });
};