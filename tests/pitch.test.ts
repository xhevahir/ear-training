import { describe, expect, it } from 'vitest';
import { degreeMidi, majorScaleStep, noteName } from '../src/core/pitch';
import { pick, randomInt, seededRng, weightedIndex } from '../src/core/rng';

describe('pitch', () => {
  it('names notes', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(70)).toBe('Bb4');
    expect(noteName(57)).toBe('A3');
  });

  it('finds scale degrees', () => {
    const d4 = 62;
    expect(noteName(degreeMidi(d4, 'b6'))).toBe('Bb4');
    expect(noteName(degreeMidi(d4, '#4'))).toBe('Ab4');
    expect(degreeMidi(60, '7')).toBe(71);
  });

  it('walks the major scale across octaves', () => {
    expect(majorScaleStep(60, 0)).toBe(60);
    expect(majorScaleStep(60, 2)).toBe(64);
    expect(majorScaleStep(60, 7)).toBe(72);
    expect(majorScaleStep(60, -1)).toBe(59);
  });
});

describe('rng', () => {
  it('is reproducible for a seed', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const xs = Array.from({ length: 5 }, () => a.next());
    const ys = Array.from({ length: 5 }, () => b.next());
    expect(xs).toEqual(ys);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('produces integers and picks within bounds', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 200; i++) {
      const n = randomInt(rng, 3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
    expect(['a', 'b']).toContain(pick(rng, ['a', 'b']));
  });

  it('respects weights', () => {
    const rng = seededRng(7);
    const counts = [0, 0];
    for (let i = 0; i < 2000; i++) counts[weightedIndex(rng, [1, 3])]!++;
    expect(counts[1]! / counts[0]!).toBeGreaterThan(2.5);
    expect(counts[1]! / counts[0]!).toBeLessThan(3.5);
  });
});
