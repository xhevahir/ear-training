import type { Curriculum } from '../core/curriculum';
import {
  isProgress,
  migrateProgress,
  PROGRESS_SCHEMA_VERSION,
  type Progress,
} from '../core/progress';
import type { Database } from './db';
import {
  isSettings,
  normalizeSettings,
  saveProgress,
  saveSettings,
  type Settings,
} from './progress-store';

export const PROGRESS_FORMAT = 'ear-training-progress';

export interface ProgressFile {
  format: typeof PROGRESS_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  progress: Progress;
  settings: Settings;
}

export function exportProgress(progress: Progress, settings: Settings, now = new Date()): string {
  const file: ProgressFile = {
    format: PROGRESS_FORMAT,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    progress,
    settings,
  };
  return JSON.stringify(file, null, 2);
}

/** Parses and validates an exported progress file; throws a readable error if invalid. */
export function parseProgressFile(text: string): ProgressFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a progress export (not valid JSON).');
  }
  const v = data as Partial<ProgressFile> | null;
  if (typeof v !== 'object' || v === null || v.format !== PROGRESS_FORMAT)
    throw new Error('This file is not a progress export.');
  if (v.schemaVersion !== PROGRESS_SCHEMA_VERSION)
    throw new Error(`Unsupported progress export version ${String(v.schemaVersion)}.`);
  if (!isProgress(v.progress) || !isSettings(v.settings))
    throw new Error('This progress export is damaged or incomplete.');
  return { ...(v as ProgressFile), settings: normalizeSettings(v.settings) };
}

/**
 * Imports a progress file, replacing current progress and settings only after `confirm`
 * resolves true. Invalid files throw without touching stored data.
 */
export async function importProgress(
  db: Database,
  c: Curriculum,
  text: string,
  confirm: (file: ProgressFile) => Promise<boolean>,
): Promise<{ progress: Progress; settings: Settings } | null> {
  const file = parseProgressFile(text);
  if (!(await confirm(file))) return null;
  const progress = migrateProgress(file.progress, c);
  await saveProgress(db, progress);
  await saveSettings(db, file.settings);
  return { progress, settings: file.settings };
}
