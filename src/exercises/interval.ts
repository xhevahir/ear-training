import type { Stage } from '../core/curriculum';
import { INTERVALS, INTERVAL_SEMITONES, isInterval, type IntervalName } from '../core/intervals';
import { C4, type Midi } from '../core/pitch';
import { pick, randomInt, type Rng } from '../core/rng';
import { concatScripts, note, type Script } from '../core/script';
import type { ExerciseType, PlayedDirection, Question } from './types';

/** Moving roots fall in F3..F4, so the top of an octave never exceeds F5. */
const ROOT_LOW = 53;
const ROOT_HIGH = 65;
const HARMONIC_LENGTH = 1.4;
const MELODIC_STEP = 0.9;
const MELODIC_LENGTH = 0.85;
const FEEDBACK_GAP = 0.4;

function interval(item: string): IntervalName {
  if (!isInterval(item)) throw new Error(`not an interval: ${item}`);
  return item;
}

/** Plays an interval from `root`: up for harmonic/ascending, down for descending. */
export function intervalScript(
  root: Midi,
  name: IntervalName,
  direction: PlayedDirection,
  label?: string,
): Script {
  const size = INTERVAL_SEMITONES[name];
  if (direction === 'harmonic') return [note(0, [root, root + size], HARMONIC_LENGTH, label)];
  const second = direction === 'ascending' ? root + size : root - size;
  return [note(0, root, MELODIC_LENGTH, label), note(MELODIC_STEP, second, MELODIC_LENGTH)];
}

function chooseDirection(stage: Stage, rng: Rng): PlayedDirection {
  const d = stage.params.direction ?? 'harmonic';
  return d === 'mixed' ? pick(rng, ['harmonic', 'ascending', 'descending'] as const) : d;
}

function chooseRoot(stage: Stage, rng: Rng): Midi {
  return stage.params.root === 'fixed' ? C4 : randomInt(rng, ROOT_LOW, ROOT_HIGH);
}

export const intervalExercise: ExerciseType = {
  name: 'interval',
  items: INTERVALS,

  answerOptions(stage) {
    return [...stage.items].sort(
      (a, b) => INTERVAL_SEMITONES[interval(a)] - INTERVAL_SEMITONES[interval(b)],
    );
  },

  generate(stage, item, rng) {
    const direction = chooseDirection(stage, rng);
    const root = chooseRoot(stage, rng);
    return {
      exercise: 'interval',
      item,
      root,
      direction,
      register: stage.params.register,
      script: intervalScript(root, interval(item), direction),
    };
  },

  confirmScript() {
    return [];
  },

  correctionScript(question: Question, answer: string) {
    const direction = question.direction ?? 'harmonic';
    const correct = interval(question.item);
    const size = INTERVAL_SEMITONES[correct];
    const low = direction === 'descending' ? question.root - size : question.root;
    return concatScripts(
      [
        intervalScript(question.root, interval(answer), direction, `You said ${answer}`),
        intervalScript(question.root, correct, direction, `It was ${correct}`),
        intervalScript(low, correct, 'ascending', correct),
        intervalScript(question.root, correct, direction, correct),
      ],
      FEEDBACK_GAP,
    );
  },

  introScript(stage, item, rng) {
    const root = chooseRoot(stage, rng);
    const d = stage.params.direction ?? 'harmonic';
    const directions: PlayedDirection[] =
      d === 'mixed' ? ['harmonic', 'ascending', 'descending'] : [d, d, d];
    return concatScripts(
      directions.map((dir) => intervalScript(root, interval(item), dir, item)),
      FEEDBACK_GAP,
    );
  },
};
