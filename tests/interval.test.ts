import { describe, expect, it } from 'vitest';
import type { Direction, Stage } from '../src/core/curriculum';
import { noteName } from '../src/core/pitch';
import { seededRng } from '../src/core/rng';
import { intervalExercise as ex } from '../src/exercises/interval';

const stage = (items: string[], root: 'fixed' | 'moving', direction: Direction): Stage => ({
  id: 't',
  items,
  params: { root, register: 'one-octave', direction },
});
const names = (s: { midi: number[] }[]) => s.map((e) => e.midi.map(noteName).join('+'));

describe('interval exercise', () => {
  it('orders answers by size', () => {
    expect(ex.answerOptions(stage(['P8', 'TT', 'P5', 'm2'], 'fixed', 'harmonic'))).toEqual([
      'm2',
      'TT',
      'P5',
      'P8',
    ]);
  });

  it('plays a harmonic interval with both tones together', () => {
    const q = ex.generate(stage(['TT', 'P8'], 'fixed', 'harmonic'), 'TT', seededRng(1));
    expect(names(q.script)).toEqual(['C4+Gb4']);
    expect(q.direction).toBe('harmonic');
  });

  it('plays an ascending P5 on a fixed root as C4 then G4', () => {
    const q = ex.generate(stage(['P5', 'P8'], 'fixed', 'ascending'), 'P5', seededRng(1));
    expect(names(q.script)).toEqual(['C4', 'G4']);
    expect(q.script[1]!.time).toBeGreaterThan(q.script[0]!.time);
  });

  it('plays a descending interval upper tone first', () => {
    const q = ex.generate(stage(['M3', 'P8'], 'fixed', 'descending'), 'M3', seededRng(1));
    expect(names(q.script)).toEqual(['C4', 'Ab3']);
  });

  it('varies roots in moving-root stages and never exceeds F5', () => {
    const rng = seededRng(2);
    const roots = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const q = ex.generate(stage(['P8'], 'moving', 'ascending'), 'P8', rng);
      roots.add(q.root);
      for (const e of q.script) for (const m of e.midi) expect(m).toBeLessThanOrEqual(77);
    }
    expect(roots.size).toBeGreaterThan(5);
  });

  it('mixes directions in mixed stages', () => {
    const rng = seededRng(3);
    const dirs = new Set(
      Array.from(
        { length: 60 },
        () => ex.generate(stage(['P5'], 'moving', 'mixed'), 'P5', rng).direction,
      ),
    );
    expect(dirs).toEqual(new Set(['harmonic', 'ascending', 'descending']));
  });

  it('plays no confirmation audio', () => {
    const q = ex.generate(stage(['P5', 'P8'], 'fixed', 'harmonic'), 'P5', seededRng(1));
    expect(ex.confirmScript(q)).toEqual([]);
  });

  it('contrasts the chosen P4 with a harmonic P5 on D', () => {
    const q = {
      exercise: 'interval',
      item: 'P5',
      root: 62,
      direction: 'harmonic' as const,
      register: 'one-octave' as const,
      script: [],
    };
    const s = ex.correctionScript(q, 'P4');
    expect(names(s)).toEqual(['D4+G4', 'D4+A4', 'D4', 'A4', 'D4+A4']);
    expect(s.map((e) => e.label)).toEqual(['You said P4', 'It was P5', 'P5', undefined, 'P5']);
    const times = s.map((e) => e.time);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('plays the melodic part low to high for a descending question', () => {
    const q = {
      exercise: 'interval',
      item: 'M3',
      root: 60,
      direction: 'descending' as const,
      register: 'one-octave' as const,
      script: [],
    };
    const s = ex.correctionScript(q, 'm3');
    expect(names(s)).toEqual(['C4', 'A3', 'C4', 'Ab3', 'Ab3', 'C4', 'C4', 'Ab3']);
  });
});
