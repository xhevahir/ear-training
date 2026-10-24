import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { Curriculum } from '../src/core/curriculum';
import { migrateProgress, newProgress, recordAnswer } from '../src/core/progress';
import { curriculumV1 } from '../src/data/curriculum-v1';
import { Database } from '../src/storage/db';
import {
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from '../src/storage/progress-store';

let n = 0;

describe('progress transitions', () => {
  it('starts a new learner at level 1 on the first stage with new-item weights', () => {
    const p = newProgress(curriculumV1);
    expect(p).toMatchObject({ level: 1, points: 0, currentStageId: 'int-harm-fixed-02' });
    expect(p.itemWeights).toEqual({ TT: 3, P8: 3 });
  });

  it('clears a stage at its target and moves to the other strand', () => {
    let p = newProgress(curriculumV1);
    let outcome;
    for (let i = 0; i < 16; i++) {
      outcome = recordAnswer(p, curriculumV1, i % 2 ? 'TT' : 'P8', true);
      p = outcome.progress;
    }
    expect(outcome!.cleared).toBe(true);
    expect(outcome!.pointsBefore).toBe(15);
    expect(outcome!.stageQuestions).toBe(16);
    expect(p.stageQuestions).toBe(0);
    expect(p).toMatchObject({ level: 2, points: 0, currentStageId: 'deg-diat-fixed-02' });
    expect(p.clearedStageIds).toEqual(['int-harm-fixed-02']);
  });

  it('applies the wrong-answer penalty and weight increase', () => {
    let p = newProgress(curriculumV1);
    p = recordAnswer(p, curriculumV1, 'TT', true).progress;
    p = recordAnswer(p, curriculumV1, 'TT', true).progress;
    const o = recordAnswer(p, curriculumV1, 'P8', false);
    expect(o.pointsAfter).toBe(0);
    expect(o.progress.itemWeights.P8).toBe(6);
  });
});

describe('curriculum migration', () => {
  const withInsertedStage = (): Curriculum => {
    const c = structuredClone(curriculumV1);
    c.version = 2;
    c.strands[0]!.stages.splice(1, 0, {
      id: 'int-new-stage',
      items: ['TT', 'P8', 'm2'],
      params: { root: 'fixed', register: 'one-octave', direction: 'harmonic' },
    });
    return c;
  };

  it('keeps the current stage and points when a stage is inserted before it', () => {
    const p = {
      ...newProgress(curriculumV1),
      currentStageId: 'int-harm-fixed-05',
      points: 9,
      level: 8,
    };
    const m = migrateProgress(p, withInsertedStage());
    expect(m).toMatchObject({
      currentStageId: 'int-harm-fixed-05',
      points: 9,
      level: 8,
      curriculumVersion: 2,
    });
  });

  it('drops unknown stages, keeps the level, and reschedules a vanished current stage', () => {
    const c = structuredClone(curriculumV1);
    c.version = 3;
    c.strands[0]!.stages = c.strands[0]!.stages.filter((s) => s.id !== 'int-harm-fixed-03');
    const p = {
      ...newProgress(curriculumV1),
      clearedStageIds: ['int-harm-fixed-02', 'deg-diat-fixed-02'],
      currentStageId: 'int-harm-fixed-03',
      points: 12,
      level: 3,
      strandLastPracticed: { intervals: 1, degrees: 2 },
    };
    const m = migrateProgress({ ...p, clearedStageIds: [...p.clearedStageIds, 'gone'] }, c);
    expect(m.level).toBe(3);
    expect(m.clearedStageIds).toEqual(['int-harm-fixed-02', 'deg-diat-fixed-02']);
    expect(m.currentStageId).toBe('int-harm-fixed-04');
    expect(m.points).toBe(0);
  });
});

describe('progress store', () => {
  it('saves and reloads progress and settings', async () => {
    const db = await Database.open(`progress-${n++}`);
    const fresh = await loadProgress(db, curriculumV1);
    expect(fresh.level).toBe(1);
    const p = recordAnswer(fresh, curriculumV1, 'TT', true).progress;
    await saveProgress(db, p);
    expect(await loadProgress(db, curriculumV1)).toEqual(p);
    expect(await loadSettings(db)).toEqual({
      sessionMinutes: 10,
      excludedInstruments: [],
      keyboardLayout: 'qwerty',
    });
    await saveSettings(db, {
      sessionMinutes: 15,
      excludedInstruments: ['harp'],
      keyboardLayout: 'dvorak',
    });
    expect((await loadSettings(db)).sessionMinutes).toBe(15);
  });

  it('starts fresh when stored progress is malformed', async () => {
    const db = await Database.open(`progress-${n++}`);
    await db.putProgress({ level: 'high' });
    expect((await loadProgress(db, curriculumV1)).level).toBe(1);
  });
});
