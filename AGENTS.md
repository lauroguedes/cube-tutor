## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project: Cube Tutor

Free, no-login web app that teaches beginners to solve the 3×3 cube with a narrated tutor and an interactive 3D cube. Full plan: `docs/PLAN.md`.

- Stack: Astro 7 (static) + Vue 3 islands for interactive parts + Three.js. English first; all UI text goes through `src/i18n/ui.ts`, never hard-coded.
- `src/engine/` is pure TypeScript (no DOM, no framework imports). It is the single source of truth for cube state, notation and goal checks.
- Every algorithm claim the tutor narrates must be proven in `src/engine/algorithms.test.ts`.
- Exercises are judged by goal predicates relative to center colors (`src/engine/predicates.ts`), never by matching a move sequence.
- Narration audio is generated at build time (`tools/narrate/`, ElevenLabs key in `.env`); no API keys in client code.
- Commands: `npm run test`, `npm run check`, `npm run dev`.
