# Cube Tutor — Development Plan

A free, no-login web app that teaches a complete beginner to solve the 3×3 cube. A narrated tutor walks them through history, anatomy, notation and the beginner method. A realistic 3D cube performs every move the tutor describes. Exercises gate progress.

Sources: your Obsidian idea note (`IDEAS/Interactive 3D Rubik's Cube Learning Coach`) plus your brief. Working title "Cube Tutor" is a placeholder (see §13 on trademark).

---

## Status (2026-10-03)

v1 is built: the engine, the 3D cube, 17 narrated lessons in English with a female and a male tutor voice (ElevenLabs `eleven_v4`), gated tasks with hints and "Show me", the lesson map, free play and saved progress. Differences from the original plan:

- Lesson content lives in typed TypeScript modules (`src/course/`) instead of Astro content collections. That gives compile-time checks and lets `course.test.ts` prove every task is solvable.
- The cross is taught with the daisy method, which ends directly in the solving grip.
- Hints are text-only. Narration covers explanations, task instructions and success lines (about 27,000 characters for both voices).

Still open: user testing (M4.5), CI, hosting, PWA/offline, colour-blind sticker mode, pt-BR.

---

## 1. Product definition

**One-line pitch:** a patient human-sounding teacher, sitting next to a beautiful 3D cube, that never lets you memorize a move you don't understand.

**Audience:** someone holding a scrambled cube who has never solved one. No account, no install, works on a phone.

**Principles**
1. The cube is the interface. Everything else is secondary and quiet.
2. The tutor *shows while it speaks*. Every spoken move is performed on the cube in sync.
3. Understand first, then memorize. Each algorithm is introduced by what it *does to pieces*, not just as letters.
4. You must prove it. Exercises are validated by cube state, not by "did you type the same moves as me".
5. Zero friction. Static site, progress kept in the browser, no sign-up.

**Differentiation (from your note's honest assessment):** Cube Coach already has 3D lessons, drills and progress, so "3D + voice + minimal" is not enough. What we lean into:
- Conceptual "why" narration for every algorithm (what stays fixed, what moves, why it's safe).
- A real teacher voice and pacing, synced to animation.
- Assessment by *goal state* ("is the cross solved?") so learners can solve any way they find, rather than copy a sequence.
- A fully guided path from zero (history, anatomy, notation) to a finished solve.

**Out of scope for v1:** accounts, leaderboards, timer/speedcubing, smart-cube Bluetooth, cube scanning via camera, live AI Q&A (see §12), CFOP.

---

## 2. Experience design

### 2.1 Main screen (desktop)
```
┌──────────────────────────────────────────────────────────┐
│ ◂ Lesson 3 · Notation                      ▪▪▪▫▫▫▫  (menu)│  ← hairline progress + lesson title
│                                                          │
│                                                          │
│                        [ 3D CUBE ]                       │  ← 80%+ of the screen
│                                                          │
│                                                          │
│   "Turn the right face a quarter turn clockwise…"        │  ← live caption (word-highlighted)
│   ⏮  ⏯  ↻ replay   1× speed   ·  ↶ undo  ⟲ reset   [Next]│  ← transport + cube actions
└──────────────────────────────────────────────────────────┘
```
- **Mobile (portrait):** cube on top, caption + controls in a bottom sheet. Cube gets pinch-free orbit (one finger on background) and drag-to-turn (one finger on a face).
- **Theme:** dark neutral, soft studio lighting, one type family, generous space. Light mode follows the OS.
- **Menu (secondary):** lesson map, sound/voice settings, speed, captions, colour-blind mode, reset progress.

### 2.2 Lesson step types
| Type | What happens |
|---|---|
| **Narrated demo** | Tutor speaks; cube performs scripted moves, highlights, camera moves, on cues. User can pause, replay, change speed, and scrub back. |
| **Free play** | Cube is manipulable; tutor prompts ("try turning the top"). |
| **Guided try** | User must perform a given move/alg; tutor gives live feedback on each turn. |
| **Exercise (gate)** | Controlled start state + goal predicate. Next is locked until passed. Tiered hints. |
| **Recap** | Short checkpoint to close a lesson (one or two quick tasks). |

### 2.3 Interactions on the cube
- Drag on a face → turn that layer (direction inferred from the drag).
- Drag on background → orbit camera. Auto-recentre button.
- Tap a piece (in anatomy lessons) → highlight and name it (center / edge / corner).
- Keyboard: `R L U D F B` (Shift = prime), `Space` play/pause, `←/→` step, `Z` undo.
- Undo/redo stack, reset-to-lesson-start, replay current instruction.

### 2.4 Exercise gating and hints
- Locked "Next" until the goal predicate is true.
- Hint ladder, each step costs nothing but is recorded: **(1)** reworded nudge → **(2)** highlight relevant pieces → **(3)** tutor *shows* the move; the learner must then repeat it themselves to pass.
- Wrong turns never punish. A calm "that disturbed your cross — undo?" with a one-tap undo.
- "Stuck?" always available. Never a dead end.
- Progress stored in `localStorage` (+ export/import code string so a user can move devices without an account).

---

## 3. Curriculum

Every lesson = 3–8 steps, 2–6 minutes. Total narration target ≈ 60 minutes. **All facts in Part 1 need a sourced fact-check pass before recording** (§11).

### Part 1 — The cube
1. **Where it came from.** Ernő Rubik, Budapest, 1974, built as a teaching tool for 3D structure; he took about a month to solve his own; the toy that followed. *Cue: cube assembles/explodes.*
2. **Why it's built this way.** The mechanism problem: how do pieces turn independently and stay together? Core, internal axes, edge/corner geometry. *Cue: cutaway/exploded view.*
3. **How it was first solved, and why algorithms exist.** Rubik's own struggle, then the idea of reusable move sequences; the huge number of states and "God's number" in one gentle sentence.
4. **Meet the pieces.** 6 centers (fixed, they define the color), 12 edges (2 colors), 8 corners (3 colors); opposite colors; 26 visible pieces. *Exercise: tap to find all corners / an edge with white and blue.*

### Part 2 — Moving the cube
5. **Turning a layer.** Faces, layers, clockwise looking at the face. *Free play + exercise: turn the right face.*
6. **Notation.** R L U D F B, `'` and `2`; whole-cube rotations (x y z) introduced lightly. *Exercise: perform a given sequence; read a sequence and predict.*
7. **Thinking in pieces.** Follow one piece through a move; "what stays, what moves". *Exercise: bring a specified edge to a specified slot.*
8. **Your first algorithm.** `R U R' U'`: perform it 1×, then 6× to see it return to start; "why repeating gets back". Sets up that algs are tools that disturb little.

### Part 3 — Solving (beginner layer-by-layer)
Each stage: *goal → what to look for → intuition → algorithm (shown, explained, drilled) → exercise on controlled states → recap.*

| Stage | Goal | Notes (algs to be verified by unit tests, §5.5) |
|---|---|---|
| 9. White cross | Four white edges on top face, matched to side centers | Intuitive; teach 3 insertion cases by reasoning, not by memory |
| 10. White corners | Complete first layer | `R U R' U'` repeat; "corner in its slot" idea |
| 11. Middle layer | Four middle edges | Two mirrored algs; teach the *pattern* "left vs right" |
| 12. Yellow cross | Orient last-layer edges | `F R U R' U' F'`; dot / L / line cases |
| 13. Position yellow corners | Corners in correct place (ignore orientation) | Standard corner-cycle alg |
| 14. Orient yellow corners | Twist corners without moving others | `R' D' R D` repeat; the "don't panic, it looks scrambled" lesson |
| 15. Finish the edges | Cycle the last three edges | Edge-cycle alg |
| 16. Full solve | Solve a scramble start to finish with hints available | Capstone |

**Which method?** Your note lists beginner layer-by-layer and CFOP as candidates. Recommendation: **ship beginner LBL only for v1**; its stages map cleanly to goal predicates and the teaching order is well established. CFOP becomes a clearly separate "Level 2" later only if v1 testing says people want it. (Open decision §14.)

### Part 4 — What's next (short)
17. Practice tips, why finger tricks and speed exist, pointers to community/further learning. Optional free scramble practice mode.

---

## 4. Architecture overview

```
┌────────────── content (data) ──────────────┐
│ lessons/*.ts|json  →  scripts w/ cue markers│
└───────────────┬────────────────────────────┘
        build-time │ (Node script)
                   ▼
 ElevenLabs TTS (with-timestamps) ──► audio/*.mp3 + cues/*.json (word/cue times)
                   │
══════════════ static site (no backend) ═══════════════
                   ▼
 Lesson player ── audio clock ──► Timeline runner ──► Cube engine ──► 3D renderer
      ▲                               │ cues: move, highlight, camera, caption
      │                               ▼
  UI shell (captions, controls)   Exercise engine (predicates, hints, undo)
      ▲
  Progress store (localStorage)
```

Key idea: **narration is static content, not a runtime service.** Audio and timing are generated once at build time and shipped as files. Consequences: no API key in the browser, no per-user cost, instant playback, works offline, no backend to operate. (Live "ask the tutor anything" would break this model, so it's deferred; §12.)

---

## 5. Technical design

### 5.1 Stack (decided)
- **Astro 7** (static output) + **TypeScript** (strict). Pages, lesson routes and content collections live in Astro.
- **Vue 3 islands** for the interactive parts only: the cube stage, the lesson player and controls. Static content (intro pages, sources, about) ships zero JS.
- **Three.js** for rendering, wrapped imperatively inside one Vue island.
- Cube engine is **framework-free TypeScript** in `src/engine` (pure logic, no DOM), shared by the island, the exercises and the narration tool.
- Lesson data validated with Astro content collection schemas (Zod). Vitest for unit tests, Playwright for end-to-end.
- Hosting: static (Cloudflare Pages or Vercel). Audio served as lazy-loaded per-lesson files.

### 5.1.1 Internationalization (English first, ready for pt-BR)
- Astro i18n routing: `defaultLocale: 'en'`, no prefix for English; `/pt-br/...` when added.
- UI strings in `src/i18n/ui.ts`, typed against English so a missing translation is a compile error.
- Lesson content per locale: `src/content/lessons/<locale>/...`. Lesson *structure* (cube cues, exercises, goals) is shared; only narration text and captions are per locale. Cue markers stay inline in each translation so timing follows each language's own speech.
- Narration audio per locale: `public/audio/<locale>/...`, generated by the same pipeline with a per-locale voice setting.
- Adding a language = add the locale to `astro.config.mjs`, translate `ui.ts` and the lesson texts, run the narration build.

### 5.2 Cube logic engine (`/engine`)
- **State model:** 26 cubies with position + orientation, or a facelet array of 54 stickers. I propose cubie-based (matches the 3D scene) with a facelet projection for predicates and display.
- **Moves:** all face turns (`R R' R2` …), slice and whole-cube rotations (`M E S x y z`), wide moves optional. Parser/serializer for notation strings. Inverse, simplification (`R R` → `R2`).
- **Orientation-aware:** the learner may rotate the whole cube; predicates must work in cube-relative terms (fixed centers define target colors), not screen terms.
- **Predicates:** `isCrossSolved(color)`, `isFirstLayerSolved`, `isF2LSolved`, `isLastLayerCrossOriented`, `isSolved`, plus "piece X is in slot Y". These drive exercise validation and feedback.
- **Controlled-state generation:** to make exercises, apply the *inverse* of a chosen teaching sequence to a prepared state. This guarantees solvable states that illustrate exactly one case, with no random scrambling that might wander into advanced cases.
- **Stage hint solver:** small bounded searches per stage (e.g., a cross is ≤ ~8 moves, trivial to search) to give a "next move" hint from an arbitrary learner state. A full-cube solver library may be used only for the capstone's emergency "show me" hint.
- **Alg verification tests:** every algorithm shown in a lesson is unit-tested to prove it does what the narration claims (e.g., preserves the first layer; cycles exactly three edges). The tutor never teaches an incorrect claim.

### 5.3 3D renderer and animation (`/render`)
Quality is a headline requirement.
- **Geometry:** 26 cubies as rounded boxes (`RoundedBoxGeometry`), black plastic body with slightly raised, rounded stickers as separate meshes (tiny bevel) so edges catch light.
- **Materials:** `MeshPhysicalMaterial` — sticker plastic with subtle clearcoat and roughness variation; matte-gloss body.
- **Lighting:** image-based lighting (studio HDRI or `RoomEnvironment`), one soft key light with shadow, a contact shadow plane under the cube, gentle vignette/tone-mapping. Optional subtle post-processing (SSAO/bloom only if it holds 60 fps on mid phones).
- **Layer turns:** pivot-group technique. Attach affected cubies to a temporary pivot, rotate with an eased quaternion tween, snap exactly to 90° multiples, detach, update logical state. Move queue with speed control and instant "fast-forward" for seeking.
- **Interaction:** pointer events (mouse + touch + pen). Raycast sticker → face normal → project the drag vector to screen space against the two tangent axes → pick layer and direction. Orbit controls on background drag. Both handle inertia and accidental drags (drag threshold).
- **Teaching overlays:** piece highlight (glow / dim the rest), arrows for move direction, labelled axes, ghost preview of a move's result, camera presets (e.g., "look at top", "look at right").
- **Performance:** cap devicePixelRatio, render on demand (idle = no frames), pause when tab hidden, test on a low-end Android and an older iPhone.
- **Fallbacks:** if WebGL is unavailable, show a clear message (and later possibly a 2D net view).

### 5.4 Tutor engine (`/tutor`)
- **Lesson script format** (authoring for humans, readable diffs):
  ```ts
  step({
    id: 'alg-first-intro',
    narration: `Watch the right face. {{move:R}} It turns toward you. {{highlight:edge(W,B)}}
                Now the top. {{move:U}} …`,
    start: 'solved',
    onEnd: { allow: 'replay' },
  })
  ```
  Markers: `move`, `highlight`, `dim`, `camera`, `caption`, `pause`, `showNotation`. Markers sit inline at the exact word that triggers them.
- **Build step:** strip markers → send clean text to ElevenLabs → receive character-level timestamps → map each marker's character index to a time → emit `cues.json`. So moves land on the right word with no hand timing.
- **Runtime:** the **audio element is the master clock**. A timeline runner fires cues as `currentTime` advances. Pause/resume, replay-from-start, replay-this-sentence, playback-rate (0.75×–1.25×, pitch preserved), seek.
- **Deterministic seeking:** on seek/replay, reset the cube to the step's start state and apply all cues up to time *t* instantly, then continue animated. This makes rewind/replay bulletproof.
- **If the user interacts mid-narration:** tutor pauses, user plays; "Resume" restores the step's state and continues (or offers "keep my cube").
- **Captions:** always on-screen with word highlight from the same timestamps. This covers deaf/HoH users, muted users, and autoplay-blocked browsers.
- **Audio unlock:** browsers block autoplay, so the very first screen has a single "Begin" button that unlocks audio.
- **Voice-less fallback:** if audio fails to load, cues run on a computed reading-speed clock, so the lesson still works with captions.

### 5.5 Narration pipeline with ElevenLabs
- Uses the `text-to-speech/{voice_id}/with-timestamps` endpoint: it returns the audio as base64 plus per-character start/end times, which is exactly what cue alignment needs.
- Request stitching (`previous_text` / `next_text`, or request IDs) keeps the intonation continuous across the separate steps of one lesson.
- **Content-hashed cache:** hash(text + voice + model + settings) → skip regeneration for unchanged steps, so edits only cost the characters that changed.
- A **pronunciation lexicon / respell list** for terms the TTS may mangle ("Ernő Rubik", "Singmaster", "algorithm", notation read aloud: "R prime", "U two"). Notation in the *script* is written for the ear, shown on screen as symbols.
- **Review loop:** a local "audition" page plays any step with its cue markers visualised, so you can approve or tweak wording and regenerate cheaply.
- Voice/model choice is a product decision (§14). Plan assumes a warm, calm, mid-paced voice. `eleven_multilingual_v2` is the documented default for this endpoint; verify whether newer models (e.g., `eleven_v3`) support timestamps before choosing, via `GET /v1/models` (`can_do_text_to_speech`).
- Output: mono MP3 ~64–96 kbps, ≈40 MB for the full hour, lazy-loaded per lesson.
- **Budget estimate (my arithmetic):** speech ≈ 800–900 characters/minute, so ≈ 50–55k characters for a full pass; plan for 3–5× that during iteration. Check your plan's quota.
- **Licensing:** the free tier prohibits commercial use and requires attribution; paid plans include commercial rights. Even if the app is free, ads, donations or sponsorship may count as commercial, so budget for a paid plan or add attribution. Confirm current terms before launch.

### 5.6 Exercise engine (`/exercises`)
- Exercise = `{ startState | generator, goal: predicate, hints[], allowedMoves?, successNarration, failureNarration }`.
- Evaluate predicate after every completed turn. On success: tutor celebrates, "Next" unlocks. On state that makes the goal unreachable by simple means ("you broke the first layer"): suggest undo.
- **Anti-copy design:** several exercises per stage use *different* generated cases so memorizing one sequence doesn't pass.
- Optional "teach-back" micro-step later: "Which of these pieces is wrong?" quiz formats (tap-to-select) in addition to perform-a-move.

### 5.7 State and persistence
- `localStorage` (wrapped in try/catch) for: completed steps, current position, settings (voice on/off, speed, captions, color scheme).
- Export/import progress as a short code (no backend).
- Privacy-friendly analytics only (§10), no cookies requiring consent banners if avoidable.

### 5.8 Accessibility and inclusivity
- Captions always; full keyboard operability; focus order and ARIA live region for captions and feedback.
- `prefers-reduced-motion`: shorter, less ornate camera motion; moves still animate (they are the content) but without flourish.
- **Colour-blind mode:** optional symbols/letters on stickers or alternative palette; cubes are a classic accessibility trap.
- Large touch targets; no hover-only features.
- Language: structure all text/audio per locale from day one (§14).

### 5.9 Repository layout
Single Astro project (no monorepo needed; the engine stays isolated by folder and has no imports from the rest):
```
cube-tutor/
  src/engine/          # pure cube logic + tests (no DOM, no framework)
  src/render/          # Three.js cube, animation, input (framework-free)
  src/tutor/           # cue timeline player, exercise runner
  src/components/      # Vue islands (CubeStage, LessonPlayer, controls) + Astro components
  src/content/lessons/ # lesson scripts per locale: en/ (pt-br/ later)
  src/i18n/            # UI strings per locale
  src/pages/           # routes
  tools/narrate/       # ElevenLabs build pipeline + audition page
  public/audio/<locale>/  # generated mp3 + cues.json
  docs/                # this plan, content bible, fact-check sources
```

---

## 6. Content production

- **Content bible:** one doc with tone ("patient teacher, short sentences, never condescending"), terminology rules, how notation is spoken, and a fact-check sources list.
- **Script every step in order**, read it aloud before generating audio. Narration should be 15–25 seconds per beat, cues every few seconds so the cube is always doing something relevant.
- **Illustrations for history:** keep minimal (cube-centric visuals: exploded view, timeline as 3D objects). No stock photos unless licensed.
- **Rewrite pass** from the learner's view after the first prototype test (§9).

---

## 7. Roadmap and milestones

Each milestone ends with something you can open and judge. Time estimates assume one focused developer; adjust to your pace.

| # | Milestone | Deliverable | Est. |
|---|---|---|---|
| **M0** | Foundations | Repo, tooling, CI, lint/test setup, design tokens, hosting stub. *Done: Astro + Vue + Three + Vitest + i18n skeleton. Still to do: CI, design tokens, hosting.* | 2–3 days |
| **M1** | Cube engine | State, moves, notation, predicates, scramble/case generator; full unit test suite incl. alg verification. *Done: 60 tests passing; every beginner-method algorithm claim proven.* | 1 week |
| **M2** | 3D cube | Beautiful cube, animated moves, drag-to-turn, orbit, undo/reset, mobile touch | 1.5–2 weeks |
| **M3** | Tutor engine + narration pipeline | Lesson script format, ElevenLabs build tool, cue timeline player, captions, audition page | 1–1.5 weeks |
| **M4** | **Vertical slice** — your note's validation prototype: one complete lesson (white cross) with narration, highlights, one "why", hint ladder and a gated challenge | Playable end to end | 1 week |
| **M4.5** | **User test:** 5 people who can't solve the cube (your note's plan); measure explain-back and repeat on a physical cube. Decide go / adjust before authoring all content | Findings doc | 1 week |
| **M5** | Shell and lessons 1–8 | Intro, history, anatomy, notation, first alg; lesson map, progress, settings | 2 weeks |
| **M6** | Solving lessons 9–16 | All stages, exercises, hint solver, capstone | 3–4 weeks |
| **M7** | Polish and accessibility | Visual polish, performance pass, colour-blind mode, a11y audit, PWA/offline | 1–2 weeks |
| **M8** | Beta and launch | Closed beta, fixes, analytics, SEO/social cards, public release | 1–2 weeks |

Rough total: **12–17 weeks** solo. The decision gate at M4.5 is intentional. It's your note's "next validation" step and protects the heavy content investment.

---

## 8. Quality strategy

- **Engine:** property-style tests (move then inverse = identity; `R U R' U'` has order 6; random sequences stay valid; every lesson algorithm matches its claim). Engine bugs here would silently teach wrong things, so this suite is non-negotiable.
- **Renderer:** visual snapshot tests for key states; manual device matrix (iPhone SE-class, recent iPhone, mid Android, desktop Chrome/Safari/Firefox).
- **Tutor:** tests that every `cues.json` marker maps to a valid move/highlight; seek-and-replay determinism test (state at time *t* identical after any sequence of seeks).
- **E2E (Playwright):** complete a lesson, gating blocks Next until solved, undo/reset behaviour, progress persists after reload.
- **Performance budgets:** first interactive < 3 s on 4G; cube at 60 fps desktop / ≥ 30 fps low-end mobile; initial JS < ~300 KB gz excluding Three (tree-shaken), audio lazy.

---

## 9. Validating the learning (not just the code)

- M4.5 test script per your note: 5 novices, observe unassisted, then ask them to repeat the cross on a *physical* cube and explain why an insertion works. Success = ≥ 4 of 5 can do it.
- Instrument (locally, anonymously): step completion, hint level used, exercise attempts, replay counts, where users pause/leave. These tell us which narration is confusing.
- Re-test after the full course with 3–5 new learners targeting "solved a physical cube within a few sessions".

---

## 10. Privacy, analytics, ops

- No accounts, no personal data. Analytics: cookieless/privacy-first (e.g., Plausible or self-hosted) with only aggregate events.
- Error reporting (Sentry free tier or similar), scrubbed.
- Costs once live: domain, static hosting (≈ free), CDN bandwidth for audio (small), ElevenLabs plan only at *build* time. This is a near-zero running cost app, which suits "free for everyone".

---

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Competition** (Cube Coach, GoCube, official Rubik's app) | Low differentiation | Conceptual teacher narration, goal-state assessment, zero-friction free site; validate at M4.5 before big content spend |
| Drag-to-turn feels bad on touch | High — it *is* the product | Build and tune it in M2 before any content; test on real devices early |
| Narration/animation drift | Tutor feels fake | Audio as master clock; cues from TTS timestamps; deterministic seeking |
| Incorrect claims taught | Trust loss | Alg unit tests + sourced fact-check of the history script |
| Voice quality / mispronunciation | Breaks the "real teacher" illusion | Respell lexicon, audition page, stitched requests, re-gen only changed steps |
| TTS licensing/cost | Legal or budget surprise | Verify plan terms; content-hash cache; paid plan before launch |
| Content volume (60 min of scripted teaching) | Schedule | Vertical slice first; authoring format that makes scripts cheap to write |
| Trademark | Takedown risk | Don't use "Rubik's" in product name/domain/logo; use "3×3 cube"; neutral factual mentions only in history |
| Beginner overwhelm | Drop-off | Short steps, always-available hint/undo/reset, calm failure copy |
| Mobile perf | Janky experience | DPR cap, on-demand render, low-end device testing from M2 |

---

## 12. Deferred / future ideas

- **"Ask the tutor" Q&A** (your note's "Why does this algorithm work?" question): would need an LLM + live TTS behind a small proxy with rate limiting and cost control, breaking the zero-backend model. A cheaper v1.5 variant is *pre-authored "Why?" buttons* with prepared narrated answers per step, which delivers most of the value and fits the static architecture.
- CFOP "Level 2", OLL/PLL trainer, free-play scramble trainer with timer.
- Camera scan of a physical cube to import the state.
- pt-BR and other languages (voice re-generation via the same pipeline).
- Smart-cube Bluetooth support.
- Shareable "I solved it" completion card.

---

## 13. Naming and legal checklist

- Avoid "Rubik's" and the trademarked cube trade dress in name, domain, logo and marketing. Describe it as "the 3×3 cube".
- Credit sources for history facts in a "Sources" page.
- ElevenLabs attribution/licensing as per §5.5.
- Any HDRI/fonts/sounds: use CC0 or licensed assets, tracked in `docs/ASSETS.md`.
- Terms/Privacy page (short, plain-language) before public launch.

---

## 14. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Language(s) | **Decided:** English for v1, architecture ready for pt-BR and others (§5.1.1) |
| 2 | Voice | **Decided:** your paid ElevenLabs subscription; key goes in `.env` (see `.env.example`). Voice to be auditioned in M3 |
| 3 | UI framework | **Decided:** Astro 7 + Vue 3 islands |
| 4 | Method scope for v1 | Default: beginner LBL only |
| 5 | Gating strictness | Default: strict, with hint ladder |
| 6 | "3DS" | Default: Three.js |
| 7 | Where to build | **Decided:** `~/apps/cube-tutor` |
| 8 | Name | Default: "Cube Tutor" placeholder |
| 9 | Monetization | Open. Paid ElevenLabs plan covers commercial rights either way |

---

## 15. Definition of done for v1

A complete beginner opens the site on a phone, taps Begin, is guided by the tutor through the history, anatomy, notation and every solving stage, passes every exercise unaided or with hints, and finishes the capstone solve, with progress saved, captions available, and the cube at 60 fps on a recent device.
