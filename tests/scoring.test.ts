import { describe, expect, it } from 'vitest';
import type { Stage } from '../src/core/curriculum';
import { applyScore, scoreAnswer, stageTarget } from '../src/core/scoring';

const scoring = { correct: 1, wrong: -3, targetBase: 10, targetPerItem: 3 };
const stageOf = (n: number): Stage => ({
  id: `s${n}`,
  items: Array.from({ length: n }, (_, i) => `i${i}`),
  params: { root: 'fixed', register: 'one-octave' },
});

describe('scoring', () => {
  it('adds 1 for a correct answer', () => {
    expect(scoreAnswer(10, true, scoring)).toBe(11);
  });

  it('subtracts 3 for a wrong answer but never goes below zero', () => {
    expect(scoreAnswer(10, false, scoring)).toBe(7);
    expect(scoreAnswer(2, false, scoring)).toBe(0);
  });

  it('target grows with item count', () => {
    expect(stageTarget(stageOf(2), scoring)).toBe(16);
    expect(stageTarget(stageOf(7), scoring)).toBe(31);
    expect(stageTarget(stageOf(12), scoring)).toBe(46);
  });

  it('clears a two-item stage at 16 points, raising the level and resetting points', () => {
    expect(applyScore({ points: 15, level: 3 }, stageOf(2), true, scoring)).toEqual({
      points: 0,
      level: 4,
      cleared: true,
    });
  });

  it('never lowers the level on repeated mistakes', () => {
    let state = { points: 5, level: 7 };
    for (let i = 0; i < 10; i++) state = applyScore(state, stageOf(4), false, scoring);
    expect(state).toMatchObject({ points: 0, level: 7, cleared: false });
  });
});
