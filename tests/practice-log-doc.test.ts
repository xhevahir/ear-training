import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { missingFields, REQUIRED_FIELDS } from '../src/log/events';

const doc = readFileSync(new URL('../docs/practice-log.md', import.meta.url), 'utf8');
const examples = [...doc.matchAll(/<!-- event -->\s*```json\n([\s\S]*?)```/g)].map(
  (m) => JSON.parse(m[1]!) as Record<string, unknown>,
);

describe('docs/practice-log.md', () => {
  it('documents an example of every event type', () => {
    expect(new Set(examples.map((e) => e.type))).toEqual(new Set(Object.keys(REQUIRED_FIELDS)));
  });

  it.each(examples.map((e) => [e.type, e] as const))(
    '%s example has every required field',
    (_t, e) => {
      expect(missingFields(e)).toEqual([]);
    },
  );
});
