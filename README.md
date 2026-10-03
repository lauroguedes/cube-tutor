# Cube Tutor

A free web app that teaches complete beginners to solve the 3×3 cube. A narrated tutor (female or male voice) explains each step while an interactive 3D cube performs every move in sync. Tasks check that you can actually do it before the next lesson opens. No account; progress is saved in your browser.

See [docs/PLAN.md](docs/PLAN.md) for the development plan and [docs/SOURCES.md](docs/SOURCES.md) for the history facts.

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server |
| `npm run test` | Run unit tests (cube engine, course integrity, narration timing) |
| `npm run check` | Type-check the project |
| `npm run build` | Build the static site to `./dist/` |
| `npm run narrate` | Generate narration audio for new or changed lines |

## How it fits together

- `src/engine/`: the cube's logic (state, notation, goal checks). Pure TypeScript, fully tested.
- `src/render/`: the Three.js cube. Its picture is always derived from the engine state.
- `src/tutor/`: narration scripts with cue markers, the audio-synced player, progress.
- `src/course/`: the 17 lessons. Structure in `lessons.ts`, words in `text/<locale>.ts`.
- `src/components/`: Vue islands (lesson player, home, lesson map, free play).
- `tools/narrate/`: builds the narration with ElevenLabs.

## Narration

Narration is generated ahead of time, not in the browser. Copy `.env.example` to `.env` and fill in the API key and the two voice IDs, then run `npm run narrate`. Each line is cached by its text, voice and model, so only new or changed lines cost characters. Use `npm run narrate -- --dry-run` to see what would be generated.

Cue markers such as `{{move R}}` sit inside the narration text. Moving a marker doesn't need new audio, because timing is computed from per-character timestamps.

## Adding a language

1. Add the locale to `astro.config.mjs` and to `src/i18n/ui.ts`.
2. Copy `src/course/text/en.ts` to the new locale and translate it, keeping the `{{…}}` markers.
3. Add the localized pages under `src/pages/<locale>/`, mirroring `src/pages/` (they pick the locale up from the URL).
4. Run `npm run narrate -- --locale <code>` (set voices that speak the language).
5. `npm test` fails if any step is missing text.
