# Curriculum data

The curriculum is plain data in `src/data/curriculum-v1.ts`. The engine reads it; no musical
sequencing lives in code. It is validated on startup and by `tests/curriculum-v1.test.ts`.

## Structure

- **Curriculum**: `version`, `instrumentThresholdLevel` (level from which random instruments
  are used), `scoring` constants, and an ordered list of `strands`.
- **Strand**: `id`, `title`, `exercise` (a registered exercise type: `interval` or
  `scale-degree` in v1), `prerequisites` (stage IDs from other strands that must be cleared
  before this strand unlocks), and an ordered list of `stages`.
- **Stage**: a stable `id`, the `items` practised, and `params`:
  - `root`: `fixed` (C) or `moving` (random key/root per question)
  - `register`: `one-octave` or `wide` (scale degrees only: two octaves)
  - `direction`: `harmonic`, `ascending`, `descending` or `mixed` (intervals only)

Strand order matters: when two strands are equally due, the earlier one goes first.

Valid items are the interval names `m2 M2 m3 M3 P4 TT P5 m6 M6 m7 M7 P8` and the scale degrees
`1 b2 2 b3 3 4 #4 5 b6 6 b7 7`.

## Rules for editing

1. **Never rename or reuse a stage ID.** Saved progress refers to stage IDs. When a stage is
   removed, learners who had cleared it keep their level; if it was their current stage they
   move to the next uncleared one.
2. **Bump `version`** whenever stages are added, removed or changed, so that practice-log
   entries can be attributed to the curriculum they came from.
3. Within a phase, add one item per stage. When a new difficulty dimension starts, restart
   with a small item set and grow by two items per stage.
4. Run `npm test` — the validator rejects unknown exercise types, unknown items, unknown
   prerequisites, empty strands, duplicate IDs and stages with fewer than two items.

## Adding a stage

Insert a stage object in the strand at the point it should be practised:

<!-- example-stage -->

```json
{
  "id": "int-harm-fixed-wide-04",
  "items": ["TT", "P8", "P5", "M3"],
  "params": { "root": "fixed", "register": "one-octave", "direction": "harmonic" }
}
```

## Adding a strand

1. Implement an exercise type (see `src/exercises/`) and register it.
2. Add a strand object with its own stage ladder. If it builds on another strand, list the
   stage IDs it requires in `prerequisites`, e.g. a chord-quality strand might require
   `int-harm-fixed-06`. The scheduler starts interleaving it once those are cleared.
