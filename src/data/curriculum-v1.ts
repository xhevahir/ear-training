import type { Curriculum, Stage, StageParams } from '../core/curriculum';

/**
 * v1 curriculum. Item orders separate easily-confused items; see design.md D5.
 * Stage IDs are stable: never rename or reuse one, because saved progress refers to them.
 */

const INTERVAL_ORDER = ['TT', 'P8', 'P5', 'M3', 'm2', 'P4', 'm3', 'M7', 'M6', 'M2', 'm6', 'm7'];
const DEGREE_ORDER = ['1', '5', '3', '7', '4', '2', '6', 'b7', 'b3', '#4', 'b6', 'b2'];

function stages(prefix: string, order: string[], sizes: number[], params: StageParams): Stage[] {
  return sizes.map((n) => ({
    id: `${prefix}-${String(n).padStart(2, '0')}`,
    items: order.slice(0, n),
    params,
  }));
}

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

export const curriculumV1: Curriculum = {
  version: 1,
  instrumentThresholdLevel: 21,
  scoring: { correct: 1, wrong: -3, targetBase: 10, targetPerItem: 3 },
  strands: [
    {
      id: 'intervals',
      title: 'Intervals',
      exercise: 'interval',
      prerequisites: [],
      stages: [
        // B1: harmonic, fixed root
        ...stages('int-harm-fixed', INTERVAL_ORDER, range(2, 12), {
          root: 'fixed',
          register: 'one-octave',
          direction: 'harmonic',
        }),
        // B2: harmonic, moving root
        ...stages('int-harm-moving', INTERVAL_ORDER, range(2, 12, 2), {
          root: 'moving',
          register: 'one-octave',
          direction: 'harmonic',
        }),
        // B3: melodic ascending
        ...stages('int-asc', INTERVAL_ORDER, range(2, 12, 2), {
          root: 'moving',
          register: 'one-octave',
          direction: 'ascending',
        }),
        // B4: melodic descending
        ...stages('int-desc', INTERVAL_ORDER, range(2, 12, 2), {
          root: 'moving',
          register: 'one-octave',
          direction: 'descending',
        }),
        // B5: all directions mixed
        ...stages('int-mixed', INTERVAL_ORDER, [12], {
          root: 'moving',
          register: 'one-octave',
          direction: 'mixed',
        }),
      ],
    },
    {
      id: 'degrees',
      title: 'Scale degrees',
      exercise: 'scale-degree',
      prerequisites: [],
      stages: [
        // A1: diatonic, fixed key (C)
        ...stages('deg-diat-fixed', DEGREE_ORDER, range(2, 7), {
          root: 'fixed',
          register: 'one-octave',
        }),
        // A2: diatonic, moving key (restarts at 3: 1-5 alone is trivial after A1)
        ...stages('deg-diat-moving', DEGREE_ORDER, [3, 5, 7], {
          root: 'moving',
          register: 'one-octave',
        }),
        // A3: chromatic, one new degree per stage
        ...stages('deg-chrom', DEGREE_ORDER, range(8, 12), {
          root: 'moving',
          register: 'one-octave',
        }),
        // A4: two-octave register
        ...stages('deg-wide', DEGREE_ORDER, [12], { root: 'moving', register: 'wide' }),
      ],
    },
  ],
};
