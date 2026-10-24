export const INTERVALS = [
  'm2',
  'M2',
  'm3',
  'M3',
  'P4',
  'TT',
  'P5',
  'm6',
  'M6',
  'm7',
  'M7',
  'P8',
] as const;
export type IntervalName = (typeof INTERVALS)[number];

export const INTERVAL_SEMITONES: Record<IntervalName, number> = {
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  TT: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  P8: 12,
};

export function isInterval(value: string): value is IntervalName {
  return (INTERVALS as readonly string[]).includes(value);
}
