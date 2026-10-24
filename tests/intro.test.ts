import { describe, expect, it } from 'vitest';
import { validateCurriculum } from '../src/core/curriculum';
import { seededRng } from '../src/core/rng';
import { curriculumV1 } from '../src/data/curriculum-v1';
import { createRegistry } from '../src/exercises';
import { intervalExercise } from '../src/exercises/interval';
import { scaleDegreeExercise } from '../src/exercises/scale-degree';

describe('new-item introduction', () => {
  it('plays a new scale degree three times with its label after the cadence', () => {
    const stage = curriculumV1.strands[1]!.stages[3]!; // adds 4
    const s = scaleDegreeExercise.introScript(stage, '4', seededRng(1));
    const labelled = s.filter((e) => e.label === '4');
    expect(labelled).toHaveLength(3);
    expect(new Set(labelled.map((e) => e.midi[0]))).toEqual(new Set([65])); // F4 in C
    expect(s.slice(0, 4).every((e) => e.midi.length === 4)).toBe(true); // cadence first
  });

  it('plays a new interval three times with its label', () => {
    const stage = curriculumV1.strands[0]!.stages[0]!;
    const s = intervalExercise.introScript(stage, 'TT', seededRng(1));
    expect(s.filter((e) => e.label === 'TT')).toHaveLength(3);
    expect(s.every((e) => e.midi.length === 2)).toBe(true);
  });

  it('introduces a mixed-direction interval in each direction', () => {
    const stage = curriculumV1.strands[0]!.stages.at(-1)!;
    const s = intervalExercise.introScript(stage, 'P5', seededRng(1));
    expect(s.filter((e) => e.label === 'P5')).toHaveLength(3);
    expect(s[0]!.midi).toHaveLength(2); // harmonic first
  });
});

describe('registry with v1 exercises', () => {
  it('validates the v1 curriculum', () => {
    expect(validateCurriculum(curriculumV1, createRegistry().catalog())).toEqual([]);
  });
});
