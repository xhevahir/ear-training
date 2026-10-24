import type { Script } from '../core/script';
import type { AudioPort, PlayHandle } from '../session/ports';
import { DEFAULT_INSTRUMENT, loadWithFallback } from './instruments';
import { playScript } from './player';
import { Sampler, type LoadedInstrument } from './sampler';

/** AudioPort backed by Web Audio. The context is created on the first unlock (a user gesture). */
export class WebAudioPort implements AudioPort {
  private sampler: Sampler | null = null;
  private readonly loaded = new Map<string, LoadedInstrument>();

  constructor(private readonly baseUrl: string) {}

  async unlock(): Promise<void> {
    if (!this.sampler) this.sampler = new Sampler(new AudioContext(), this.baseUrl);
    const ctx = this.sampler.context as AudioContext;
    if (ctx.state !== 'running') await ctx.resume();
  }

  async load(instrumentId: string): Promise<string> {
    const sampler = this.requireSampler();
    const { id, instrument } = await loadWithFallback(
      instrumentId,
      (i) => sampler.load(i),
      (i, e) => console.warn(`instrument ${i} unavailable, using ${DEFAULT_INSTRUMENT}`, e),
    );
    this.loaded.set(id, instrument);
    return id;
  }

  play(script: Script, instrumentId: string, onLabel?: (label: string) => void): PlayHandle {
    const instrument = this.loaded.get(instrumentId) ?? this.loaded.get(DEFAULT_INSTRUMENT);
    if (!instrument) throw new Error(`instrument ${instrumentId} not loaded`);
    return playScript(this.requireSampler(), instrument, script, onLabel);
  }

  private requireSampler(): Sampler {
    if (!this.sampler) throw new Error('audio not unlocked');
    return this.sampler;
  }
}
