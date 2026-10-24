import type { Curriculum } from '../core/curriculum';
import { isProgress, migrateProgress, newProgress, type Progress } from '../core/progress';
import type { Database } from './db';

export const KEYBOARD_LAYOUTS = ['qwerty', 'dvorak'] as const;
export type KeyboardLayout = (typeof KEYBOARD_LAYOUTS)[number];

export interface Settings {
  sessionMinutes: number;
  excludedInstruments: string[];
  /** Only changes the key hints shown on answer buttons. */
  keyboardLayout: KeyboardLayout;
}

export const DEFAULT_SETTINGS: Settings = {
  sessionMinutes: 10,
  excludedInstruments: [],
  keyboardLayout: 'qwerty',
};

export function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sessionMinutes === 'number' &&
    v.sessionMinutes > 0 &&
    Array.isArray(v.excludedInstruments) &&
    v.excludedInstruments.every((s) => typeof s === 'string') &&
    // absent in settings saved before the option existed
    (v.keyboardLayout === undefined ||
      (KEYBOARD_LAYOUTS as readonly unknown[]).includes(v.keyboardLayout))
  );
}

/** Fills in defaults for fields missing from older saved settings. */
export function normalizeSettings(s: Partial<Settings>): Settings {
  return { ...DEFAULT_SETTINGS, ...s };
}

/** Loads progress, migrating it onto the current curriculum, or starts fresh. */
export async function loadProgress(db: Database, c: Curriculum): Promise<Progress> {
  const saved = await db.getProgress();
  if (!isProgress(saved)) return newProgress(c);
  return migrateProgress(saved, c);
}

export function saveProgress(db: Database, p: Progress): Promise<void> {
  return db.putProgress(p);
}

export async function loadSettings(db: Database): Promise<Settings> {
  const saved = await db.getSettings();
  return isSettings(saved) ? normalizeSettings(saved) : { ...DEFAULT_SETTINGS };
}

export function saveSettings(db: Database, s: Settings): Promise<void> {
  return db.putSettings(s);
}
