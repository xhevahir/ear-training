import { describe, expect, it } from 'vitest';
import {
  chooseItem,
  initialWeights,
  newItems,
  updateWeight,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from '../src/core/item-selection';
import { seededRng } from '../src/core/rng';
import { curriculumV1 } from '../src/data/curriculum-v1';

describe('item selection', () => {
  it('detects items new relative to the previous stage of the strand', () => {
    expect(newItems(curriculumV1, 'int-harm-fixed-02')).toEqual(['TT', 'P8']);
    expect(newItems(curriculumV1, 'deg-diat-fixed-05')).toEqual(['4']);
    // a phase restart reuses known items
    expect(newItems(curriculumV1, 'int-harm-moving-02')).toEqual([]);
  });

  it('starts new items with a higher weight', () => {
    const stage = curriculumV1.strands[1]!.stages[3]!; // 1 5 3 7 4
    expect(initialWeights(stage, ['4'])).toEqual({ '1': 1, '5': 1, '3': 1, '7': 1, '4': 3 });
  });

  it('doubles weight on a wrong answer up to the cap, and decays toward the floor', () => {
    expect(updateWeight(1, false)).toBe(2);
    expect(updateWeight(6, false)).toBe(WEIGHT_MAX);
    expect(updateWeight(2, true)).toBeCloseTo(1.4);
    expect(updateWeight(1, true)).toBe(WEIGHT_MIN);
  });

  it('favours an item answered wrongly several times', () => {
    const rng = seededRng(3);
    const items = ['1', '5', '3', '7'];
    let weights: Record<string, number> = { '1': 1, '5': 1, '3': 1, '7': 1 };
    for (let i = 0; i < 3; i++) weights = { ...weights, '7': updateWeight(weights['7']!, false) };
    const counts: Record<string, number> = { '1': 0, '5': 0, '3': 0, '7': 0 };
    for (let i = 0; i < 3000; i++) counts[chooseItem(rng, items, weights, [])]!++;
    for (const other of ['1', '5', '3']) expect(counts['7']!).toBeGreaterThan(counts[other]! * 3);
  });

  it('keeps every item selectable however often it was correct', () => {
    const rng = seededRng(9);
    const items = ['TT', 'P8', 'P5'];
    let w = 1;
    for (let i = 0; i < 50; i++) w = updateWeight(w, true);
    const weights = { TT: w, P8: WEIGHT_MAX, P5: WEIGHT_MAX };
    const picks = new Set(Array.from({ length: 2000 }, () => chooseItem(rng, items, weights, [])));
    expect(picks.has('TT')).toBe(true);
  });

  it('never picks the same item a third time in a row', () => {
    const rng = seededRng(5);
    const weights = { TT: WEIGHT_MAX, P8: 0.0001 };
    for (let i = 0; i < 100; i++) {
      expect(chooseItem(rng, ['TT', 'P8'], weights, ['TT', 'TT'])).toBe('P8');
    }
  });
});
