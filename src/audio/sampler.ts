import type { Midi } from '../core/pitch';

export interface SampleRef {
  midi: Midi;
  file: string;
}

export interface InstrumentManifest {
  id: string;
  name: string;
  samples: SampleRef[];
}

export interface LoadedInstrument {
  id: string;
  name: string;
  buffers: { midi: Midi; buffer: AudioBuffer }[];
}

const ATTACK = 0.005;
const RELEASE = 0.3;

/** Nearest sample to `midi`, and the playback rate that retunes it (equal temperament). */
export function nearestSample<T extends { midi: Midi }>(
  samples: readonly T[],
  midi: Midi,
): { sample: T; rate: number } {
  if (samples.length === 0) throw new Error('instrument has no samples');
  let best = samples[0]!;
  for (const s of samples) if (Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
  return { sample: best, rate: 2 ** ((midi - best.midi) / 12) };
}

/** Plays notes from decoded instrument samples on a Web Audio context. */
export class Sampler {
  private readonly loading = new Map<string, Promise<LoadedInstrument>>();
  readonly output: GainNode;

  constructor(
    readonly context: BaseAudioContext,
    private readonly baseUrl: string,
  ) {
    const compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);
    this.output = context.createGain();
    this.output.gain.value = 0.8;
    this.output.connect(compressor);
  }

  /** Loads (once) and decodes an instrument's samples. Rejects if any sample fails. */
  load(id: string): Promise<LoadedInstrument> {
    let promise = this.loading.get(id);
    if (!promise) {
      promise = this.fetchInstrument(id);
      promise.catch(() => this.loading.delete(id));
      this.loading.set(id, promise);
    }
    return promise;
  }

  private async fetchInstrument(id: string): Promise<LoadedInstrument> {
    const res = await fetch(`${this.baseUrl}${id}/manifest.json`);
    if (!res.ok) throw new Error(`manifest for ${id}: ${res.status}`);
    const manifest = (await res.json()) as InstrumentManifest;
    const buffers = await Promise.all(
      manifest.samples.map(async (s) => {
        const r = await fetch(`${this.baseUrl}${id}/${s.file}`);
        if (!r.ok) throw new Error(`sample ${id}/${s.file}: ${r.status}`);
        return { midi: s.midi, buffer: await this.context.decodeAudioData(await r.arrayBuffer()) };
      }),
    );
    return { id, name: manifest.name, buffers };
  }

  /** Schedules one note; returns the source so it can be stopped early. */
  playNote(
    instrument: LoadedInstrument,
    midi: Midi,
    when: number,
    duration: number,
    level = 0.7,
  ): AudioBufferSourceNode {
    const { sample, rate } = nearestSample(instrument.buffers, midi);
    const source = this.context.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = rate;
    const gain = this.context.createGain();
    const end = when + duration;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level, when + ATTACK);
    gain.gain.setValueAtTime(level, end);
    gain.gain.linearRampToValueAtTime(0, end + RELEASE);
    source.connect(gain).connect(this.output);
    source.start(when);
    source.stop(end + RELEASE + 0.05);
    return source;
  }
}
