import { scriptDuration, type Script } from '../core/script';
import type { LoadedInstrument, Sampler } from './sampler';

export interface PlayHandle {
  /** Resolves when the script has finished sounding (or was stopped). */
  done: Promise<void>;
  stop(): void;
}

/** Delay before the first event, so that all events are scheduled ahead of time. */
const LEAD = 0.08;

/** Schedules a whole script at once against the audio clock, with label callbacks. */
export function playScript(
  sampler: Sampler,
  instrument: LoadedInstrument,
  script: Script,
  onLabel?: (label: string) => void,
): PlayHandle {
  const ctx = sampler.context;
  const start = ctx.currentTime + LEAD;
  const sources: AudioBufferSourceNode[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];

  for (const event of script) {
    const level = 0.7 / Math.sqrt(Math.max(1, event.midi.length));
    for (const m of event.midi) {
      sources.push(sampler.playNote(instrument, m, start + event.time, event.duration, level));
    }
    if (event.label !== undefined && onLabel) {
      const label = event.label;
      timers.push(setTimeout(() => onLabel(label), (LEAD + event.time) * 1000));
    }
  }

  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  timers.push(setTimeout(resolve, (LEAD + scriptDuration(script)) * 1000));

  return {
    done,
    stop() {
      for (const t of timers) clearTimeout(t);
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
      resolve();
    },
  };
}
