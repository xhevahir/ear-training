import { describe, expect, it } from 'vitest';
import { validateCurriculum, type Curriculum } from '../src/core/curriculum';

const catalog = { interval: ['TT', 'P8', 'P5'], 'scale-degree': ['1', '5', '3'] };

function base(): Curriculum {
  return {
    version: 1,
    instrumentThresholdLevel: 21,
    scoring: { correct: 1, wrong: -3, targetBase: 10, targetPerItem: 3 },
    strands: [
      {
        id: 'intervals',
        title: 'Intervals',
        exercise: 'interval',
        prerequisites: [],
        stages: [
          {
            id: 'i1',
            items: ['TT', 'P8'],
            params: { root: 'fixed', register: 'one-octave', direction: 'harmonic' },
          },
        ],
      },
      {
        id: 'degrees',
        title: 'Degrees',
        exercise: 'scale-degree',
        prerequisites: ['i1'],
        stages: [
          { id: 'd1', items: ['1', '5'], params: { root: 'fixed', register: 'one-octave' } },
        ],
      },
    ],
  };
}

describe('validateCurriculum', () => {
  it('accepts a valid curriculum', () => {
    expect(validateCurriculum(base(), catalog)).toEqual([]);
  });

  it('rejects an unknown exercise type', () => {
    const c = base();
    c.strands[0]!.exercise = 'rhythm';
    expect(validateCurriculum(c, catalog).join()).toMatch(/unknown exercise type/);
  });

  it('rejects an unknown item', () => {
    const c = base();
    c.strands[0]!.stages[0]!.items = ['TT', 'm9'];
    expect(validateCurriculum(c, catalog).join()).toMatch(/unknown item "m9"/);
  });

  it('rejects an unknown prerequisite', () => {
    const c = base();
    c.strands[1]!.prerequisites = ['nope'];
    expect(validateCurriculum(c, catalog).join()).toMatch(/unknown prerequisite/);
  });

  it('rejects a strand with no stages', () => {
    const c = base();
    c.strands[1]!.stages = [];
    c.strands[1]!.prerequisites = [];
    expect(validateCurriculum(c, catalog).join()).toMatch(/has no stages/);
  });

  it('rejects duplicate stage ids', () => {
    const c = base();
    c.strands[1]!.stages[0]!.id = 'i1';
    c.strands[1]!.prerequisites = [];
    expect(validateCurriculum(c, catalog).join()).toMatch(/duplicate stage id/);
  });
});
