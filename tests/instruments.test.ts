import { describe, expect, it } from 'vitest';
import { chooseInstrument, excludable, loadWithFallback } from '../src/audio/instruments';
import { seededRng } from '../src/core/rng';

const all = [
  { id: 'piano', name: 'Piano' },
  { id: 'organ', name: 'Organ' },
  { id: 'harp', name: 'Harp' },
];

describe('instrument selection', () => {
  it('uses piano below the threshold', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 50; i++) expect(chooseInstrument(20, 21, all, [], rng)).toBe('piano');
  });

  it('chooses among non-excluded instruments from the threshold on', () => {
    const rng = seededRng(2);
    const picks = new Set(
      Array.from({ length: 200 }, () => chooseInstrument(21, 21, all, ['harp'], rng)),
    );
    expect(picks).toEqual(new Set(['piano', 'organ']));
  });

  it('never lets piano be excluded', () => {
    const rng = seededRng(3);
    expect(excludable(all).map((i) => i.id)).toEqual(['organ', 'harp']);
    for (let i = 0; i < 50; i++) {
      expect(chooseInstrument(30, 21, all, ['piano', 'organ', 'harp'], rng)).toBe('piano');
    }
  });

  it('falls back to piano when an instrument fails to load', async () => {
    const failures: string[] = [];
    const load = async (id: string) => {
      if (id === 'organ') throw new Error('network');
      return `${id}-buffers`;
    };
    const result = await loadWithFallback('organ', load, (id) => failures.push(id));
    expect(result).toEqual({ id: 'piano', instrument: 'piano-buffers' });
    expect(failures).toEqual(['organ']);
  });

  it('propagates a piano load failure', async () => {
    await expect(loadWithFallback('piano', () => Promise.reject(new Error('x')))).rejects.toThrow(
      'x',
    );
  });
});
