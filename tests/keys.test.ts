import { describe, expect, it } from 'vitest';
import { INTERVALS } from '../src/core/intervals';
import { SCALE_DEGREES } from '../src/core/pitch';
import { answerForKey, commandForKey, keyHint } from '../src/ui/keys';

describe('keyboard shortcuts', () => {
  it('maps the Interval Loader layout onto intervals', () => {
    const expected: Record<string, string> = {
      Space: 'P8',
      KeyU: 'm2',
      KeyJ: 'M2',
      KeyI: 'm3',
      KeyK: 'M3',
      KeyL: 'P4',
      KeyO: 'TT',
      Semicolon: 'P5',
      KeyE: 'm6',
      KeyD: 'M6',
      KeyR: 'm7',
      KeyF: 'M7',
    };
    for (const [code, item] of Object.entries(expected))
      expect(answerForKey(code, INTERVALS)).toBe(item);
  });

  it('maps the same keys onto scale degrees by distance from the tonic', () => {
    expect(answerForKey('Space', SCALE_DEGREES)).toBe('1');
    expect(answerForKey('KeyE', SCALE_DEGREES)).toBe('b6');
    expect(answerForKey('Semicolon', SCALE_DEGREES)).toBe('5');
    expect(answerForKey('KeyF', SCALE_DEGREES)).toBe('7');
  });

  it('ignores keys for items not offered and unrelated keys', () => {
    expect(answerForKey('KeyL', ['TT', 'P8'])).toBeUndefined();
    expect(answerForKey('KeyA', INTERVALS)).toBeUndefined();
  });

  it('provides hints and command keys', () => {
    expect(keyHint('P8')).toBe('␣');
    expect(keyHint('P5')).toBe(';');
    expect(keyHint('b7')).toBe('r');
    expect(commandForKey('Enter')).toBe('confirm');
    expect(commandForKey('Backspace')).toBe('again');
    expect(commandForKey('KeyJ')).toBeUndefined();
  });
});

describe('Dvorak labels', () => {
  it('labels the same physical keys with Dvorak characters', () => {
    const dvorak = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'].map(
      (i) => keyHint(i, 'dvorak'),
    );
    expect(dvorak).toEqual(['g', 'h', 'c', 't', 'n', 'r', 's', '.', 'e', 'p', 'u', '␣']);
    expect(keyHint('b6', 'dvorak')).toBe('.');
    // the physical key answering m2 is the same whatever the labels say
    expect(answerForKey('KeyU', INTERVALS)).toBe('m2');
  });
});
