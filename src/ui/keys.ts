import { INTERVAL_SEMITONES, isInterval } from '../core/intervals';
import { DEGREE_OFFSET, isScaleDegree } from '../core/pitch';
import type { KeyboardLayout } from '../storage/progress-store';

/**
 * Answer keys by physical position (KeyboardEvent.code), after Interval Loader: the right hand
 * covers 1-7 semitones like a piano (white J K L ;, black U I O), the left hand 8-11, and Space
 * the octave / tonic. Values are semitones modulo 12.
 */
export const ANSWER_KEYS: Record<string, number> = {
  Space: 0,
  KeyU: 1,
  KeyJ: 2,
  KeyI: 3,
  KeyK: 4,
  KeyL: 5,
  KeyO: 6,
  Semicolon: 7,
  KeyE: 8,
  KeyD: 9,
  KeyR: 10,
  KeyF: 11,
};

/** Character each layout produces at each answer key position (for on-screen hints). */
const KEY_LABELS: Record<KeyboardLayout, Record<string, string>> = {
  qwerty: {
    Space: '␣',
    KeyU: 'u',
    KeyJ: 'j',
    KeyI: 'i',
    KeyK: 'k',
    KeyL: 'l',
    KeyO: 'o',
    Semicolon: ';',
    KeyE: 'e',
    KeyD: 'd',
    KeyR: 'r',
    KeyF: 'f',
  },
  dvorak: {
    Space: '␣',
    KeyU: 'g',
    KeyJ: 'h',
    KeyI: 'c',
    KeyK: 't',
    KeyL: 'n',
    KeyO: 'r',
    Semicolon: 's',
    KeyE: '.',
    KeyD: 'e',
    KeyR: 'p',
    KeyF: 'u',
  },
};

/** Semitone class (0-11) of an answer item, or undefined for items without a key. */
export function semitoneClass(item: string): number | undefined {
  if (isInterval(item)) return INTERVAL_SEMITONES[item] % 12;
  if (isScaleDegree(item)) return DEGREE_OFFSET[item];
  return undefined;
}

/** The answer among `options` selected by a key code, if any. */
export function answerForKey(code: string, options: readonly string[]): string | undefined {
  const semitones = ANSWER_KEYS[code];
  if (semitones === undefined) return undefined;
  return options.find((o) => semitoneClass(o) === semitones);
}

/** Label of the key for an answer item in the learner's layout, for on-screen hints. */
export function keyHint(item: string, layout: KeyboardLayout = 'qwerty'): string | undefined {
  const semitones = semitoneClass(item);
  const code = Object.keys(ANSWER_KEYS).find((c) => ANSWER_KEYS[c] === semitones);
  return code ? KEY_LABELS[layout][code] : undefined;
}

export type CommandKey = 'confirm' | 'again';

/** Enter starts / continues; Backspace replays / hears again. */
export function commandForKey(code: string): CommandKey | undefined {
  if (code === 'Enter' || code === 'NumpadEnter') return 'confirm';
  if (code === 'Backspace') return 'again';
  return undefined;
}
