import { describe, expect, it } from 'vitest';
import type { Curriculum, Strand } from '../src/core/curriculum';
import { isCurriculumComplete, nextStage } from '../src/core/scheduler';
import { curriculumV1 } from '../src/data/curriculum-v1';

const params = { root: 'fixed', register: 'one-octave' } as const;
const strand = (id: string, n: number, prerequisites: string[] = []): Strand => ({
  id,
  title: id,
  exercise: 'x',
  prerequisites,
  stages: Array.from({ length: n }, (_, i) => ({ id: `${id}${i + 1}`, items: ['a', 'b'], params })),
});
const curriculum = (...strands: Strand[]): Curriculum => ({
  version: 1,
  instrumentThresholdLevel: 21,
  scoring: { correct: 1, wrong: -3, targetBase: 10, targetPerItem: 3 },
  strands,
});

describe('nextStage', () => {
  it('starts a new learner on the first strand in curriculum order', () => {
    const next = nextStage(curriculumV1, { cleared: new Set(), strandLastPracticed: {} });
    expect(next).toEqual({ strandId: 'intervals', stageId: 'int-harm-fixed-02', review: false });
  });

  it('alternates between two strands', () => {
    const c = curriculumV1;
    const cleared = new Set<string>();
    const last: Record<string, number> = {};
    const seen: string[] = [];
    for (let t = 1; t <= 6; t++) {
      const next = nextStage(c, { cleared, strandLastPracticed: last });
      seen.push(next.stageId);
      last[next.strandId] = t;
      cleared.add(next.stageId);
    }
    expect(seen).toEqual([
      'int-harm-fixed-02',
      'deg-diat-fixed-02',
      'int-harm-fixed-03',
      'deg-diat-fixed-03',
      'int-harm-fixed-04',
      'deg-diat-fixed-04',
    ]);
  });

  it('keeps a locked strand out until its prerequisite is cleared', () => {
    const c = curriculum(strand('a', 3), strand('c', 2, ['a2']));
    const last = { a: 5 };
    expect(nextStage(c, { cleared: new Set(['a1']), strandLastPracticed: last }).strandId).toBe(
      'a',
    );
    const unlocked = nextStage(c, { cleared: new Set(['a1', 'a2']), strandLastPracticed: last });
    expect(unlocked).toMatchObject({ strandId: 'c', stageId: 'c1' });
  });

  it('continues with the only remaining strand', () => {
    const c = curriculum(strand('a', 1), strand('b', 3));
    const next = nextStage(c, {
      cleared: new Set(['a1', 'b1']),
      strandLastPracticed: { a: 1, b: 2 },
    });
    expect(next).toMatchObject({ strandId: 'b', stageId: 'b2' });
  });

  it('rotates review through final stages once the curriculum is complete', () => {
    const c = curriculum(strand('a', 2), strand('b', 2));
    const cleared = new Set(['a1', 'a2', 'b1', 'b2']);
    expect(isCurriculumComplete(c, cleared)).toBe(true);
    expect(nextStage(c, { cleared, strandLastPracticed: { a: 2, b: 1 } })).toEqual({
      strandId: 'b',
      stageId: 'b2',
      review: true,
    });
    expect(nextStage(c, { cleared, strandLastPracticed: { a: 2, b: 3 } }).stageId).toBe('a2');
  });
});
