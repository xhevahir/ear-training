import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Database } from '../src/storage/db';

let n = 0;
const fresh = () => Database.open(`test-${n++}`);

describe('Database', () => {
  it('starts empty', async () => {
    const db = await fresh();
    expect(await db.getProgress()).toBeUndefined();
    expect(await db.getSettings()).toBeUndefined();
    expect(await db.allLog()).toEqual([]);
  });

  it('round-trips progress and settings', async () => {
    const db = await fresh();
    await db.putProgress({ level: 3 });
    await db.putProgress({ level: 4 });
    await db.putSettings({ sessionMinutes: 15 });
    expect(await db.getProgress()).toEqual({ level: 4 });
    expect(await db.getSettings()).toEqual({ sessionMinutes: 15 });
  });

  it('keeps log events in order and persists across reopen', async () => {
    const name = `test-${n++}`;
    const db = await Database.open(name);
    await db.appendLog({ type: 'a' });
    await db.appendLog({ type: 'b' });
    db.close();
    const again = await Database.open(name);
    expect(await again.allLog()).toEqual([{ type: 'a' }, { type: 'b' }]);
  });
});
