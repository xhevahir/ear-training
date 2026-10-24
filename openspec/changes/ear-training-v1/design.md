# Design

## Context

Greenfield: the repository holds only OpenSpec scaffolding. See proposal.md for motivation and specs/ for required behaviour. Constraints that shape the approach:

- Must run in desktop browsers and Chrome on Android, installable and offline (no backend).
- The curriculum must be tunable as data, and new strands (chord quality, function, rhythm) must slot in later without reworking the engine.
- Audio must be sampled (piano first, other instruments later) with chord-accurate timing.
- Practice data must be exportable for later analysis of the curriculum.

## Goals / Non-Goals

**Goals:**
- A pure, unit-testable core (curriculum, scheduling, scoring, question generation) with no dependency on audio or DOM.
- Exercise types behind one interface so adding a strand means one new exercise module plus curriculum data.
- Small download: app code well under 200 KB; piano samples a few MB; other instruments fetched lazily.

**Non-Goals:**
- No UI framework, router, or state library; the app has five screens.
- No server, analytics endpoint, or account system.
- No visual polish beyond a clean, legible, touch-friendly layout in v1.

## Decisions

### D1. TypeScript + Vite, vanilla DOM, vite-plugin-pwa, Vitest
Vite gives fast builds and first-class PWA support through `vite-plugin-pwa` (Workbox-generated service worker, manifest). Vitest shares Vite's config for core unit tests.
- *Alternatives:* React/Preact (unneeded for five screens; adds weight and concepts), plain JS without a build (no types, manual service worker).

### D2. Layered architecture with a pure core

```
  +------------------------------- UI (DOM) -------------------------------+
  |  home  |  session  |  feedback overlay  |  summary  |  settings          |
  +-----------------------------------+-------------------------------------+
                                      |
  +------------------ session controller (state machine) -------------------+
  |  idle -> playing -> awaiting-answer -> feedback -> (next | ended)        |
  |  timer (active time only), calls core + audio + storage + log            |
  +-------+-------------------+-------------------+--------------------+-----+
          |                   |                   |                    |
  +-------v-------+   +-------v-------+   +-------v--------+   +-------v------+
  |  core (pure)  |   |  audio        |   |  storage       |   |  log         |
  |  curriculum   |   |  sampler      |   |  IndexedDB     |   |  IndexedDB   |
  |  scheduler    |   |  instruments  |   |  progress,     |   |  events,     |
  |  scoring      |   |  script player|   |  settings,     |   |  NDJSON      |
  |  item picker  |   |               |   |  export/import |   |  export      |
  |  exercises    |   |               |   |                |   |              |
  +---------------+   +---------------+   +----------------+   +--------------+
```

The core produces **playback scripts**: arrays of `{time, midi[], duration, label?}` events relative to start. The audio layer only plays scripts; it knows nothing of music theory. This keeps all musical logic testable with plain assertions (e.g. "the wrong-answer walk for b6 in D is D E F# G A Bb").

All randomness flows through an injectable seeded RNG so tests are deterministic.

### D3. Exercise-type interface
Each exercise type implements:

```
  answerOptions(stage)                    -> ordered item labels
  generate(stage, item, rng)              -> Question { item, key/root, direction,
                                                        register, questionScript }
  confirmScript(question)                 -> script (may be empty)
  correctionScript(question, answer)      -> script
  introScript(stage, item, rng)           -> script (used for new-item introduction)
```

The session controller is generic over this interface. v1 ships `scale-degree` and `interval`. A future `chord-quality` type reuses the same shape.

### D4. Curriculum data format
A versioned TypeScript module (typed data, validated at startup and in a unit test):

```
  curriculum = {
    version: 1,
    instrumentThresholdLevel: 21,
    strands: [
      { id: "intervals", exercise: "interval", prerequisites: [],
        stages: [ { id: "int-h-fixed-02", items: ["TT","P8"],
                    params: { root: "fixed", direction: "harmonic", register: "one-octave" } },
                  ... ] },
      { id: "degrees", exercise: "scale-degree", prerequisites: [], stages: [...] }
    ]
  }
```

Stage IDs are stable strings and never reused; progress keys on them (see progress-storage spec). Strand order in the file is the interleaving tie-break, so `intervals` comes first.

### D5. v1 curriculum content

Interval item order (confusable pairs separated): `TT P8 | P5 | M3 | m2 | P4 | m3 | M7 | M6 | M2 | m6 | m7`

| Phase | Dimension | Stages | Items per stage |
|---|---|---|---|
| B1 | harmonic, root fixed (C4) | 11 | 2, 3, 4 ... 12 |
| B2 | harmonic, root moves | 6 | 2, 4, 6, 8, 10, 12 |
| B3 | melodic ascending, root moves | 6 | 2, 4, 6, 8, 10, 12 |
| B4 | melodic descending, root moves | 6 | 2, 4, 6, 8, 10, 12 |
| B5 | mixed directions, root moves | 1 | 12 |

Scale-degree item order: `1 5 | 3 | 7 | 4 | 2 | 6 || b7 | b3 | #4 | b6 | b2`

| Phase | Dimension | Stages | Items per stage |
|---|---|---|---|
| A1 | diatonic, key fixed (C) | 6 | 2, 3, 4, 5, 6, 7 |
| A2 | diatonic, key moves | 3 | 3, 5, 7 |
| A3 | chromatic, key moves | 5 | 8, 9, 10, 11, 12 |
| A4 | wide register (2 octaves) | 1 | 12 |

45 stages total. A2 restarts at 3 (not 2) because 1-5 alone in a moving key is trivial once A1 is done; A3 adds one chromatic degree at a time because each is a new sound. With strand A shorter, B runs alone for roughly its last 15 stages; acceptable for v1 (a minor-key phase or chord-quality strand fills this later).

Pacing estimate: ~7 s per question, ~0.6 net points/question at 90% accuracy, targets 16-46 → roughly one stage per 10-minute session, ~6-8 weeks of daily use.

### D6. Scoring and item selection
- Points and targets per curriculum-progression spec (+1 / -3 / floor 0 / target 10 + 3n). Constants live beside the curriculum data so they can be tuned in one place.
- Item weights per stage, stored in progress: initial 1.0; new items start at 3.0; wrong answer doubles weight (cap 8); correct answer multiplies by 0.7 (floor 1.0). Selection is weighted random. To avoid streaks of identical questions, the same item is not chosen three times in a row.
- *Alternative considered:* Leitner boxes / spaced repetition across sessions. Rejected for v1: stage-local weighting is enough because stages are short and each stage includes all earlier items of the strand.

### D7. Musical generation details
- **Cadence:** I-IV-V-I in close four-part voicing, transposed so the tonic note lies in F3-E4 (keeps the cadence in a warm middle register). Chord duration ~0.6 s, then a 0.4 s gap, then the target.
- **Scale-degree target:** single-octave = tonic + 0..11 semitones; wide = tonic - 12 .. tonic + 11, chosen at random.
- **Resolution table** (data, tune by ear): 1: 1; 2: 2-1; 3: 3-2-1; 4: 4-3-2-1; 5: 5-6-7-8; 6: 6-7-8; 7: 7-8; b2: b2-1; b3: b3-2-1; #4: #4-5-6-7-8; b6: b6-5-6-7-8; b7: b7-6-7-8. Resolutions play at ~0.3 s per note.
- **Wrong-answer walk:** ascending major scale from the tonic below the target to the diatonic degree at/below the target, chromatic final step if needed; target held ~1.2 s.
- **Interval roots:** fixed = C4; moving = random in F3-F4 so the top note never exceeds F5.
- **Interval contrast feedback:** as interval-exercise spec, ~0.8 s per element with 0.4 s gaps, labels shown in sync with the script's `label` events.

### D8. Audio: small custom Web Audio sampler
One `AudioContext` created/resumed on the Start tap. Each instrument is a set of samples every 3 semitones across its range; a note plays the nearest sample with `playbackRate = 2^(semitones/12)` through a gain envelope (short attack, ~0.3 s release). Whole scripts are scheduled at once against `audioContext.currentTime` (scripts are only seconds long), giving sample-accurate chord alignment. The player reports script end via a timer keyed to the scheduled end, which the session controller uses to enable answer/continue controls.
- *Samples:* piano from the Salamander Grand Piano (CC-BY 3.0); additional instruments from the `tonejs-instruments` sample set (CC-BY 3.0), e.g. acoustic guitar, organ, harp, flute, cello, clarinet. Encoded as MP3, trimmed to ~2 s, subset of the range used. Attribution shown in an About section.
- *Alternatives:* Tone.js (heavy for this need; its Sampler would work but brings a large API), `smplr`/soundfont-player (load from third-party CDNs by default; self-hosting removes most of the benefit), oscillator synthesis (unrealistic; reserved for a possible future timbre).

### D9. Storage: IndexedDB for progress, settings and log
A tiny wrapper (or the ~1 KB `idb` library) over IndexedDB with three stores: `progress` (single record), `settings` (single record), `log` (auto-increment events). localStorage was considered but is synchronous and size-limited (~5 MB), too small for a multi-year log. Progress is written after every answer in the same transaction as the answer's log event where possible; log write failures are caught and ignored (practice-log spec).
- **Progress record:** `{ schemaVersion, curriculumVersion, level, clearedStageIds[], currentStageId, points, itemWeights{}, strandLastPracticed{} }`.
- **Curriculum migration:** on load, if `curriculumVersion` differs, drop unknown stage IDs, keep `level`, and if `currentStageId` is gone, run the scheduler to pick the next stage.
- **Export/import:** JSON `{ format: "ear-training-progress", schemaVersion, exportedAt, progress, settings }`, validated on import before replacing.

### D10. Practice log format
NDJSON. First line: `{"type":"header","format":"ear-training-log","formatVersion":1,"exportedAt":...}`. Then one event per line with `type` in `session_start | session_end | stage_start | item_intro | answer | stage_cleared`, plus fields from the practice-log spec, `appVersion` and `curriculumVersion` on each event. Rough size ~250 bytes per answer → ~25 KB per session → under 10 MB per year of daily use. This format is chosen so that a future analysis (by script or by Claude) can compute per-item accuracy, confusion pairs, response times, and questions-per-stage directly.

### D11. Session timer and lifecycle
Active time accumulates only while `document.visibilityState === "visible"`. When hidden mid-script, audio is stopped and the current question is replayed from the start on return (the answer is not yet given, so no points change). Service-worker updates use the "prompt on next launch" strategy so a running session is never reloaded.

### D12. UI layout
Single column, mobile-first. Session screen: level + progress bar at top, a Replay control, answer buttons in a grid (pitch/size order), large enough for thumbs. Feedback overlay shows the correct answer, the script's labels as they play, "Hear again" and "Continue" (disabled until playback ends). Dark and light themes follow the system setting.

## Risks / Trade-offs

- [Pitch-shifted samples sound unnatural over wide shifts] → samples every 3 semitones keep shifts within ±1.5 semitones.
- [Android audio output latency (~50-150 ms)] → affects only the start of playback, not relative timing; no answer timing depends on it except response-time logging, which is measured from controls-enabled and is used comparatively.
- [Browser evicts storage] → request persistent storage; export reminders when denied (offline-app spec).
- [Curriculum ordering is a guess] → it is data; the practice log is designed to show where learners stall (questions per stage, confusion pairs) so it can be retuned.
- [Interleaving strands of unequal length leaves one strand running alone] → accepted for v1; additional strands will rebalance.
- [Sample licensing] → use only CC-BY or more permissive sets and include attribution; verify licences before bundling.
- [PWA install requires HTTPS] → serve from an HTTPS static host; `localhost` works for development, but installing on the phone needs the hosted build.

## Migration Plan

New app; no migration. Deploy as a static site to any HTTPS static host (e.g. GitHub Pages). Rollback = redeploy the previous build; saved data is unaffected because storage schemas are versioned and migrations are forward-only and non-destructive.

## Open Questions

- Final instrument list for random timbres (depends on which sample sets sound good after trimming); does not affect specs or structure.
- Hosting location (GitHub Pages vs. another static host); only affects the deploy task's details.
- Exact resolution-table entries for chromatic degrees; data, to be tuned by ear.
