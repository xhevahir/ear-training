# Practice log

The app records every practice event on the device (IndexedDB) and never sends it anywhere.
**Settings → Export practice log** saves it as newline-delimited JSON (`.ndjson`): one JSON
object per line, a header first, then every event in chronological order.

The log exists so that the curriculum and its tuning constants can be adjusted from real
practice data: per-item accuracy, which items are confused with which, response times, and how
many questions each stage takes.

## Common fields

Every event has:

| Field | Meaning |
|---|---|
| `type` | Event type (see below) |
| `t` | ISO 8601 timestamp |
| `appVersion` | App version that recorded it |
| `curriculumVersion` | Curriculum version in use (see `docs/curriculum.md`) |
| `sessionId` | Groups events from one session |

## Header

```json
{"type":"header","format":"ear-training-log","formatVersion":1,"exportedAt":"2026-10-24T08:30:00.000Z","appVersion":"0.1.0","events":5}
```

## Event types

Each example below is one line of an exported log.

### `session_start`

<!-- event -->
```json
{"type":"session_start","t":"2026-10-24T08:00:00.000Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","level":14,"stageId":"int-harm-moving-08","sessionMinutes":10}
```

### `stage_start`

Emitted when a session resumes a stage and when a new stage begins. `review` is true once the
whole curriculum is complete.

<!-- event -->
```json
{"type":"stage_start","t":"2026-10-24T08:00:00.100Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","strandId":"intervals","stageId":"int-harm-moving-08","level":14,"points":12,"review":false}
```

### `item_intro`

New items in a stage were played with their names before questions began.

<!-- event -->
```json
{"type":"item_intro","t":"2026-10-24T08:04:10.000Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","stageId":"deg-diat-fixed-05","items":["4"]}
```

### `answer`

`responseMs` runs from the answer buttons becoming enabled to the answer. `root` is the tonic
for scale degrees or the first tone for intervals. `direction` is `null` for scale degrees.
`pointsAfter` is 0 when the answer cleared the stage.

<!-- event -->
```json
{"type":"answer","t":"2026-10-24T08:00:07.400Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","strandId":"intervals","stageId":"int-harm-moving-08","level":14,"exercise":"interval","item":"P5","answer":"P4","correct":false,"responseMs":1840,"replays":1,"rootMidi":62,"root":"D4","direction":"harmonic","register":"one-octave","instrument":"piano","pointsBefore":12,"pointsAfter":9}
```

### `stage_cleared`

`level` is the level reached; `questions` is how many answers the stage took in total
(across sessions).

<!-- event -->
```json
{"type":"stage_cleared","t":"2026-10-24T08:06:30.000Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","strandId":"intervals","stageId":"int-harm-moving-08","level":15,"questions":52}
```

### `session_end`

`reason` is `time` (the session length elapsed) or `early` (the learner stopped).
`durationSec` counts only time the app was visible.

<!-- event -->
```json
{"type":"session_end","t":"2026-10-24T08:10:05.000Z","appVersion":"0.1.0","curriculumVersion":1,"sessionId":"2026-10-24T08:00:00.000Z-k3j9qa","reason":"time","durationSec":600,"questions":84,"levelsGained":1}
```

## Quick analysis

Per-item accuracy for one stage with `jq`:

```sh
jq -s '[.[] | select(.type=="answer" and .stageId=="int-harm-moving-08")]
       | group_by(.item) | map({item: .[0].item, n: length,
         accuracy: (map(select(.correct)) | length) / length})' practice-log.ndjson
```
