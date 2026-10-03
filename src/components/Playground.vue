<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { randomScramble } from '../engine/generate';
import { formatMove, type MoveName } from '../engine/moves';
import { isSolved } from '../engine/predicates';
import { SOLVED } from '../engine/state';
import type { Locale } from '../i18n/ui';
import { useTranslations } from '../i18n/utils';
import type { CubeView, ViewName } from '../render/CubeView';
import { CubeHistory } from '../tutor/history';
import { moveFromKey } from '../tutor/keyboard';
import CubeStage from './CubeStage.vue';
import MoveKey from './MoveKey.vue';

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);

const view = shallowRef<CubeView | null>(null);
const history = shallowRef<CubeHistory | null>(null);
const tick = ref(0); // bumps when history changes so computed values refresh
const prime = ref(false);
const labels = ref(false);
const inside = ref(false);
const solved = ref(true);
const moveCount = ref(0);

const faces: MoveName[] = ['R', 'L', 'U', 'D', 'F', 'B'];
const views: ViewName[] = ['default', 'top', 'bottom', 'back'];

const canUndo = computed(() => (tick.value, history.value?.canUndo ?? false));
const canRedo = computed(() => (tick.value, history.value?.canRedo ?? false));

function onReady(v: CubeView) {
  view.value = v;
  history.value = new CubeHistory(v, () => tick.value++);
  v.on('move', ({ state }) => {
    solved.value = isSolved(state);
    moveCount.value = history.value?.moves.length ?? 0;
  });
  window.addEventListener('keydown', onKey);
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
  await v.play(randomScramble(20), { duration: 0.11 });
  moveCount.value = 0;
}

function reset() {
  view.value?.setState(SOLVED);
  history.value?.clear();
  solved.value = true;
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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  history.value?.dispose();
});
</script>

<template>
  <div class="play">
    <header class="top">
      <a class="brand" href="/">{{ t('app.title') }}</a>
      <h1>{{ t('play.title') }}</h1>
      <span class="status" :class="{ on: solved }" aria-live="polite">
        {{ solved ? t('play.solved') : `${t('play.moves')}: ${moveCount}` }}
      </span>
    </header>

    <div class="cube">
      <CubeStage :label="t('cube.label')" @ready="onReady">
        <template #fallback>{{ t('cube.noWebgl') }}</template>
      </CubeStage>
    </div>

    <footer class="dock">
      <p class="intro">{{ t('play.intro') }}</p>
      <div class="row">
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
        <div class="actions">
          <button type="button" class="chip" :disabled="!canUndo" @click="history?.undo()">↶ {{ t('action.undo') }}</button>
          <button type="button" class="chip" :disabled="!canRedo" @click="history?.redo()">↷ {{ t('action.redo') }}</button>
          <button type="button" class="chip" @click="scramble">{{ t('play.scramble') }}</button>
          <button type="button" class="chip" @click="reset">{{ t('play.solve') }}</button>
        </div>
      </div>
      <div class="row secondary">
        <div class="keys" role="group" :aria-label="t('play.views')">
          <button v-for="v in views" :key="v" type="button" class="chip quiet" @click="view?.setView(v)">
            {{ t(`view.${v}` as 'view.default') }}
          </button>
        </div>
        <div class="actions">
          <button type="button" class="chip quiet" :aria-pressed="labels" @click="toggleLabels">{{ t('play.labels') }}</button>
          <button type="button" class="chip quiet" :aria-pressed="inside" @click="toggleInside">{{ t('play.inside') }}</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.play {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100dvh;
}
.top {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: var(--gutter) var(--gutter) 0;
}
.brand {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
}
h1 {
  font-size: var(--step-0);
  font-weight: 500;
  color: var(--ink-soft);
}
.status {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.status.on {
  color: var(--success);
}
.cube {
  min-height: 0;
}
.dock {
  display: grid;
  gap: 0.8rem;
  padding: 0 var(--gutter) max(var(--gutter), env(safe-area-inset-bottom));
}
.intro {
  margin: 0;
  color: var(--ink-soft);
  font-size: var(--step--1);
  max-width: 60ch;
}
.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.6rem;
}
.keys,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}
.chip.quiet:not([aria-pressed='true']) {
  background: transparent;
}
</style>
