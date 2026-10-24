// Dev-only page for listening checks and an offline tuning/timing check.
import { playScript } from '../src/audio/player';
import { Sampler } from '../src/audio/sampler';
import { note, sequence, type Script } from '../src/core/script';
import { intervalExercise } from '../src/exercises/interval';
import { cadenceScript } from '../src/exercises/scale-degree';

const BASE = `${import.meta.env.BASE_URL}samples/`;

const scripts: Record<string, () => Script> = {
  scale: () =>
    sequence(
      Array.from({ length: 13 }, (_, i) => 60 + i),
      0.4,
      0.38,
    ),
  chord: () => [note(0, [60, 64, 67], 1.5)],
  cadence: () => cadenceScript(60),
  labels: () =>
    intervalExercise.correctionScript(
      {
        exercise: 'interval',
        item: 'P5',
        root: 62,
        direction: 'harmonic',
        register: 'one-octave',
        script: [],
      },
      'P4',
    ),
};

let live: { ctx: AudioContext; sampler: Sampler } | undefined;
const select = document.querySelector<HTMLSelectElement>('#instrument')!;
const labelEl = document.querySelector<HTMLParagraphElement>('#label')!;

const instruments = (await (await fetch(`${BASE}instruments.json`)).json()) as {
  id: string;
  name: string;
}[];
for (const i of instruments) select.add(new Option(i.name, i.id));

document.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((button) =>
  button.addEventListener('click', async () => {
    if (!live) {
      const ctx = new AudioContext();
      live = { ctx, sampler: new Sampler(ctx, BASE) };
    }
    await live.ctx.resume();
    const instrument = await live.sampler.load(select.value);
    const handle = playScript(live.sampler, instrument, scripts[button.dataset.play!]!(), (l) => {
      labelEl.textContent = l;
    });
    await handle.done;
    labelEl.textContent = '(done)';
  }),
);

/** Fundamental frequency by normalised autocorrelation with parabolic interpolation. */
function detectPitch(data: Float32Array, rate: number): number {
  const minLag = Math.floor(rate / 1200);
  const maxLag = Math.floor(rate / 50);
  const n = data.length - maxLag;
  const corr = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let sum = 0;
    let e1 = 0;
    let e2 = 0;
    for (let i = 0; i < n; i++) {
      sum += data[i]! * data[i + lag]!;
      e1 += data[i]! * data[i]!;
      e2 += data[i + lag]! * data[i + lag]!;
    }
    corr[lag] = sum / Math.sqrt(e1 * e2 || 1);
  }
  const peak = Math.max(...corr.slice(minLag, maxLag + 1));
  let lag = minLag;
  // first lag whose correlation is close to the global peak (avoids octave errors)
  for (let l = minLag + 1; l < maxLag; l++) {
    if (corr[l]! > 0.9 * peak && corr[l]! >= corr[l - 1]! && corr[l]! >= corr[l + 1]!) {
      lag = l;
      break;
    }
  }
  const a = corr[lag - 1]!;
  const b = corr[lag]!;
  const c = corr[lag + 1]!;
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return rate / (lag + shift);
}

async function render(instrumentId: string, script: Script, seconds: number) {
  const ctx = new OfflineAudioContext(1, Math.ceil(44100 * seconds), 44100);
  const sampler = new Sampler(ctx, BASE);
  const instrument = await sampler.load(instrumentId);
  playScript(sampler, instrument, script);
  return ctx.startRendering();
}

/** Renders single notes (including retuned ones) and a cadence; reports cents error and onset spacing. */
async function audioCheck(instrumentId = 'piano', midis = [57, 60, 61, 62, 64, 66, 67, 70]) {
  const tuning: { midi: number; cents: number }[] = [];
  for (const midi of midis) {
    const buf = await render(instrumentId, [note(0, midi, 0.8)], 0.8);
    const data = buf.getChannelData(0).slice(Math.floor(0.2 * 44100), Math.floor(0.5 * 44100));
    const f = detectPitch(data, 44100);
    const expected = 440 * 2 ** ((midi - 69) / 12);
    tuning.push({ midi, cents: Math.round(1200 * Math.log2(f / expected)) });
  }
  const cadence = cadenceScript(60);
  const buf = await render(instrumentId, cadence, 3.5);
  const data = buf.getChannelData(0);
  const win = 441;
  const rms: number[] = [];
  for (let i = 0; i + win < data.length; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += data[j]! * data[j]!;
    rms.push(Math.sqrt(s / win));
  }
  const onsets: number[] = [];
  for (let i = 1; i < rms.length; i++) {
    if (
      rms[i]! > 0.02 &&
      rms[i]! > 1.8 * rms[i - 1]! &&
      (onsets.length === 0 || i * 0.01 - onsets.at(-1)! > 0.3)
    ) {
      onsets.push(Math.round(i * 10) / 1000);
    }
  }
  const spacing = onsets.slice(1).map((t, i) => Math.round((t - onsets[i]!) * 1000));
  return { instrumentId, tuning, onsets, spacingMs: spacing };
}

(window as unknown as { audioCheck: typeof audioCheck }).audioCheck = audioCheck;
document.querySelector('#report')!.textContent =
  'Run audioCheck() in the console for an offline check.';
