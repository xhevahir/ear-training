# Proposal

## Why

Comprehensive ear-training tools (GNU Solfege, EarMaster) present hundreds of exercises and leave the learner to decide what to practise, which stalls progress. Interval Loader and Functional Ear Trainer worked because they remove that choice: open the app, pick up where you left off, and level up through a single graded path. Interval Loader's flaw — games that restart from the beginning and grow into endurance tests — shows that progress must persist at a finer grain and sessions must be time-boxed. This change builds a first version of an app with those properties, structured so that more content (chord quality, harmonic function, rhythm) can be added later without redesign.

## What Changes

- New installable browser app (Progressive Web App) that works offline on desktop and Android.
- A single curriculum path the learner never chooses from: content is organised into **strands** (each a ladder of **stages**), linked by prerequisites and automatically interleaved. The learner sees only "Level N" and a progress bar.
- Points-based stage progression: +1 for a correct answer, -3 for a wrong one, a stage target that grows with the number of items; points floor at zero, levels are never lost, partial progress is saved.
- Hidden adaptive item selection: items answered wrongly are asked more often; newly introduced items are previewed and favoured.
- Two v1 strands:
  - **Scale degrees in a key** (cadence, then a tone; name its degree), from 1 & 5 in a fixed key through all 12 chromatic degrees in moving keys and a wider register.
  - **Intervals**, from tritone vs octave on a fixed root through all 12 intervals harmonic, melodic ascending, and melodic descending on moving roots.
- Mandatory feedback on wrong answers: the learner always hears the correct answer before continuing (stepwise walk from tonic for scale degrees; contrast of chosen vs correct interval for intervals). Correct scale-degree answers resolve briefly to the tonic.
- Time-boxed sessions (default 10 minutes) that resume exactly where the learner left off.
- Sampled piano at first; random instruments from a later level onward, with a setting to exclude instruments.
- Local progress storage with export/import of progress between devices.
- A detailed local practice log (every answer, session, and level-up, tagged with the curriculum version) exportable as a file, so that the curriculum and tuning numbers can be analysed and adjusted from real practice data.
- Settings are limited to how the app sounds and how long sessions last — never what is practised.

Out of scope for v1: chord-quality, harmonic-function and rhythm strands (the engine must accommodate them), singing/microphone input, notation/dictation, intonation exercises, rhythm tapping, cloud sync, user accounts.

## Capabilities

### New Capabilities
- `curriculum-progression`: Curriculum model (strands, stages, dimensions, prerequisites), interleaving, points and stage clearing, level display, adaptive item weighting, new-item introduction.
- `practice-session`: Session lifecycle — start, time box, question/answer loop, mandatory feedback, end-of-session summary and resume.
- `scale-degree-exercise`: Establishing a key, presenting a tone, answering by scale degree, and resolution/walk feedback.
- `interval-exercise`: Presenting harmonic and melodic intervals, answering by interval name, and contrast feedback.
- `audio-playback`: Sampled instrument playback, instrument progression and exclusion, sample loading and caching.
- `progress-storage`: Persisting learner progress and settings locally, and export/import of progress.
- `offline-app`: Installability, offline operation, and persistent-storage protection on mobile.
- `practice-log`: Recording practice events locally and exporting them in a machine-readable form for analysis.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- Greenfield project: new web application source, build tooling, curriculum data files, and bundled/cached audio samples.
- New dependencies: a TypeScript build toolchain with PWA support and a unit-test runner; openly licensed instrument sample sets (licences must permit redistribution).
- No backend or external services.
