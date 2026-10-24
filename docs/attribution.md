# Sample attribution

All instrument sounds are recorded samples, trimmed to 2.5 s, converted to mono and re-encoded
by `scripts/build-samples.mjs`. Both sources are licensed under
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

| Instrument      | Source                                                                                           | Original recording                             |
| --------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Piano           | Salamander Grand Piano by Alexander Holm, via [Tone.js audio](https://github.com/Tonejs/audio)   | Yamaha C5 grand                                |
| Organ, Harp     | [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) by Nicholaus P. Brosowsky | Versilian Studios Chamber Orchestra 2 (VSCO 2) |
| Harmonium       | tonejs-instruments                                                                               | Freesound pack 330410 by donyaquick            |
| Acoustic guitar | tonejs-instruments                                                                               | University of Iowa Electronic Music Studios    |
| Electric guitar | tonejs-instruments                                                                               | Karoryfer Samples                              |
| Cello           | tonejs-instruments                                                                               | Freesound pack 12408 by flcellogrl             |

Changes made: trimming, fade-out, mono down-mix and re-encoding at 96 kbps.

## Rebuilding

```sh
node scripts/build-samples.mjs
```

Downloads are cached in `.sample-cache/` (git-ignored). Output goes to `public/samples/`:
one directory per instrument with `<midi>.mp3` files and a `manifest.json`, plus
`instruments.json` listing all instruments.
