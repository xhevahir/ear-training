/** Fields present on every log event. */
export interface BaseEvent {
  /** ISO 8601 timestamp. */
  t: string;
  appVersion: string;
  curriculumVersion: number;
  sessionId: string;
}

export interface SessionStartEvent extends BaseEvent {
  type: 'session_start';
  level: number;
  stageId: string;
  sessionMinutes: number;
}

export interface SessionEndEvent extends BaseEvent {
  type: 'session_end';
  reason: 'time' | 'early';
  /** Active (visible) seconds. */
  durationSec: number;
  questions: number;
  levelsGained: number;
}

export interface StageStartEvent extends BaseEvent {
  type: 'stage_start';
  strandId: string;
  stageId: string;
  level: number;
  points: number;
  review: boolean;
}

export interface ItemIntroEvent extends BaseEvent {
  type: 'item_intro';
  stageId: string;
  items: string[];
}

export interface AnswerEvent extends BaseEvent {
  type: 'answer';
  strandId: string;
  stageId: string;
  level: number;
  exercise: string;
  item: string;
  answer: string;
  correct: boolean;
  /** From answer controls becoming enabled to the answer. */
  responseMs: number;
  replays: number;
  /** Tonic (scale degrees) or first tone (intervals), as MIDI and note name. */
  rootMidi: number;
  root: string;
  direction: string | null;
  register: string;
  instrument: string;
  pointsBefore: number;
  pointsAfter: number;
}

export interface StageClearedEvent extends BaseEvent {
  type: 'stage_cleared';
  strandId: string;
  stageId: string;
  /** Level reached by clearing this stage. */
  level: number;
  questions: number;
}

export type LogEvent =
  | SessionStartEvent
  | SessionEndEvent
  | StageStartEvent
  | ItemIntroEvent
  | AnswerEvent
  | StageClearedEvent;

export type LogEventType = LogEvent['type'];

/** Event payload without the base fields, which the logger fills in. */
export type LogPayload = LogEvent extends infer E
  ? E extends LogEvent
    ? Omit<E, keyof BaseEvent>
    : never
  : never;

/** Required fields per event type (base fields included), used to check exported logs. */
export const REQUIRED_FIELDS: Record<LogEventType, string[]> = {
  session_start: ['level', 'stageId', 'sessionMinutes'],
  session_end: ['reason', 'durationSec', 'questions', 'levelsGained'],
  stage_start: ['strandId', 'stageId', 'level', 'points', 'review'],
  item_intro: ['stageId', 'items'],
  answer: [
    'strandId',
    'stageId',
    'level',
    'exercise',
    'item',
    'answer',
    'correct',
    'responseMs',
    'replays',
    'rootMidi',
    'root',
    'direction',
    'register',
    'instrument',
    'pointsBefore',
    'pointsAfter',
  ],
  stage_cleared: ['strandId', 'stageId', 'level', 'questions'],
};

export const BASE_FIELDS = ['type', 't', 'appVersion', 'curriculumVersion', 'sessionId'];

/** Names of required fields missing from an event (empty if complete). */
export function missingFields(event: Record<string, unknown>): string[] {
  const type = event.type as LogEventType;
  const required = [...BASE_FIELDS, ...(REQUIRED_FIELDS[type] ?? [])];
  return required.filter((f) => !(f in event));
}
