import type { Clock, VisibilitySource } from './ports';

/** Accumulates time only while the app is visible. */
export class ActiveTimer {
  private accumulated = 0;
  private runningSince: number | null;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly clock: Clock,
    visibility: VisibilitySource,
  ) {
    this.runningSince = visibility.isVisible() ? clock.now() : null;
    this.unsubscribe = visibility.subscribe((visible) => (visible ? this.resume() : this.pause()));
  }

  private pause(): void {
    if (this.runningSince === null) return;
    this.accumulated += this.clock.now() - this.runningSince;
    this.runningSince = null;
  }

  private resume(): void {
    if (this.runningSince === null) this.runningSince = this.clock.now();
  }

  elapsedMs(): number {
    const running = this.runningSince === null ? 0 : this.clock.now() - this.runningSince;
    return this.accumulated + running;
  }

  dispose(): void {
    this.pause();
    this.unsubscribe();
  }
}
