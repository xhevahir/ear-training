import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { newProgress, recordAnswer } from '../src/core/progress';
import { curriculumV1 } from '../src/data/curriculum-v1';
import { Database } from '../src/storage/db';
import { DEFAULT_SETTINGS, loadProgress, saveProgress } from '../src/storage/progress-store';
import { exportProgress, importProgress, parseProgressFile } from '../src/storage/transfer';

let n = 0;
const sample = () => {
  let p = newProgress(curriculumV1);
  for (let i = 0; i < 5; i++) p = recordAnswer(p, curriculumV1, 'TT', true).progress;
  return { ...p, level: 12 };
};

describe('progress transfer', () => {
  it('round-trips a valid export into another database', async () => {
    const text = exportProgress(sample(), {
      sessionMinutes: 15,
      excludedInstruments: ['harp'],
      keyboardLayout: 'dvorak',
    });
    const db = await Database.open(`transfer-${n++}`);
    const result = await importProgress(db, curriculumV1, text, async () => true);
    expect(result!.progress.level).toBe(12);
    expect(result!.progress.points).toBe(5);
    expect((await loadProgress(db, curriculumV1)).level).toBe(12);
    expect(await db.getSettings()).toEqual({
      sessionMinutes: 15,
      excludedInstruments: ['harp'],
      keyboardLayout: 'dvorak',
    });
  });

  it('leaves progress unchanged when the import is not confirmed', async () => {
    const db = await Database.open(`transfer-${n++}`);
    const mine = newProgress(curriculumV1);
    await saveProgress(db, mine);
    const result = await importProgress(
      db,
      curriculumV1,
      exportProgress(sample(), DEFAULT_SETTINGS),
      async () => false,
    );
    expect(result).toBeNull();
    expect(await loadProgress(db, curriculumV1)).toEqual(mine);
  });

  it.each([
    ['not JSON', 'hello'],
    ['wrong format', JSON.stringify({ format: 'other' })],
    [
      'damaged progress',
      JSON.stringify({
        format: 'ear-training-progress',
        schemaVersion: 1,
        progress: { level: 2 },
        settings: DEFAULT_SETTINGS,
      }),
    ],
  ])('rejects %s without changing progress', async (_name, text) => {
    const db = await Database.open(`transfer-${n++}`);
    const mine = newProgress(curriculumV1);
    await saveProgress(db, mine);
    await expect(importProgress(db, curriculumV1, text, async () => true)).rejects.toThrow();
    expect(await loadProgress(db, curriculumV1)).toEqual(mine);
  });

  it('includes a format marker and timestamp', () => {
    const file = parseProgressFile(
      exportProgress(sample(), DEFAULT_SETTINGS, new Date('2026-01-02T03:04:05Z')),
    );
    expect(file.format).toBe('ear-training-progress');
    expect(file.exportedAt).toBe('2026-01-02T03:04:05.000Z');
  });
});

describe('settings from older versions', () => {
  it('loads settings without a keyboard layout as QWERTY', async () => {
    const { loadSettings } = await import('../src/storage/progress-store');
    const db = await Database.open(`transfer-${n++}`);
    await db.putSettings({ sessionMinutes: 20, excludedInstruments: [] });
    expect(await loadSettings(db)).toEqual({
      sessionMinutes: 20,
      excludedInstruments: [],
      keyboardLayout: 'qwerty',
    });
  });

  it('imports an older progress file without a keyboard layout', () => {
    const text = exportProgress(sample(), { sessionMinutes: 10, excludedInstruments: [] } as never);
    expect(parseProgressFile(text).settings.keyboardLayout).toBe('qwerty');
  });
});
