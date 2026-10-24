import { describe, expect, it } from 'vitest';
import { validateCurriculum, type Curriculum } from '../src/core/curriculum';
import { ExerciseRegistry } from '../src/exercises/registry';
import type { ExerciseType } from '../src/exercises/types';

const dummy: ExerciseType = {
  name: 'dummy',
  items: ['a', 'b'],
  answerOptions: (stage) => stage.items,
  generate: (_stage, item) => ({
    exercise: 'dummy',
    item,
    root: 60,
    register: 'one-octave',
    script: [],
  }),
  confirmScript: () => [],
  correctionScript: () => [],
  introScript: () => [],
};

const curriculum = (exercise: string): Curriculum => ({
  version: 1,
  instrumentThresholdLevel: 21,
  scoring: { correct: 1, wrong: -3, targetBase: 10, targetPerItem: 3 },
  strands: [
    {
      id: 's',
      title: 's',
      exercise,
      prerequisites: [],
      stages: [{ id: 's1', items: ['a', 'b'], params: { root: 'fixed', register: 'one-octave' } }],
    },
  ],
});

describe('ExerciseRegistry', () => {
  it('provides a catalog the curriculum validator uses', () => {
    const registry = new ExerciseRegistry([dummy]);
    expect(validateCurriculum(curriculum('dummy'), registry.catalog())).toEqual([]);
    expect(validateCurriculum(curriculum('other'), registry.catalog()).join()).toMatch(
      /unknown exercise type "other"/,
    );
  });

  it('rejects duplicate registration and unknown lookups', () => {
    const registry = new ExerciseRegistry([dummy]);
    expect(() => registry.register(dummy)).toThrow(/already registered/);
    expect(() => registry.get('nope')).toThrow(/unknown exercise type/);
  });
});
