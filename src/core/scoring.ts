import type { ScoringConstants, Stage } from './curriculum';

export function stageTarget(stage: Stage, scoring: ScoringConstants): number {
  return scoring.targetBase + scoring.targetPerItem * stage.items.length;
}

/** Points after an answer: gain for correct, penalty for wrong, never below zero. */
export function scoreAnswer(points: number, correct: boolean, scoring: ScoringConstants): number {
  return Math.max(0, points + (correct ? scoring.correct : scoring.wrong));
}

export interface ScoreResult {
  points: number;
  level: number;
  cleared: boolean;
}

/**
 * Applies one answer to the current stage. On reaching the target the stage is cleared:
 * the level goes up by one and points reset to zero. Levels never go down.
 */
export function applyScore(
  state: { points: number; level: number },
  stage: Stage,
  correct: boolean,
  scoring: ScoringConstants,
): ScoreResult {
  const points = scoreAnswer(state.points, correct, scoring);
  if (points >= stageTarget(stage, scoring)) {
    return { points: 0, level: state.level + 1, cleared: true };
  }
  return { points, level: state.level, cleared: false };
}
