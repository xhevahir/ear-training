import type { ScaleDegree } from '../core/pitch';

/**
 * Stepwise resolution played after a correct scale-degree answer, as semitones above the
 * tonic of the target's octave (12 = upper tonic). Tune by ear; see design.md D7.
 */
export const RESOLUTIONS: Record<ScaleDegree, number[]> = {
  '1': [0],
  '2': [2, 0],
  '3': [4, 2, 0],
  '4': [5, 4, 2, 0],
  '5': [7, 9, 11, 12],
  '6': [9, 11, 12],
  '7': [11, 12],
  b2: [1, 0],
  b3: [3, 2, 0],
  '#4': [6, 7, 9, 11, 12],
  b6: [8, 7, 9, 11, 12],
  b7: [10, 9, 11, 12],
};
