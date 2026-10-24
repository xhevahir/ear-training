import { describe, expect, it } from 'vitest';
import { nearestSample } from '../src/audio/sampler';

describe('nearestSample', () => {
  const samples = [{ midi: 57 }, { midi: 60 }, { midi: 63 }];

  it('uses the exact sample at rate 1', () => {
    expect(nearestSample(samples, 60)).toEqual({ sample: { midi: 60 }, rate: 1 });
  });

  it('retunes the nearest sample by equal-tempered semitones', () => {
    const { sample, rate } = nearestSample(samples, 61);
    expect(sample.midi).toBe(60);
    expect(rate).toBeCloseTo(2 ** (1 / 12));
    const down = nearestSample(samples, 56);
    expect(down.sample.midi).toBe(57);
    expect(down.rate).toBeCloseTo(2 ** (-1 / 12));
  });

  it('stretches beyond the range from the outermost sample', () => {
    expect(nearestSample(samples, 72).rate).toBeCloseTo(2 ** (9 / 12));
  });
});
