import type { Stage } from '../core/curriculum';
import {
  C4,
  DEGREE_OFFSET,
  MAJOR_SCALE,
  SCALE_DEGREES,
  isScaleDegree,
  type Midi,
  type ScaleDegree,
} from '../core/pitch';
import { randomInt, type Rng } from '../core/rng';
import { concatScripts, note, type Script } from '../core/script';
import { RESOLUTIONS } from '../data/resolutions';
import type { ExerciseType, Question } from './types';

/** Tonics are placed in F3..E4 so the cadence sits in a warm middle register. */
const TONIC_LOW = 53;
const CHORD_STEP = 0.65;
const CHORD_LENGTH = 0.6;
const GAP_BEFORE_TARGET = 0.4;
const TARGET_LENGTH = 1.2;
const RESOLUTION_STEP = 0.3;
const WALK_STEP = 0.35;

/** Close-position I-IV-V-I, as semitones from the tonic (bass first). */
const CADENCE = [
  [-12, 4, 7, 12],
  [-7, 5, 9, 12],
  [-5, 2, 7, 11],
  [-12, 4, 7, 12],
];

function degree(item: string): ScaleDegree {
  if (!isScaleDegree(item)) throw new Error(`not a scale degree: ${item}`);
  return item;
}

export function chooseTonic(stage: Stage, rng: Rng): Midi {
  if (stage.params.root === 'fixed') return C4;
  return TONIC_LOW + randomInt(rng, 0, 11);
}

export function cadenceScript(tonic: Midi): Script {
  return CADENCE.map((chord, i) =>
    note(
      i * CHORD_STEP,
      chord.map((s) => tonic + s),
      CHORD_LENGTH,
    ),
  );
}

/** Tonic of the octave the target was placed in. */
function baseTonic(question: Question): Midi {
  const target = question.script.at(-1)!.midi[0]!;
  return target - DEGREE_OFFSET[degree(question.item)];
}

/** Scale-degree label for a semitone offset from the tonic (12 = upper tonic). */
function labelFor(offset: number): string {
  return SCALE_DEGREES.find((d) => DEGREE_OFFSET[d] === offset % 12) ?? '';
}

export const scaleDegreeExercise: ExerciseType = {
  name: 'scale-degree',
  items: SCALE_DEGREES,

  answerOptions(stage) {
    return [...stage.items].sort((a, b) => DEGREE_OFFSET[degree(a)] - DEGREE_OFFSET[degree(b)]);
  },

  generate(stage, item, rng) {
    const tonic = chooseTonic(stage, rng);
    const octaveShift = stage.params.register === 'wide' ? randomInt(rng, -1, 0) * 12 : 0;
    const target = tonic + octaveShift + DEGREE_OFFSET[degree(item)];
    const script = concatScripts(
      [cadenceScript(tonic), [note(0, target, TARGET_LENGTH)]],
      GAP_BEFORE_TARGET,
    );
    return { exercise: 'scale-degree', item, root: tonic, register: stage.params.register, script };
  },

  confirmScript(question) {
    const base = baseTonic(question);
    const steps = RESOLUTIONS[degree(question.item)];
    return steps.map((s, i) =>
      note(i * RESOLUTION_STEP, base + s, i === steps.length - 1 ? 0.6 : RESOLUTION_STEP),
    );
  },

  correctionScript(question) {
    const base = baseTonic(question);
    const offset = DEGREE_OFFSET[degree(question.item)];
    const steps: number[] = MAJOR_SCALE.filter((s) => s <= offset);
    if (steps.at(-1) !== offset) steps.push(offset);
    return steps.map((s, i) => {
      const last = i === steps.length - 1;
      return note(i * WALK_STEP, base + s, last ? TARGET_LENGTH : WALK_STEP, labelFor(s));
    });
  },

  introScript(stage, item, rng) {
    const tonic = chooseTonic(stage, rng);
    const target = tonic + DEGREE_OFFSET[degree(item)];
    const repeats = [0, 1, 2].map((i) => note(i * 1.0, target, 0.9, item));
    return concatScripts([cadenceScript(tonic), repeats], GAP_BEFORE_TARGET);
  },
};
