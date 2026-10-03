<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { randomScramble } from '../engine/generate';
import { formatMove, type MoveName } from '../engine/moves';
import { isSolved } from '../engine/predicates';
import { SOLVED } from '../engine/state';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import type { CubeView, ViewName } from '../render/CubeView';
import { CubeHistory } from '../tutor/history';
import { moveFromKey } from '../tutor/keyboard';
import BrandMark from './BrandMark.vue';
import CubeStage from './CubeStage.vue';
import MoveKey from './MoveKey.vue';
import SettingsMenu from './SettingsMenu.vue';

// Free play, laid out like a lesson: actions in a rail beside the cube with a
// status alert above them, and the move keys in the dock below.

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);

const view = shallowRef<CubeView | null>(null);
const history = shallowRef<CubeHistory | null>(null);
const stageEl = ref<HTMLElement | null>(null);
const tick = ref(0); // bumps when history changes so computed values refresh
const prime = ref(false);
const labels = ref(false);
const inside = ref(false);
const solved = ref(true);
const scrambled = ref(false);
const moveCount = ref(0);

const faces: MoveName[] = ['R', 'L', 'U', 'D', 'F', 'B'];
const views: ViewName[] = ['default', 'top', 'bottom', 'back'];

const canUndo = computed(() => (tick.value, history.value?.canUndo ?? false));
const canRedo = computed(() => (tick.value, history.value?.canRedo ?? false));
/** Solved a scramble yourself: celebrate it. */
const solvedScramble = computed(() => solved.value && scrambled.value && moveCount.value > 0);

function onReady(v: CubeView) {
  view.value = v;
  history.value = new CubeHistory(v, () => tick.value++);
  v.on('move', ({ state }) => {
    solved.value = isSolved(state);
    moveCount.value = history.value?.moves.length ?? 0;
  });
  window.addEventListener('keydown', onKey);
  updateFraming();
}

function turn(name: MoveName) {
  view.value?.turn({ name, amount: prime.value ? -1 : 1 }, { source: 'user' });
}

function onKey(e: KeyboardEvent) {
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (e.shiftKey) history.value?.redo();
    else history.value?.undo();
    return;
  }
  const m = moveFromKey(e);
  if (m) {
    e.preventDefault();
    view.value?.turn(m, { source: 'user' });
  }
}

async function scramble() {
  const v = view.value;
  if (!v) return;
  v.setState(SOLVED);
  history.value?.clear();
  solved.value = false;
  scrambled.value = true;
  moveCount.value = 0;
  await v.play(randomScramble(20), { duration: 0.11 });
}

function reset() {
  view.value?.setState(SOLVED);
  history.value?.clear();
  solved.value = true;
  scrambled.value = false;
  moveCount.value = 0;
}

function toggleLabels() {
  labels.value = !labels.value;
  view.value?.setLabels(labels.value);
}

function toggleInside() {
  inside.value = !inside.value;
  view.value?.setExplode(inside.value ? 1 : 0);
}

// Keep the cube clear of the rail, like in lessons.
function updateFraming() {
  const v = view.value;
  const el = stageEl.value;
  if (!v || !el) return;
  v.setFraming(el.clientWidth >= 720 ? { x: -0.1 } : { y: -0.12, zoom: 1.15 });
}
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (stageEl.value) {
    resizeObserver = new ResizeObserver(updateFraming);
    resizeObserver.observe(stageEl.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  resizeObserver?.disconnect();
  history.value?.dispose();
});
</script>

<template>
  <div class="play fx-mount">
    <header class="top">
      <BrandMark :href="localePath(locale, '/')" :label="t('app.title')" :wordmark="false" />
      <div class="titles">
        <span class="eyebrow">{{ t('play.eyebrow') }}</span>
        <h1>{{ t('play.title') }}</h1>
      </div>
      <SettingsMenu :locale="locale" />
    </header>

    <div ref="stageEl" class="stage">
      <CubeStage :label="t('cube.label')" @ready="onReady">
        <template #fallback>{{ t('cube.noWebgl') }}</template>
      </CubeStage>

      <aside class="rail">
        <div class="alert" :class="{ done: solved }" role="status" aria-live="polite">
          <p class="badge">
            <svg v-if="solved" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M4.5 10.5 8.2 14l7.3-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span v-else class="pulse-dot" aria-hidden="true" />
            {{ solved ? t('play.solved') : t('play.scrambled') }}
          </p>
          <Transition name="fx" mode="out-in">
            <p v-if="solvedScramble" key="won" class="note strong">{{ t('play.solvedIn', { n: moveCount }) }}</p>
            <p v-else-if="!solved" key="count" class="note">{{ t('play.moves') }}: {{ moveCount }}</p>
          </Transition>
        </div>

        <div class="actions">
          <button type="button" class="chip" :disabled="!canUndo" @click="history?.undo()">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M7.5 5 3.5 9l4 4M4 9h7.5a4.5 4.5 0 0 1 0 9H9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('action.undo') }}</span>
          </button>
          <button type="button" class="chip" :disabled="!canRedo" @click="history?.redo()">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M12.5 5l4 4-4 4M16 9H8.5a4.5 4.5 0 0 0 0 9H11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('action.redo') }}</span>
          </button>
          <button type="button" class="chip" @click="scramble">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M2.5 6h3.2c3.6 0 5.2 8 8.8 8H17M2.5 14h3.2c1.4 0 2.4-1.2 3.3-2.8M11.2 8.8C12.1 7.2 13 6 14.5 6H17M14.8 3.8 17 6l-2.2 2.2M14.8 11.8 17 14l-2.2 2.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('play.scramble') }}</span>
          </button>
          <button type="button" class="chip" @click="reset">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M3.5 10a6.5 6.5 0 1 0 2-4.7M3.5 3v3.8h3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('play.solve') }}</span>
          </button>
          <span class="divider" aria-hidden="true" />
          <button type="button" class="chip" :aria-pressed="labels" @click="toggleLabels">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <rect x="3" y="3" width="14" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="M7.5 13.5 10 6.5l2.5 7M8.4 11.2h3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('play.labels') }}</span>
          </button>
          <button type="button" class="chip" :aria-pressed="inside" @click="toggleInside">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4M7.5 7.5 3.5 3.5M12.5 7.5l4-4M12.5 12.5l4 4M7.5 12.5l-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">{{ t('play.inside') }}</span>
          </button>
        </div>
      </aside>
    </div>

    <footer class="dock">
      <p class="intro">{{ t('play.intro') }}</p>
      <div class="keys" role="group" :aria-label="t('play.moves')">
        <MoveKey
          v-for="f in faces"
          :key="f"
          :notation="formatMove({ name: f, amount: prime ? -1 : 1 })"
          @press="turn(f)"
        />
        <button type="button" class="chip" :aria-pressed="prime" @click="prime = !prime">
          {{ t('play.counterClockwise') }}
        </button>
      </div>
      <nav class="transport">
        <div class="views" role="group" :aria-label="t('play.views')">
          <button v-for="v in views" :key="v" type="button" class="chip quiet" @click="view?.setView(v)">
            {{ t(`view.${v}` as 'view.default') }}
          </button>
        </div>
        <a class="primary" :class="{ nudge: solvedScramble }" :href="localePath(locale, '/learn')">
          {{ t('play.toLessons') }}
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </a>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.play {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100dvh;
}

/* ── Top bar (same pattern as lessons) ── */
.top {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: var(--gutter) var(--gutter) 0;
  font-size: var(--step-1);
}
.titles {
  display: grid;
  gap: 0.1rem;
  margin-right: auto;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--ink-soft);
}
h1 {
  font-size: var(--step-1);
}

/* ── Stage + rail ── */
.stage {
  position: relative;
  min-height: 0;
}
.rail {
  position: absolute;
  top: 50%;
  right: var(--gutter);
  translate: 0 -50%;
  width: min(15rem, 36%);
  display: grid;
  gap: 0.7rem;
  justify-items: end;
}
.alert {
  width: 100%;
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--highlight);
  border-radius: var(--radius-sm);
  background: color-mix(in oklab, var(--surface) 90%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 40px -24px rgb(0 0 0 / 0.4);
  transition: border-color 0.3s var(--ease);
}
.alert.done {
  border-left-color: var(--success);
}
.badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.alert.done .badge {
  color: var(--success);
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--highlight);
  animation: breathe 1.8s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
}
.note {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.note.strong {
  font-family: var(--font-body);
  color: var(--ink);
}
.actions {
  display: grid;
  gap: 0.45rem;
  justify-items: end;
}
.actions .chip:not([aria-pressed='true']) {
  background: color-mix(in oklab, var(--surface) 90%, transparent);
  backdrop-filter: blur(8px);
}
.divider {
  width: 2.2rem;
  height: 1px;
  margin: 0.2rem 0;
  background: var(--hairline);
}

/* ── Dock ── */
.dock {
  display: grid;
  gap: 0.85rem;
  padding: 0 var(--gutter) max(var(--gutter), env(safe-area-inset-bottom));
}
.intro {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 500;
  line-height: 1.3;
  color: var(--ink-soft);
  max-width: 46ch;
  text-wrap: balance;
}
.keys,
.views {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.transport {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.chip.quiet:not([aria-pressed='true']) {
  background: transparent;
}
.primary.nudge {
  animation: halo 1.8s cubic-bezier(0.22, 0.9, 0.36, 1) infinite;
}
@keyframes halo {
  0% {
    box-shadow:
      0 0 0 0 color-mix(in oklab, var(--highlight) 95%, transparent),
      0 0 0 0 color-mix(in oklab, var(--highlight) 55%, transparent);
  }
  75%,
  100% {
    box-shadow:
      0 0 0 12px color-mix(in oklab, var(--highlight) 0%, transparent),
      0 0 0 24px color-mix(in oklab, var(--highlight) 0%, transparent);
  }
}

@media (max-width: 720px) {
  .rail {
    top: auto;
    bottom: 0.6rem;
    left: var(--gutter);
    right: var(--gutter);
    translate: none;
    width: auto;
    justify-items: stretch;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4rem;
  }
  .actions .label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .actions .chip {
    width: 2.6em;
    padding: 0;
    justify-content: center;
  }
  .divider {
    width: 1px;
    height: 1.6rem;
    margin: 0 0.15rem;
    align-self: center;
  }
  .intro {
    font-size: var(--step-0);
  }
}
</style>
