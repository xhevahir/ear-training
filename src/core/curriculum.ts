export type RootPolicy = 'fixed' | 'moving';
export type Direction = 'harmonic' | 'ascending' | 'descending' | 'mixed';
export type Register = 'one-octave' | 'wide';

/** Difficulty dimensions of a stage. `direction` applies to interval stages only. */
export interface StageParams {
  root: RootPolicy;
  register: Register;
  direction?: Direction;
}

export interface Stage {
  /** Stable identifier; never reused, since saved progress refers to it. */
  id: string;
  items: string[];
  params: StageParams;
}

export interface Strand {
  id: string;
  title: string;
  /** Name of a registered exercise type. */
  exercise: string;
  /** Stage IDs (in other strands) that must all be cleared before this strand unlocks. */
  prerequisites: string[];
  stages: Stage[];
}

export interface ScoringConstants {
  correct: number;
  wrong: number;
  targetBase: number;
  targetPerItem: number;
}

export interface Curriculum {
  version: number;
  /** From this level on, questions use random instruments instead of piano only. */
  instrumentThresholdLevel: number;
  scoring: ScoringConstants;
  /** Order matters: it breaks ties when interleaving. */
  strands: Strand[];
}

/** Valid answer items for each known exercise type. */
export type ExerciseItemCatalog = Record<string, readonly string[]>;

export function validateCurriculum(c: Curriculum, catalog: ExerciseItemCatalog): string[] {
  const errors: string[] = [];
  const stageOwner = new Map<string, string>();
  const strandIds = new Set<string>();

  for (const strand of c.strands) {
    if (strandIds.has(strand.id)) errors.push(`duplicate strand id "${strand.id}"`);
    strandIds.add(strand.id);
    if (strand.stages.length === 0) errors.push(`strand "${strand.id}" has no stages`);
    const items = catalog[strand.exercise];
    if (!items)
      errors.push(`strand "${strand.id}" uses unknown exercise type "${strand.exercise}"`);
    for (const stage of strand.stages) {
      if (stageOwner.has(stage.id)) errors.push(`duplicate stage id "${stage.id}"`);
      stageOwner.set(stage.id, strand.id);
      if (stage.items.length < 2) errors.push(`stage "${stage.id}" needs at least 2 items`);
      if (new Set(stage.items).size !== stage.items.length)
        errors.push(`stage "${stage.id}" repeats an item`);
      if (items) {
        for (const item of stage.items) {
          if (!items.includes(item)) errors.push(`stage "${stage.id}" has unknown item "${item}"`);
        }
      }
    }
  }

  for (const strand of c.strands) {
    for (const prereq of strand.prerequisites) {
      const owner = stageOwner.get(prereq);
      if (owner === undefined)
        errors.push(`strand "${strand.id}" has unknown prerequisite "${prereq}"`);
      else if (owner === strand.id)
        errors.push(`strand "${strand.id}" cannot require its own stage "${prereq}"`);
    }
  }

  if (c.instrumentThresholdLevel < 1) errors.push('instrumentThresholdLevel must be at least 1');
  return errors;
}

export function assertValidCurriculum(c: Curriculum, catalog: ExerciseItemCatalog): void {
  const errors = validateCurriculum(c, catalog);
  if (errors.length > 0) throw new Error(`Invalid curriculum:\n${errors.join('\n')}`);
}

export function findStage(
  c: Curriculum,
  stageId: string,
): { strand: Strand; stage: Stage; index: number } | undefined {
  for (const strand of c.strands) {
    const index = strand.stages.findIndex((s) => s.id === stageId);
    if (index >= 0) return { strand, stage: strand.stages[index]!, index };
  }
  return undefined;
}
