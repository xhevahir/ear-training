import { describe, expect, it } from 'vitest';
import { concatScripts, note, offsetScript, scriptDuration, sequence } from '../src/core/script';

describe('script', () => {
  it('computes duration from the latest end', () => {
    expect(scriptDuration([])).toBe(0);
    expect(scriptDuration([note(0, 60, 2), note(1, 62, 0.5)])).toBe(2);
  });

  it('offsets events', () => {
    expect(offsetScript([note(0.5, 60, 1)], 2)[0]!.time).toBe(2.5);
  });

  it('concatenates with gaps and skips empty scripts', () => {
    const s = concatScripts(
      [sequence([60, 62], 0.5), [], [note(0, [60, 64, 67], 1, 'chord')]],
      0.25,
    );
    expect(s.map((e) => e.time)).toEqual([0, 0.5, 1.25]);
    expect(s[2]!.midi).toEqual([60, 64, 67]);
    expect(s[2]!.label).toBe('chord');
    expect(scriptDuration(s)).toBe(2.25);
  });
});
