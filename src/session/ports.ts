import type { Script } from '../core/script';
import type { LogPayload } from '../log/events';

export interface PlayHandle {
  /** Resolves when playback finishes or is stopped. */
  done: Promise<void>;
  stop(): void;
}

/** Audio as seen by the session: load instruments and play scripts. */
export interface AudioPort {
  /** Enables audio; must be called from a user gesture (Start). */
  unlock(): Promise<void>;
  /** Loads an instrument; resolves with the id actually used (piano on failure). */
  load(instrumentId: string): Promise<string>;
  play(script: Script, instrumentId: string, onLabel?: (label: string) => void): PlayHandle;
}

export interface LogPort {
  sessionId: string;
  record(payload: LogPayload): Promise<void>;
}

/** Milliseconds, monotonic. */
export interface Clock {
  now(): number;
}

export interface VisibilitySource {
  isVisible(): boolean;
  /** Calls `listener` whenever visibility changes; returns an unsubscribe function. */
  subscribe(listener: (visible: boolean) => void): () => void;
}
