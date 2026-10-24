import { newProgress, type Progress } from '../src/core/progress';
import { seededRng } from '../src/core/rng';
import type { Script } from '../src/core/script';
import { curriculumV1 } from '../src/data/curriculum-v1';
import { createRegistry } from '../src/exercises';
import type { LogPayload } from '../src/log/events';
import type { AudioPort, PlayHandle } from '../src/session/ports';
import { Session, type SessionView } from '../src/session/session';
import { DEFAULT_SETTINGS, type Settings } from '../src/storage/progress-store';

export class FakeAudio implements AudioPort {
  /** When false, plays stay pending until finish() is called. */
  auto = true;
  plays: { script: Script; instrument: string; stopped: boolean; finish: () => void }[] = [];
  loads: string[] = [];
  failing = new Set<string>();

  async unlock() {}

  async load(id: string) {
    this.loads.push(id);
    return this.failing.has(id) ? 'piano' : id;
  }

  play(script: Script, instrument: string, onLabel?: (l: string) => void): PlayHandle {
    let resolve!: () => void;
    const done = new Promise<void>((r) => (resolve = r));
    const entry = {
      script,
      instrument,
      stopped: false,
      finish: () => {
        for (const e of script) if (e.label) onLabel?.(e.label);
        resolve();
      },
    };
    this.plays.push(entry);
    if (this.auto) queueMicrotask(entry.finish);
    return {
      done,
      stop: () => {
        entry.stopped = true;
        resolve();
      },
    };
  }

  last() {
    return this.plays.at(-1)!;
  }
}

export class FakeVisibility {
  visible = true;
  private listeners = new Set<(v: boolean) => void>();
  isVisible() {
    return this.visible;
  }
  subscribe(l: (v: boolean) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  set(v: boolean) {
    this.visible = v;
    for (const l of this.listeners) l(v);
  }
}

export async function flush() {
  for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 0));
}

export function setup(opts: { progress?: Progress; settings?: Partial<Settings> } = {}) {
  const audio = new FakeAudio();
  const visibility = new FakeVisibility();
  const clock = {
    t: 0,
    now() {
      return this.t;
    },
  };
  const events: LogPayload[] = [];
  const saved: Progress[] = [];
  const views: SessionView[] = [];
  const session = new Session(
    {
      curriculum: curriculumV1,
      registry: createRegistry(),
      audio,
      log: { sessionId: 's', record: async (e) => void events.push(e) },
      clock,
      visibility,
      rng: seededRng(1),
      instruments: [
        { id: 'piano', name: 'Piano' },
        { id: 'organ', name: 'Organ' },
      ],
      settings: { ...DEFAULT_SETTINGS, ...opts.settings },
      save: async (p) => void saved.push(p),
      sleep: async () => {},
      onChange: (v) => views.push(v),
    },
    opts.progress ?? newProgress(curriculumV1),
  );
  const view = () => session.view();
  /** The item being asked in the current question. */
  const item = () =>
    (session as unknown as { current: { question: { item: string } } }).current.question.item;
  const wrong = () => view().options.find((o) => o !== item())!;
  return { session, audio, visibility, clock, events, saved, views, view, item, wrong };
}
