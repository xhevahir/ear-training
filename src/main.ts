import './ui/styles.css';
import type { InstrumentInfo } from './audio/instruments';
import { WebAudioPort } from './audio/web-audio-port';
import { assertValidCurriculum } from './core/curriculum';
import { curriculumV1 } from './data/curriculum-v1';
import { createRegistry } from './exercises';
import { PracticeLog } from './log/practice-log';
import { Database } from './storage/db';
import { loadProgress, loadSettings } from './storage/progress-store';
import { App } from './ui/app';

const SAMPLES = `${import.meta.env.BASE_URL}samples/`;

async function main(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app')!;
  const registry = createRegistry();
  const curriculum = curriculumV1;
  assertValidCurriculum(curriculum, registry.catalog());

  const db = await Database.open();
  const [progress, settings, instruments] = await Promise.all([
    loadProgress(db, curriculum),
    loadSettings(db),
    fetch(`${SAMPLES}instruments.json`).then((r) => r.json() as Promise<InstrumentInfo[]>),
  ]);

  const app = new App({
    root,
    db,
    curriculum,
    registry,
    audio: new WebAudioPort(SAMPLES),
    log: new PracticeLog(db, {
      appVersion: __APP_VERSION__,
      curriculumVersion: curriculum.version,
    }),
    instruments,
    progress,
    settings,
  });
  app.showHome();
}

main().catch((error: unknown) => {
  console.error(error);
  document.querySelector('#app')!.textContent = `The app could not start: ${String(error)}`;
});
