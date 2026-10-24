import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateCurriculum, type Stage } from '../src/core/curriculum';
import { INTERVALS } from '../src/core/intervals';
import { SCALE_DEGREES } from '../src/core/pitch';
import { curriculumV1 } from '../src/data/curriculum-v1';

describe('docs/curriculum.md', () => {
  it('example stage passes validation when added to the curriculum', () => {
    const doc = readFileSync(new URL('../docs/curriculum.md', import.meta.url), 'utf8');
    const match = doc.match(/<!-- example-stage -->\s*```json\n([\s\S]*?)```/);
    expect(match).not.toBeNull();
    const stage = JSON.parse(match![1]!) as Stage;
    const c = structuredClone(curriculumV1);
    c.strands[0]!.stages.splice(3, 0, stage);
    expect(validateCurriculum(c, { interval: INTERVALS, 'scale-degree': SCALE_DEGREES })).toEqual(
      [],
    );
  });
});
