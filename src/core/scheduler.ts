import type { Curriculum, Strand } from './curriculum';

export interface ScheduleInput {
  cleared: ReadonlySet<string>;
  /** Higher = practised more recently. Strands never practised are absent. */
  strandLastPracticed: Readonly<Record<string, number>>;
}

export interface ScheduledStage {
  strandId: string;
  stageId: string;
  /** True when the whole curriculum is complete and this is review practice. */
  review: boolean;
}

export function isStrandUnlocked(strand: Strand, cleared: ReadonlySet<string>): boolean {
  return strand.prerequisites.every((id) => cleared.has(id));
}

export function isCurriculumComplete(c: Curriculum, cleared: ReadonlySet<string>): boolean {
  return c.strands.every((s) => s.stages.every((st) => cleared.has(st.id)));
}

/** Strands ordered least recently practised first; curriculum order breaks ties. */
function byRecency(
  strands: Strand[],
  last: Readonly<Record<string, number>>,
  c: Curriculum,
): Strand[] {
  const order = new Map(c.strands.map((s, i) => [s.id, i]));
  return [...strands].sort((a, b) => {
    const diff = (last[a.id] ?? -Infinity) - (last[b.id] ?? -Infinity);
    if (diff !== 0 && !Number.isNaN(diff)) return diff;
    return order.get(a.id)! - order.get(b.id)!;
  });
}

/**
 * Picks the next stage: the next uncleared stage of the unlocked, unfinished strand that was
 * practised least recently. Once everything is cleared, rotates through each strand's final
 * stage as review.
 */
export function nextStage(c: Curriculum, input: ScheduleInput): ScheduledStage {
  const { cleared, strandLastPracticed } = input;
  const candidates = c.strands.filter(
    (s) => isStrandUnlocked(s, cleared) && s.stages.some((st) => !cleared.has(st.id)),
  );
  const strand = byRecency(candidates, strandLastPracticed, c)[0];
  if (strand) {
    const stage = strand.stages.find((st) => !cleared.has(st.id))!;
    return { strandId: strand.id, stageId: stage.id, review: false };
  }
  const reviewStrand = byRecency(c.strands, strandLastPracticed, c)[0];
  if (!reviewStrand) throw new Error('curriculum has no strands');
  return { strandId: reviewStrand.id, stageId: reviewStrand.stages.at(-1)!.id, review: true };
}
