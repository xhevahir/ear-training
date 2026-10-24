import { pick, type Rng } from '../core/rng';

export const DEFAULT_INSTRUMENT = 'piano';

export interface InstrumentInfo {
  id: string;
  name: string;
}

/** Instruments the learner may exclude (piano is always available). */
export function excludable(all: readonly InstrumentInfo[]): InstrumentInfo[] {
  return all.filter((i) => i.id !== DEFAULT_INSTRUMENT);
}

/**
 * Instrument for the next question: piano below the threshold level, otherwise a random
 * instrument that the learner has not excluded. Piano can never be excluded.
 */
export function chooseInstrument(
  level: number,
  threshold: number,
  all: readonly InstrumentInfo[],
  excluded: readonly string[],
  rng: Rng,
): string {
  if (level < threshold) return DEFAULT_INSTRUMENT;
  const allowed = all
    .map((i) => i.id)
    .filter((id) => id === DEFAULT_INSTRUMENT || !excluded.includes(id));
  return allowed.length > 0 ? pick(rng, allowed) : DEFAULT_INSTRUMENT;
}

/** Loads the requested instrument, falling back to piano if it cannot be loaded. */
export async function loadWithFallback<T>(
  id: string,
  load: (id: string) => Promise<T>,
  onFallback?: (id: string, error: unknown) => void,
): Promise<{ id: string; instrument: T }> {
  try {
    return { id, instrument: await load(id) };
  } catch (error) {
    if (id === DEFAULT_INSTRUMENT) throw error;
    onFallback?.(id, error);
    return { id: DEFAULT_INSTRUMENT, instrument: await load(DEFAULT_INSTRUMENT) };
  }
}
