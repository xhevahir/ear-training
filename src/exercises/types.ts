import type { Register, Stage } from '../core/curriculum';
import type { Midi } from '../core/pitch';
import type { Rng } from '../core/rng';
import type { Script } from '../core/script';

export type PlayedDirection = 'harmonic' | 'ascending' | 'descending';

/** A generated question, with everything needed to play it, give feedback and log it. */
export interface Question {
  exercise: string;
  item: string;
  /** Tonic (scale degrees) or first/lower tone (intervals). */
  root: Midi;
  register: Register;
  direction?: PlayedDirection;
  /** Played before answers are accepted. */
  script: Script;
}

export interface ExerciseType {
  name: string;
  /** Every item this exercise can ask about. */
  items: readonly string[];
  /** Answer choices for a stage, in display order. */
  answerOptions(stage: Stage): string[];
  generate(stage: Stage, item: string, rng: Rng): Question;
  /** Played after a correct answer (may be empty). */
  confirmScript(question: Question): Script;
  /** Played after a wrong answer; must end with the correct answer audible. */
  correctionScript(question: Question, answer: string): Script;
  /** Plays a newly introduced item a few times with its label. */
  introScript(stage: Stage, item: string, rng: Rng): Script;
}
