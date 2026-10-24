# Tasks

## 1. Project setup

- [x] 1.1 Scaffold a Vite + TypeScript (strict) project with `src/core`, `src/audio`, `src/storage`, `src/log`, `src/session`, `src/ui`, `public/samples`; verify `npm run dev` serves a blank page and `npm run build` succeeds
- [x] 1.2 Add Vitest with a placeholder core test and an `npm test` script; verify `npm test` passes
- [x] 1.3 Add ESLint/Prettier config and a `npm run check` script running typecheck + lint + tests; verify it passes on the scaffold
- [x] 1.4 Initialise git with a `.gitignore` (node_modules, dist); verify `git status` shows only source files

## 2. Core music model

- [x] 2.1 Implement pitch utilities (MIDI numbers, note names, transposition, major-scale degrees, chromatic degree offsets) and a seeded RNG; verify with unit tests (e.g. degree b6 in D = Bb, seeded RNG reproducible)
- [x] 2.2 Implement the playback-script type (`{time, midi[], duration, label?}`) and helpers to concatenate/offset scripts and compute total duration; verify with unit tests

## 3. Curriculum model and data

- [x] 3.1 Define curriculum types (strand, stage, params, prerequisites, version, instrument threshold, scoring constants) and a validator rejecting unknown exercise types, unknown items, unknown prerequisites, empty strands, and duplicate stage IDs; verify with unit tests for each rejection
- [x] 3.2 Author the v1 curriculum data per design D5 (45 stages, stable IDs, intervals strand first); verify a unit test asserts it validates, has 30 + 15 stages, and that the first stage is TT/P8 harmonic fixed-root
- [x] 3.3 Document the curriculum data format and how to add a strand or stage in `docs/curriculum.md`; verify the doc's example stage passes the validator in a test

## 4. Progression engine

- [x] 4.1 Implement scoring (+1/-3, floor 0, target 10 + 3n, stage clear, level increment, never decreasing); verify unit tests for the curriculum-progression scoring scenarios
- [x] 4.2 Implement the stage scheduler (prerequisite unlocking, least-recently-practised strand, curriculum-order tie-break, single remaining strand, curriculum-complete review rotation); verify unit tests for each scenario including A/B alternation from a new learner
- [x] 4.3 Implement weighted item selection per design D6 (initial/new weights, wrong x2 cap 8, correct x0.7 floor 1, no third consecutive repeat) with new-item detection against the previous stage of the strand; verify statistical unit tests with a seeded RNG (weak item chosen more; no item ever at zero chance)

## 5. Exercise types

- [x] 5.1 Define the exercise-type interface (answerOptions, generate, confirmScript, correctionScript, introScript) and a registry; verify the curriculum validator uses the registry to check exercise names
- [x] 5.2 Implement the scale-degree exercise: cadence voicing in F3-E4 tonic range, fixed (C) vs moving key, single vs wide register, answer options in pitch order; verify unit tests on generated scripts (cadence chords, target pitch ranges)
- [x] 5.3 Implement scale-degree confirmation resolutions (data table, design D7) and the wrong-answer tonic walk with chromatic final step; verify unit tests for 7→8, 2→1, the walk for 3, b6, and 1
- [x] 5.4 Implement the interval exercise: fixed C4 vs moving F3-F4 roots, harmonic/ascending/descending/mixed directions, answer options in size order; verify unit tests (C4-G4 ascending P5, descending order, top note ≤ F5)
- [x] 5.5 Implement interval contrast feedback (chosen, correct, melodic low-high, correct) with labels, and empty confirmation; verify a unit test for the P4-vs-harmonic-P5-on-D scenario
- [x] 5.6 Implement introScript for both exercise types (new item played 2-3 times with its label); verify unit tests

## 6. Audio

- [x] 6.1 Source and verify licences for the Salamander Grand Piano and tonejs-instruments samples; trim/encode a 3-semitone-spaced MP3 subset into `public/samples/<instrument>/`, with a manifest per instrument; add attribution in `docs/attribution.md`; verify piano total size is under 4 MB and every manifest file exists
- [x] 6.2 Implement the sampler (AudioContext unlock on Start, sample loading, nearest-sample pitch shift, gain envelope); verify manually on a dev test page that a chromatic scale is in tune and a C major chord starts together
- [x] 6.3 Implement the script player (schedule a whole script, report end, stop) and label callbacks; verify on the dev test page that a cadence plays evenly and labels appear in sync
- [x] 6.4 Implement instrument selection (piano below threshold, random non-excluded instruments above, piano not excludable, lazy loading, fallback to piano on load failure); verify unit tests for selection logic and a manual test that a forced load failure falls back to piano

## 7. Storage and practice log

- [x] 7.1 Implement the IndexedDB wrapper with `progress`, `settings`, and `log` stores; verify tests using `fake-indexeddb` for read/write round-trips
- [x] 7.2 Implement progress save/load with schema versioning and curriculum migration by stage ID (drop unknown, keep level, reschedule missing current stage); verify unit tests including the "stage inserted" scenario
- [x] 7.3 Implement progress export/import with validation and confirmation hook; verify unit tests that a valid file round-trips and an invalid file leaves progress unchanged
- [x] 7.4 Implement the practice log (event types and fields per practice-log spec and design D10, failure-tolerant writes, NDJSON export with header); verify unit tests that an answer event contains all required fields and that a failing write does not throw
- [x] 7.5 Document the log format with an example of each event type in `docs/practice-log.md`; verify the documented examples parse against the event type definitions in a test

## 8. Session controller

- [x] 8.1 Implement the session state machine (idle → playing → awaiting-answer → feedback → next/ended) wiring core, audio, storage, and log through injectable interfaces; verify unit tests with fake audio/storage covering a correct answer, a wrong answer, and a stage clear mid-session
- [x] 8.2 Implement answer gating (disabled during playback), free replay, mandatory feedback with Continue enabled only after playback and Hear again; verify unit tests for each practice-session scenario
- [x] 8.3 Implement the active-time session timer (pauses while hidden, finishes the current question before ending, early exit) and stop/replay of the current question on return from background; verify unit tests with a fake clock and visibility source
- [x] 8.4 Implement new-item introduction at stage start and persistence after every answer; verify a unit test that progress is saved after each answer and that intro events are logged

## 9. User interface

- [x] 9.1 Build the home screen (level, progress bar, Start) and end-of-session summary (+N levels); verify manually in the browser and on a narrow (360 px) viewport
- [x] 9.2 Build the session screen (level/progress header, Replay, answer grid) and feedback overlay (correct answer, synced labels, Hear again, Continue) plus level-up announcement; verify by playing through a full stage in the dev server
- [x] 9.3 Build the settings screen (session length, instrument exclusion with piano locked, export/import progress, export log, persistent-storage status and export reminder) and an About section with sample attribution; verify each control works manually and settings persist across reload
- [x] 9.4 Apply mobile-first styling with system light/dark theme and thumb-sized buttons; verify on Chrome Android (or devtools device emulation) that no horizontal scrolling occurs
- [x] 9.5 Add desktop keyboard shortcuts (Interval Loader layout by semitone: Space=octave/tonic, u j i k l o ; = 1-7, e d r f = 8-11; Enter = Start/Continue; Backspace = Replay/Hear again) with key hints on answer buttons for fine-pointer devices; verify unit tests for the key mapping and a browser run answering by keyboard
- [x] 9.6 Add a keyboard-labels setting (QWERTY or Dvorak) that changes only the on-screen key hints, keeping the same physical keys; verify unit tests for Dvorak hints, old settings without the field loading as QWERTY, and the setting persisting across reload in the browser

## 10. PWA and offline

- [x] 10.1 Configure vite-plugin-pwa (manifest, icons, precache app shell + piano samples, runtime cache for other instruments, update applied on next launch); verify with Lighthouse that the app is installable and that a production build runs a session with the network disabled in devtools
- [x] 10.2 Request persistent storage on first Start and surface the result in settings; verify manually in Chrome that `navigator.storage.persisted()` reflects the grant
- [ ] 10.3 Add a deploy workflow to an HTTPS static host (GitHub Pages by default) and a `docs/deploy.md`; verify the hosted build installs on an Android phone via "Add to Home screen"

## 11. Integration checks

- [ ] 11.1 End-to-end manual run on Android: install, complete a 10-minute session, background the app mid-session, close and reopen to confirm level/points resume; record results in the change's notes
- [ ] 11.2 Export the practice log after a real session and verify it contains a header, session start/end, answer events, and any stage-cleared events, readable line by line as JSON
- [ ] 11.3 Export progress on one browser and import it on another; verify the level and points match

## Workflow follow-up

- Review the practice log after the first week of use and retune curriculum data/constants in a follow-up change.
- Archive the change with `/opsx:archive` once implementation is verified.
