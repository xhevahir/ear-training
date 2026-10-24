import type { Curriculum, Stage } from './curriculum';
import { findStage } from './curriculum';
import { weightedIndex, type Rng } from './rng';

export const WEIGHT_INITIAL = 1;
export const WEIGHT_NEW_ITEM = 3;
export const WEIGHT_MAX = 8;
export const WEIGHT_MIN = 1;
const WRONG_FACTOR = 2;
const CORRECT_FACTOR = 0.7;

/** Items in this stage that were not in the previous stage of the same strand. */
export function newItems(c: Curriculum, stageId: string): string[] {
  const found = findStage(c, stageId);
  if (!found) return [];
  const previous = found.index > 0 ? found.strand.stages[found.index - 1]! : undefined;
  return found.stage.items.filter((item) => !previous?.items.includes(item));
}

export function initialWeights(stage: Stage, fresh: readonly string[]): Record<string, number> {
  return Object.fromEntries(
    stage.items.map((item) => [item, fresh.includes(item) ? WEIGHT_NEW_ITEM : WEIGHT_INITIAL]),
  );
}

export function updateWeight(weight: number, correct: boolean): number {
  return correct
    ? Math.max(WEIGHT_MIN, weight * CORRECT_FACTOR)
    : Math.min(WEIGHT_MAX, weight * WRONG_FACTOR);
}

/**
 * Weighted random choice of the next item. The same item is never chosen three times in a row
 * (when the stage has another item to offer).
 */
export function chooseItem(
  rng: Rng,
  items: readonly string[],
  weights: Readonly<Record<string, number>>,
  recent: readonly string[],
): string {
  const [a, b] = recent.slice(-2);
  const banned = a !== undefined && a === b ? a : undefined;
  const pool = items.filter((item) => item !== banned);
  const candidates = pool.length > 0 ? pool : items;
  return candidates[
    weightedIndex(
      rng,
      candidates.map((i) => weights[i] ?? WEIGHT_INITIAL),
    )
  ]!;
}
