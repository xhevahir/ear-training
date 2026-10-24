import { findStage, type Curriculum } from './curriculum';
import { initialWeights, newItems, updateWeight, WEIGHT_INITIAL } from './item-selection';
import { nextStage } from './scheduler';
import { applyScore } from './scoring';

export const PROGRESS_SCHEMA_VERSION = 1;

/** Everything needed to resume exactly where the learner left off. */
export interface Progress {
  schemaVersion: number;
  curriculumVersion: number;
  level: number;
  clearedStageIds: string[];
  currentStageId: string;
  points: number;
  /** Selection weights for the current stage's items. */
  itemWeights: Record<string, number>;
  /** Last items asked in the current stage (most recent last). */
  recentItems: string[];
  /** Strand id -> answerCount at its most recent answer. */
  strandLastPracticed: Record<string, number>;
  answerCount: number;
  /** Answers given in the current stage, across sessions. */
  stageQuestions: number;
  /** Stage whose new items have been introduced (so the intro is not repeated on resume). */
  introducedStageId: string | null;
}

function enterStage(p: Progress, c: Curriculum, stageId: string): Progress {
  const { stage } = findStage(c, stageId)!;
  return {
    ...p,
    currentStageId: stageId,
    points: 0,
    itemWeights: initialWeights(stage, newItems(c, stageId)),
    recentItems: [],
    stageQuestions: 0,
    introducedStageId: null,
  };
}

function scheduleNext(p: Progress, c: Curriculum): Progress {
  const next = nextStage(c, {
    cleared: new Set(p.clearedStageIds),
    strandLastPracticed: p.strandLastPracticed,
  });
  return enterStage(p, c, next.stageId);
}

export function newProgress(c: Curriculum): Progress {
  const blank: Progress = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    curriculumVersion: c.version,
    level: 1,
    clearedStageIds: [],
    currentStageId: '',
    points: 0,
    itemWeights: {},
    recentItems: [],
    strandLastPracticed: {},
    answerCount: 0,
    stageQuestions: 0,
    introducedStageId: null,
  };
  return scheduleNext(blank, c);
}

export interface AnswerOutcome {
  progress: Progress;
  cleared: boolean;
  /** Points before the answer and after it (0 after a clear). */
  pointsBefore: number;
  pointsAfter: number;
  /** Answers the stage took, including this one. */
  stageQuestions: number;
}

/** Applies one answer: points, item weights, recency; clears the stage and schedules the next. */
export function recordAnswer(
  p: Progress,
  c: Curriculum,
  item: string,
  correct: boolean,
): AnswerOutcome {
  const found = findStage(c, p.currentStageId);
  if (!found) throw new Error(`current stage ${p.currentStageId} not in curriculum`);
  const { strand, stage } = found;
  const score = applyScore(p, stage, correct, c.scoring);
  const answerCount = p.answerCount + 1;
  let next: Progress = {
    ...p,
    points: score.points,
    level: score.level,
    answerCount,
    stageQuestions: p.stageQuestions + 1,
    strandLastPracticed: { ...p.strandLastPracticed, [strand.id]: answerCount },
    itemWeights: {
      ...p.itemWeights,
      [item]: updateWeight(p.itemWeights[item] ?? WEIGHT_INITIAL, correct),
    },
    recentItems: [...p.recentItems, item].slice(-2),
  };
  if (score.cleared) {
    const cleared = next.clearedStageIds.includes(stage.id)
      ? next.clearedStageIds
      : [...next.clearedStageIds, stage.id];
    next = scheduleNext({ ...next, clearedStageIds: cleared }, c);
  }
  return {
    progress: next,
    cleared: score.cleared,
    pointsBefore: p.points,
    pointsAfter: score.points,
    stageQuestions: p.stageQuestions + 1,
  };
}

/**
 * Maps saved progress onto a (possibly different) curriculum by stage id. Unknown stages are
 * dropped; the level is kept; a vanished current stage is replaced by the next uncleared one.
 */
export function migrateProgress(p: Progress, c: Curriculum): Progress {
  const known = (id: string) => findStage(c, id) !== undefined;
  let next: Progress = {
    ...p,
    curriculumVersion: c.version,
    clearedStageIds: p.clearedStageIds.filter(known),
  };
  const current = findStage(c, p.currentStageId);
  if (!current) return scheduleNext(next, c);
  // keep weights for items still in the stage; add any new ones at the initial weight
  next = {
    ...next,
    itemWeights: Object.fromEntries(
      current.stage.items.map((i) => [i, p.itemWeights[i] ?? WEIGHT_INITIAL]),
    ),
  };
  return next;
}

export function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === PROGRESS_SCHEMA_VERSION &&
    typeof v.curriculumVersion === 'number' &&
    typeof v.level === 'number' &&
    v.level >= 1 &&
    Array.isArray(v.clearedStageIds) &&
    v.clearedStageIds.every((s) => typeof s === 'string') &&
    typeof v.currentStageId === 'string' &&
    typeof v.points === 'number' &&
    v.points >= 0 &&
    typeof v.itemWeights === 'object' &&
    v.itemWeights !== null &&
    Array.isArray(v.recentItems) &&
    typeof v.strandLastPracticed === 'object' &&
    v.strandLastPracticed !== null &&
    typeof v.answerCount === 'number' &&
    typeof v.stageQuestions === 'number' &&
    (v.introducedStageId === null || typeof v.introducedStageId === 'string')
  );
}
