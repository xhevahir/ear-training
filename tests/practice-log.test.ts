import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { missingFields, type LogPayload } from '../src/log/events';
import { PracticeLog } from '../src/log/practice-log';
import { Database } from '../src/storage/db';

let n = 0;
const answer: LogPayload = {
  type: 'answer',
  strandId: 'intervals',
  stageId: 'int-harm-moving-08',
  level: 14,
  exercise: 'interval',
  item: 'P5',
  answer: 'P4',
  correct: false,
  responseMs: 1840,
  replays: 1,
  rootMidi: 62,
  root: 'D4',
  direction: 'harmonic',
  register: 'one-octave',
  instrument: 'piano',
  pointsBefore: 12,
  pointsAfter: 9,
};

describe('PracticeLog', () => {
  it('records an answer event with every required field', async () => {
    const db = await Database.open(`log-${n++}`);
    const log = new PracticeLog(
      db,
      { appVersion: '0.1.0', curriculumVersion: 1 },
      () => new Date('2026-10-24T08:00:00Z'),
    );
    log.sessionId = 's1';
    await log.record(answer);
    const [event] = (await db.allLog()) as Record<string, unknown>[];
    expect(missingFields(event!)).toEqual([]);
    expect(event).toMatchObject({
      type: 'answer',
      item: 'P5',
      answer: 'P4',
      correct: false,
      replays: 1,
      root: 'D4',
      t: '2026-10-24T08:00:00.000Z',
      sessionId: 's1',
    });
  });

  it('does not throw when a write fails', async () => {
    const errors: unknown[] = [];
    const failing = { appendLog: () => Promise.reject(new Error('quota')), allLog: async () => [] };
    const log = new PracticeLog(
      failing,
      { appVersion: '0.1.0', curriculumVersion: 1 },
      undefined,
      (e) => errors.push(e),
    );
    await expect(log.record(answer)).resolves.toBeUndefined();
    expect(errors).toHaveLength(1);
  });

  it('exports NDJSON with a header followed by events in order', async () => {
    const db = await Database.open(`log-${n++}`);
    const log = new PracticeLog(db, { appVersion: '0.1.0', curriculumVersion: 1 });
    await log.record({
      type: 'session_start',
      level: 1,
      stageId: 'int-harm-fixed-02',
      sessionMinutes: 10,
    });
    await log.record(answer);
    await log.record({
      type: 'session_end',
      reason: 'time',
      durationSec: 600,
      questions: 1,
      levelsGained: 0,
    });
    const lines = (await log.exportNdjson())
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines.map((l) => l.type)).toEqual(['header', 'session_start', 'answer', 'session_end']);
    expect(lines[0]).toMatchObject({ format: 'ear-training-log', formatVersion: 1, events: 3 });
  });
});
