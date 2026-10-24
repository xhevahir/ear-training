import type { Midi } from './pitch';

/** One sound (single note or chord) at a time offset, optionally with a label to show. */
export interface ScriptEvent {
  /** Seconds from the start of the script. */
  time: number;
  /** Pitches sounding together; empty for a label-only event. */
  midi: Midi[];
  /** Seconds the sound is held. */
  duration: number;
  label?: string;
}

export type Script = ScriptEvent[];

export function note(
  time: number,
  midi: Midi | Midi[],
  duration: number,
  label?: string,
): ScriptEvent {
  const event: ScriptEvent = { time, midi: Array.isArray(midi) ? midi : [midi], duration };
  if (label !== undefined) event.label = label;
  return event;
}

export function offsetScript(script: Script, seconds: number): Script {
  return script.map((e) => ({ ...e, time: e.time + seconds }));
}

/** Time at which the last sound in the script stops. */
export function scriptDuration(script: Script): number {
  return script.reduce((end, e) => Math.max(end, e.time + e.duration), 0);
}

/** Joins scripts end to end, with `gap` seconds between consecutive scripts. */
export function concatScripts(scripts: Script[], gap = 0): Script {
  const out: Script = [];
  let cursor = 0;
  for (const s of scripts) {
    if (s.length === 0) continue;
    out.push(...offsetScript(s, cursor));
    cursor += scriptDuration(s) + gap;
  }
  return out;
}

/** Plays notes one after another, each `step` seconds apart and held for `duration`. */
export function sequence(pitches: Midi[], step: number, duration = step): Script {
  return pitches.map((m, i) => note(i * step, m, duration));
}
