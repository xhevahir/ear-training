import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = new URL('../public/samples/', import.meta.url).pathname;
const instruments = JSON.parse(readFileSync(join(root, 'instruments.json'), 'utf8')) as {
  id: string;
}[];

describe('bundled samples', () => {
  it('lists piano first among the instruments', () => {
    expect(instruments[0]!.id).toBe('piano');
    expect(instruments.length).toBeGreaterThan(1);
  });

  it.each(instruments.map((i) => i.id))('%s manifest files all exist', (id) => {
    const manifest = JSON.parse(readFileSync(join(root, id, 'manifest.json'), 'utf8')) as {
      samples: { midi: number; file: string }[];
    };
    expect(manifest.samples.length).toBeGreaterThan(5);
    for (const s of manifest.samples) expect(existsSync(join(root, id, s.file))).toBe(true);
  });

  it('keeps the piano under 4 MB', () => {
    const dir = join(root, 'piano');
    const total = readdirSync(dir).reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
    expect(total).toBeLessThan(4 * 1024 * 1024);
  });
});
