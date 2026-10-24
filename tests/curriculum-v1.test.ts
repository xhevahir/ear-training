import { describe, expect, it } from 'vitest';
import { validateCurriculum } from '../src/core/curriculum';
import { INTERVALS } from '../src/core/intervals';
import { SCALE_DEGREES } from '../src/core/pitch';
import { curriculumV1 } from '../src/data/curriculum-v1';

const catalog = { interval: INTERVALS, 'scale-degree': SCALE_DEGREES };

describe('v1 curriculum', () => {
  it('validates', () => {
    expect(validateCurriculum(curriculumV1, catalog)).toEqual([]);
  });

  it('has 30 interval stages and 15 scale-degree stages', () => {
    const [intervals, degrees] = curriculumV1.strands;
    expect(intervals!.id).toBe('intervals');
    expect(intervals!.stages).toHaveLength(30);
    expect(degrees!.stages).toHaveLength(15);
  });

  it('starts with tritone vs octave, harmonic, fixed root', () => {
    const first = curriculumV1.strands[0]!.stages[0]!;
    expect(first.items).toEqual(['TT', 'P8']);
    expect(first.params).toMatchObject({ root: 'fixed', direction: 'harmonic' });
  });

  it('starts scale degrees with 1 vs 5 in a fixed key', () => {
    const first = curriculumV1.strands[1]!.stages[0]!;
    expect(first.items).toEqual(['1', '5']);
    expect(first.params.root).toBe('fixed');
  });

  it('ends each strand with the full item set', () => {
    for (const strand of curriculumV1.strands) {
      expect(strand.stages.at(-1)!.items).toHaveLength(12);
    }
  });
});
