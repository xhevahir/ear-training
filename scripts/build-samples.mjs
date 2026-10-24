// Downloads the instrument samples, trims and encodes them into public/samples/<instrument>/,
// and writes a manifest per instrument. Requires ffmpeg. Usage: node scripts/build-samples.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CACHE = '.sample-cache';
const OUT = 'public/samples';
const LOW = 36; // C2
const HIGH = 84; // C6
const SECONDS = 2.5;

const SALAMANDER = 'https://tonejs.github.io/audio/salamander';
const TONEJS = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples';
const TONEJS_API = 'https://api.github.com/repos/nbrosowsky/tonejs-instruments/contents/samples';

const INSTRUMENTS = [
  { id: 'piano', name: 'Piano', source: 'salamander' },
  { id: 'organ', name: 'Organ', source: 'tonejs' },
  { id: 'harmonium', name: 'Harmonium', source: 'tonejs' },
  { id: 'guitar-acoustic', name: 'Acoustic guitar', source: 'tonejs' },
  { id: 'guitar-electric', name: 'Electric guitar', source: 'tonejs' },
  { id: 'harp', name: 'Harp', source: 'tonejs' },
  { id: 'cello', name: 'Cello', source: 'tonejs' },
];

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Cs4" / "Ds2" / "A3" -> MIDI number, or undefined. */
function midiOf(name) {
  const m = /^([A-G])(s?)(\d)$/.exec(name);
  if (!m) return undefined;
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] ? 1 : 0);
}

/** Prefer samples 3 semitones apart (C, D#, F#, A); keep everything when that is too sparse. */
function thin(notes) {
  const every3 = notes.filter((n) => n.midi % 3 === 0);
  return every3.length >= (HIGH - LOW) / 3 / 2 ? every3 : notes;
}

async function listNotes(inst) {
  if (inst.source === 'salamander') {
    const names = [];
    for (let octave = 1; octave <= 6; octave++)
      for (const p of ['C', 'Ds', 'Fs', 'A']) names.push(`${p}${octave}`);
    return names.map((n) => ({ name: n, midi: midiOf(n), url: `${SALAMANDER}/${n}.mp3` }));
  }
  const res = await fetch(`${TONEJS_API}/${inst.id}`);
  const files = await res.json();
  return files
    .map((f) => f.name)
    .filter((n) => n.endsWith('.mp3'))
    .map((n) => n.slice(0, -4))
    .filter((n) => midiOf(n) !== undefined)
    .map((n) => ({ name: n, midi: midiOf(n), url: `${TONEJS}/${inst.id}/${n}.mp3` }));
}

async function download(url, path) {
  if (existsSync(path)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

for (const inst of INSTRUMENTS) {
  const all = (await listNotes(inst)).filter((n) => n.midi >= LOW - 3 && n.midi <= HIGH + 3);
  const notes = thin(all).sort((a, b) => a.midi - b.midi);
  const cacheDir = join(CACHE, inst.id);
  const outDir = join(OUT, inst.id);
  mkdirSync(cacheDir, { recursive: true });
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const samples = [];
  for (const n of notes) {
    const raw = join(cacheDir, `${n.name}.mp3`);
    await download(n.url, raw);
    const file = `${n.midi}.mp3`;
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      raw,
      '-t',
      String(SECONDS),
      '-ac',
      '1',
      '-ar',
      '44100',
      '-af',
      `afade=t=out:st=${SECONDS - 0.4}:d=0.4`,
      '-b:a',
      '96k',
      join(outDir, file),
    ]);
    samples.push({ midi: n.midi, file });
  }
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify({ id: inst.id, name: inst.name, samples }, null, 2) + '\n',
  );
  console.log(`${inst.id}: ${samples.map((s) => s.midi).join(' ')}`);
}

writeFileSync(
  join(OUT, 'instruments.json'),
  JSON.stringify(
    INSTRUMENTS.map(({ id, name }) => ({ id, name })),
    null,
    2,
  ) + '\n',
);
