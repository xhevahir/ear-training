import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const DB_NAME = 'ear-training';
const DB_VERSION = 1;
const SINGLETON = 'current';

interface EarTrainingDB extends DBSchema {
  progress: { key: string; value: unknown };
  settings: { key: string; value: unknown };
  log: { key: number; value: unknown };
}

/** Thin wrapper over the app's IndexedDB database. Values are validated by callers. */
export class Database {
  private constructor(private readonly db: IDBPDatabase<EarTrainingDB>) {}

  static async open(name = DB_NAME): Promise<Database> {
    const db = await openDB<EarTrainingDB>(name, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('progress');
        db.createObjectStore('settings');
        db.createObjectStore('log', { autoIncrement: true });
      },
    });
    return new Database(db);
  }

  getProgress(): Promise<unknown> {
    return this.db.get('progress', SINGLETON);
  }

  async putProgress(value: unknown): Promise<void> {
    await this.db.put('progress', value, SINGLETON);
  }

  getSettings(): Promise<unknown> {
    return this.db.get('settings', SINGLETON);
  }

  async putSettings(value: unknown): Promise<void> {
    await this.db.put('settings', value, SINGLETON);
  }

  async appendLog(event: unknown): Promise<void> {
    await this.db.add('log', event);
  }

  /** All log events in insertion (chronological) order. */
  allLog(): Promise<unknown[]> {
    return this.db.getAll('log');
  }

  close(): void {
    this.db.close();
  }
}
