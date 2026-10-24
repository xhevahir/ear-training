import { describe, expect, it } from 'vitest';
import type { Stage } from '../src/core/curriculum';
import { noteName } from '../src/core/pitch';
import { seededRng } from '../src/core/rng';
import { scaleDegreeExercise as ex } from '../src/exercises/scale-degree';

const stage = (
  items: string[],
  root: 'fixed' | 'moving',
  register: 'one-octave' | 'wide' = 'one-octave',
): Stage => ({
  id: 't',
  items,
  params: { root, register },
});
const names = (s: { midi: number[] }[]) => s.map((e) => e.midi.map(noteName).join('+'));

describe('scale-degree exercise', () => {
  it('orders answers by pitch', () => {
    expect(ex.answerOptions(stage(['7', '1', '#4', '3', 'b2'], 'fixed'))).toEqual([
      '1',
      'b2',
      '3',
      '#4',
      '7',
    ]);
  });

  it('plays a I-IV-V-I cadence in C then the target in a fixed-key stage', () => {
    const q = ex.generate(stage(['1', '5'], 'fixed'), '5', seededRng(1));
    expect(q.root).toBe(60);
    expect(names(q.script)).toEqual([
      'C3+E4+G4+C5',
      'F3+F4+A4+C5',
      'G3+D4+G4+B4',
      'C3+E4+G4+C5',
      'G4',
    ]);
    // chords start together and are evenly spaced; target follows after a gap
    const times = q.script.map((e) => e.time);
    expect(times[1]! - times[0]!).toBeCloseTo(times[2]! - times[1]!);
    expect(times[4]!).toBeGreaterThan(times[3]! + 0.6);
  });

  it('varies the key in moving-key stages and keeps the tonic in F3..E4', () => {
    const rng = seededRng(2);
    const tonics = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const q = ex.generate(stage(['1', '3'], 'moving'), '3', rng);
      expect(q.root).toBeGreaterThanOrEqual(53);
      expect(q.root).toBeLessThanOrEqual(64);
      expect(q.script.at(-1)!.midi[0]).toBe(q.root + 4);
      tonics.add(q.root);
    }
    expect(tonics.size).toBeGreaterThan(5);
  });

  it('keeps targets within the octave above the tonic, or two octaves when wide', () => {
    const rng = seededRng(3);
    const octaves = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const one = ex.generate(stage(['7'], 'moving'), '7', rng);
      expect(one.script.at(-1)!.midi[0]! - one.root).toBe(11);
      const wide = ex.generate(stage(['7'], 'moving', 'wide'), '7', rng);
      const diff = wide.script.at(-1)!.midi[0]! - wide.root;
      expect([-1, 11]).toContain(diff);
      octaves.add(diff);
    }
    expect(octaves.size).toBe(2);
  });

  describe('feedback', () => {
    const inC = (item: string) => ex.generate(stage([item, '1'], 'fixed'), item, seededRng(4));

    it('resolves 7 up to the tonic and 2 down to it', () => {
      expect(names(ex.confirmScript(inC('7')))).toEqual(['B4', 'C5']);
      expect(names(ex.confirmScript(inC('2')))).toEqual(['D4', 'C4']);
    });

    it('walks from the tonic to 3 and holds it', () => {
      const s = ex.correctionScript(inC('3'), '6');
      expect(names(s)).toEqual(['C4', 'D4', 'E4']);
      expect(s.map((e) => e.label)).toEqual(['1', '2', '3']);
      expect(s.at(-1)!.duration).toBeGreaterThan(s[0]!.duration);
    });

    it('walks to a chromatic degree with a final chromatic step', () => {
      const q = ex.generate(stage(['b6', '1'], 'fixed'), 'b6', seededRng(4));
      const s = ex.correctionScript(q, '5');
      expect(names(s)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'Ab4']);
      expect(s.at(-1)!.label).toBe('b6');
    });

    it('plays and holds the tonic when the target was 1', () => {
      const s = ex.correctionScript(inC('1'), '5');
      expect(names(s)).toEqual(['C4']);
    });

    it('walks from the lower tonic in a wide-register question', () => {
      const rng = seededRng(11);
      for (let i = 0; i < 20; i++) {
        const q = ex.generate(stage(['3', '1'], 'moving', 'wide'), '3', rng);
        const s = ex.correctionScript(q, '1');
        expect(s.at(-1)!.midi[0]).toBe(q.script.at(-1)!.midi[0]);
      }
    });
  });
});
