/** MIDI note number (60 = C4). */
export type Midi = number;

const PITCH_CLASS_NAMES = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export const C4: Midi = 60;

/** Semitone offsets of the major scale degrees 1-7. */
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;

export const SCALE_DEGREES = [
  '1',
  'b2',
  '2',
  'b3',
  '3',
  '4',
  '#4',
  '5',
  'b6',
  '6',
  'b7',
  '7',
] as const;
export type ScaleDegree = (typeof SCALE_DEGREES)[number];

/** Semitones above the tonic for each scale degree. */
export const DEGREE_OFFSET: Record<ScaleDegree, number> = {
  '1': 0,
  b2: 1,
  '2': 2,
  b3: 3,
  '3': 4,
  '4': 5,
  '#4': 6,
  '5': 7,
  b6: 8,
  '6': 9,
  b7: 10,
  '7': 11,
};

export function isScaleDegree(value: string): value is ScaleDegree {
  return (SCALE_DEGREES as readonly string[]).includes(value);
}

export function noteName(midi: Midi): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASS_NAMES[pc]}${octave}`;
}

export function pitchClassName(midi: Midi): string {
  return PITCH_CLASS_NAMES[((midi % 12) + 12) % 12]!;
}

export function transpose(midi: Midi, semitones: number): Midi {
  return midi + semitones;
}

export function degreeMidi(tonic: Midi, degree: ScaleDegree): Midi {
  return tonic + DEGREE_OFFSET[degree];
}

/** Pitch of major-scale step `step` (0 = tonic, 7 = upper tonic, negative = below). */
export function majorScaleStep(tonic: Midi, step: number): Midi {
  const octave = Math.floor(step / 7);
  const index = ((step % 7) + 7) % 7;
  return tonic + 12 * octave + MAJOR_SCALE[index]!;
}
