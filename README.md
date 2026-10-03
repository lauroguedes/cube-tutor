# Cube Tutor

A free web app that teaches complete beginners to solve the 3×3 cube, guided by a narrated tutor and an interactive 3D cube.

See [docs/PLAN.md](docs/PLAN.md) for the full development plan.

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run test` | Run unit tests (cube engine) |
| `npm run check` | Type-check the project |
| `npm run build` | Build the static site to `./dist/` |

## Narration

Narration is generated at build time with ElevenLabs. Copy `.env.example` to `.env` and fill in your key and voice ID. The key is only used by the build tool and never reaches the browser.
