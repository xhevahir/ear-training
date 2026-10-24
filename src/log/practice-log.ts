import type { Database } from '../storage/db';
import type { LogEvent, LogPayload } from './events';

export const LOG_FORMAT = 'ear-training-log';
export const LOG_FORMAT_VERSION = 1;

/** Records practice events; a failed write never interrupts practice. */
export class PracticeLog {
  constructor(
    private readonly db: Pick<Database, 'appendLog' | 'allLog'>,
    private readonly base: { appVersion: string; curriculumVersion: number },
    private readonly now: () => Date = () => new Date(),
    private readonly onError: (error: unknown) => void = (e) => console.warn('log write failed', e),
  ) {}

  sessionId = '';

  async record(payload: LogPayload): Promise<void> {
    const event = {
      ...payload,
      t: this.now().toISOString(),
      appVersion: this.base.appVersion,
      curriculumVersion: this.base.curriculumVersion,
      sessionId: this.sessionId,
    } as LogEvent;
    try {
      await this.db.appendLog(event);
    } catch (error) {
      this.onError(error);
    }
  }

  /** Newline-delimited JSON: a header line, then every event in chronological order. */
  async exportNdjson(): Promise<string> {
    const events = await this.db.allLog();
    const header = {
      type: 'header',
      format: LOG_FORMAT,
      formatVersion: LOG_FORMAT_VERSION,
      exportedAt: this.now().toISOString(),
      appVersion: this.base.appVersion,
      events: events.length,
    };
    return [header, ...events].map((e) => JSON.stringify(e)).join('\n') + '\n';
  }
}

export function newSessionId(now = new Date()): string {
  return `${now.toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
}
