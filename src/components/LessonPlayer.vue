<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { LESSONS, courseText, doneClipId, lessonById, lessonIndex, stepText } from '../course';
import { baseState, isGoalMet, isWantedPick, startState, stepSolution } from '../course/setup';
import { parseAlg, type Alg } from '../engine/moves';
import { applyAlg, type CubeState } from '../engine/state';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import type { CubeView } from '../render/CubeView';
import { CubeHistory } from '../tutor/history';
import { moveFromKey } from '../tutor/keyboard';
import { keycapsFor } from '../tutor/keys';
import { loadManifest, resolveClip, type Manifest } from '../tutor/narration';
import { NarrationPlayer } from '../tutor/player';
import {
  completeLesson,
  completeStep,
  isLessonUnlocked,
  loadProgress,
  nextLessonId,
  resetProgress,
  updateSettings,
  type Settings,
} from '../tutor/progress';
import { parseScript, type Word } from '../tutor/script';
import { parseSelectorText, resolveSelector } from '../tutor/selectors';
import Caption from './Caption.vue';
import CubeStage from './CubeStage.vue';
import MoveKey from './MoveKey.vue';
import SettingsPanel from './SettingsPanel.vue';

const props = defineProps<{ locale: Locale; lessonId: string }>();
const t = useTranslations(props.locale);
const text = courseText(props.locale);
const lesson = lessonById(props.lessonId)!;
const lessonNumber = lessonIndex(props.lessonId) + 1;
const isLastLesson = lessonNumber === LESSONS.length;

// ─── Reactive state ─────────────────────────────────────────────────────────
const view = shallowRef<CubeView | null>(null);
const history = shallowRef<CubeHistory | null>(null);
const player = shallowRef<NarrationPlayer | null>(null);
const manifest = shallowRef<Manifest | null>(null);

const unlocked = ref(true);
const started = ref(false);
const stepIndex = ref(0);
const settings = ref<Settings>(loadProgress().settings);
const completed = ref<string[]>(loadProgress().completedSteps);
const showSettings = ref(false);

const words = ref<readonly Word[]>([]);
const currentWord = ref(-1);
const keys = ref<{ alg: string; active: number } | null>(null);
const playing = ref(false);
const narrationEnded = ref(false);
const audioMissing = ref(false);

const taskDone = ref(false);
const hintLevel = ref(0);
const turns = ref(0);
const picks = ref<Set<number>>(new Set());
const feedback = ref('');
const showing = ref(false);
const historyTick = ref(0);
const courseFinished = ref(false);

let taskStart: CubeState = baseState();

const step = computed(() => lesson.steps[stepIndex.value]!);
const stepTxt = computed(() => stepText(props.locale, step.value.id));
const isTask = computed(() => step.value.kind === 'try');
const canNext = computed(() => !isTask.value || taskDone.value || completed.value.includes(step.value.id));
const isLastStep = computed(() => stepIndex.value === lesson.steps.length - 1);
const solution = computed(() => stepSolution(step.value));
const hints = computed(() => stepTxt.value.hints ?? []);
const canUndo = computed(() => (historyTick.value, history.value?.canUndo ?? false));
const keycaps = computed(() => (keys.value ? keycapsFor(keys.value.alg) : null));
const keyList = computed(() => keycaps.value?.keys ?? []);
const pickGoal = computed(() => (step.value.goal?.kind === 'pick' ? step.value.goal : null));

// ─── Setup ──────────────────────────────────────────────────────────────────
function stateFor(base: 'home' | 'grip' | 'daisy', alg: Alg): CubeState {
  return applyAlg(baseState(base), alg);
}

function onReady(v: CubeView) {
  view.value = v;
  v.interaction.turns = false;
  v.autoRotate = true;
  history.value = new CubeHistory(v, () => historyTick.value++);
  v.on('move', ({ source }) => {
    if (source !== 'user' || !isTask.value || taskDone.value || showing.value) return;
    turns.value++;
    checkTask();
  });
  v.on('pick', ({ cubieId }) => onPick(cubieId));
}

async function start() {
  started.value = true;
  manifest.value = await loadManifest(props.locale, settings.value.voice);
  enterStep(0);
}

function disposePlayer() {
  player.value?.dispose();
  player.value = null;
  playing.value = false;
}

function applySetupVisuals() {
  const v = view.value!;
  const s = step.value.setup;
  v.showArrow(null);
  v.setView(s?.view ?? 'default');
  v.setLabels(!!s?.labels);
  v.setExplode(s?.explode ? 1 : 0);
  v.autoRotate = !!s?.autorotate;
  const sel = s?.highlight ? parseSelectorText(s.highlight) : null;
  v.highlight(sel ? resolveSelector(sel, v.state) : null);
  keys.value = s?.keys ? { alg: s.keys, active: -1 } : null;
}

function enterStep(i: number) {
  const v = view.value;
  if (!v) return;
  disposePlayer();
  stepIndex.value = i;
  taskDone.value = false;
  hintLevel.value = 0;
  turns.value = 0;
  picks.value = new Set();
  feedback.value = '';
  showing.value = false;
  narrationEnded.value = false;

  v.cancelTurns();
  taskStart = startState(step.value.setup);
  v.setState(taskStart);
  history.value?.clear();
  applySetupVisuals();

  // Tasks can be tried straight away; explanations lock the cube while the tutor talks.
  v.interaction.turns = isTask.value && step.value.goal?.kind !== 'pick';
  v.interaction.pick = step.value.goal?.kind === 'pick';
  v.interaction.orbit = true;

  playClip(step.value.id, stepTxt.value.say, () => {
    narrationEnded.value = true;
    if (!isTask.value) v.interaction.turns = step.value.turns !== false;
  });
}

function playClip(clipId: string, say: string, onEnded?: () => void) {
  const v = view.value!;
  disposePlayer();
  const script = parseScript(say);
  const clip = resolveClip(manifest.value, props.locale, settings.value.voice, clipId, script);
  audioMissing.value = !clip.url && !settings.value.muted;
  const p = new NarrationPlayer({
    view: v,
    script,
    timing: clip.timing,
    audioUrl: clip.url,
    stateFor,
    rate: settings.value.rate,
    muted: settings.value.muted,
  });
  words.value = script.words;
  currentWord.value = -1;
  p.on('word', (w) => (currentWord.value = w));
  p.on('keys', (k) => (keys.value = k.alg ? { alg: k.alg, active: k.active } : null));
  p.on('playing', (on) => (playing.value = on));
  if (onEnded) p.on('ended', onEnded);
  player.value = p;
  void p.play();
}

// ─── Tasks ──────────────────────────────────────────────────────────────────
function checkTask() {
  const goal = step.value.goal;
  const v = view.value;
  if (!goal || !v || taskDone.value) return;
  if (isGoalMet(goal, { start: taskStart, state: v.state, turns: turns.value, picks: picks.value })) succeed();
}

function succeed() {
  taskDone.value = true;
  feedback.value = '';
  completeStep(step.value.id);
  completed.value = loadProgress().completedSteps;
  const done = stepTxt.value.done;
  if (done) playClip(doneClipId(step.value), done);
}

function onPick(cubieId: number) {
  const goal = pickGoal.value;
  const v = view.value;
  if (!goal || !v || taskDone.value) return;
  if (isWantedPick(goal, v.state, cubieId)) {
    picks.value = new Set([...picks.value, cubieId]);
    v.highlight([...picks.value]);
    feedback.value = goal.count > 1 ? t('lesson.found', { n: picks.value.size, total: goal.count }) : '';
    checkTask();
  } else {
    feedback.value = t('lesson.notThat');
  }
}

function resetTask() {
  const v = view.value;
  if (!v) return;
  v.cancelTurns();
  v.setState(taskStart);
  history.value?.clear();
  turns.value = 0;
  picks.value = new Set();
  feedback.value = '';
  applySetupVisuals();
}

function hint() {
  hintLevel.value = Math.min(hints.value.length, hintLevel.value + 1);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function showMe() {
  const v = view.value;
  const sol = solution.value;
  if (!v || !sol || showing.value) return;
  showing.value = true;
  v.interaction.turns = false;
  player.value?.pause();
  v.cancelTurns();
  v.setState(taskStart);
  v.highlight(null);
  const moves = parseAlg(sol);
  const original = keys.value;
  keys.value = { alg: sol, active: -1 };
  await sleep(400);
  for (const [k, m] of moves.entries()) {
    if (!showing.value) return;
    keys.value = { alg: sol, active: k % keycapsFor(sol).keys.length };
    v.showArrow(m);
    await v.turn(m, { duration: 0.6 });
  }
  v.showArrow(null);
  await sleep(900);
  if (!showing.value) return;
  v.setState(taskStart);
  history.value?.clear();
  turns.value = 0;
  keys.value = original;
  applySetupVisuals();
  v.interaction.turns = step.value.goal?.kind !== 'pick';
  showing.value = false;
}

// ─── Navigation ─────────────────────────────────────────────────────────────
function next() {
  if (!canNext.value) return;
  if (!isTask.value) completeStep(step.value.id);
  completed.value = loadProgress().completedSteps;
  if (!isLastStep.value) {
    enterStep(stepIndex.value + 1);
    return;
  }
  completeLesson(lesson.id);
  disposePlayer();
  if (isLastLesson) {
    courseFinished.value = true;
    return;
  }
  window.location.href = localePath(props.locale, `/learn/${LESSONS[lessonNumber]!.id}`);
}

function back() {
  if (stepIndex.value > 0) enterStep(stepIndex.value - 1);
}

function replay() {
  enterStep(stepIndex.value);
}

function togglePlay() {
  const p = player.value;
  if (!p || p.ended) replay();
  else if (p.playing) p.pause();
  else void p.play();
}

// ─── Settings ───────────────────────────────────────────────────────────────
async function changeSettings(patch: Partial<Settings>) {
  settings.value = updateSettings(patch);
  if (patch.rate !== undefined) player.value?.setRate(patch.rate);
  if (patch.muted !== undefined) {
    player.value?.setMuted(patch.muted);
    if (patch.muted) audioMissing.value = false;
  }
  if (patch.voice !== undefined && started.value) {
    manifest.value = await loadManifest(props.locale, patch.voice);
    if (!isTask.value || !taskDone.value) replay();
  }
}

function onReset() {
  resetProgress();
  window.location.href = localePath(props.locale, '/');
}

// ─── Keyboard ───────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (!started.value || showSettings.value) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest('button, a, input, select, textarea')) {
    if (e.key === ' ' || e.key === 'Enter') return; // let focused controls handle it
  }
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    void history.value?.undo();
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    togglePlay();
    return;
  }
  if (e.key === 'ArrowRight' && canNext.value) return next();
  if (e.key === 'ArrowLeft') return back();
  const m = moveFromKey(e);
  if (m && view.value?.interaction.turns) {
    e.preventDefault();
    void view.value.turn(m, { source: 'user' });
  }
}

onMounted(() => {
  unlocked.value = isLessonUnlocked(props.lessonId);
  window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  disposePlayer();
  history.value?.dispose();
});

const partColor = `var(--part-${lesson.part})`;
const nextLesson = LESSONS[lessonNumber];
const resumeId = computed(() => (unlocked.value ? null : nextLessonId()));
</script>

<template>
  <div class="lesson" :style="{ '--part': partColor }">
    <header class="top">
      <a class="map" :href="localePath(locale, '/learn')" :aria-label="t('lesson.allLessons')">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </a>
      <div class="titles">
        <span class="part">{{ text.parts[lesson.part] }} · {{ lessonNumber }}/{{ LESSONS.length }}</span>
        <h1>{{ text.lessons[lesson.id]?.title }}</h1>
      </div>
      <ol v-if="started" class="dots" :aria-label="t('lesson.stepOf', { n: stepIndex + 1, total: lesson.steps.length })">
        <li
          v-for="(s, i) in lesson.steps"
          :key="s.id"
          :class="{ on: i === stepIndex, done: completed.includes(s.id), 'is-task': s.kind === 'try' }"
        />
      </ol>
      <button type="button" class="icon" :aria-label="t('lesson.settings')" @click="showSettings = true">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path
            d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M4.7 15.3l1.6-1.6M13.7 6.3l1.6-1.6"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </header>

    <div class="stage">
      <CubeStage :label="t('cube.label')" @ready="onReady">
        <template #fallback>{{ t('cube.noWebgl') }}</template>
      </CubeStage>

      <div v-if="!unlocked" class="gate">
        <h2>{{ text.lessons[lesson.id]?.title }}</h2>
        <p>{{ t('learn.lockedLesson') }}</p>
        <a v-if="resumeId" class="primary" :href="localePath(locale, `/learn/${resumeId}`)">
          {{ t('learn.goTo', { lesson: text.lessons[resumeId]?.title ?? '' }) }}
        </a>
      </div>
      <div v-else-if="!started" class="gate">
        <h2>{{ text.lessons[lesson.id]?.title }}</h2>
        <p>{{ text.lessons[lesson.id]?.summary }}</p>
        <button type="button" class="primary" :disabled="!view" @click="start">{{ t('lesson.start') }}</button>
      </div>
      <div v-else-if="courseFinished" class="gate">
        <h2>{{ t('lesson.finishCourse') }}</h2>
        <p>{{ t('lesson.courseDone') }}</p>
        <a class="primary" :href="localePath(locale, '/play')">{{ t('home.freePlay') }}</a>
      </div>
    </div>

    <footer v-if="started && unlocked && !courseFinished" class="dock">
      <div class="speech" aria-live="polite">
        <Caption :words="words" :current="currentWord" />
        <p v-if="audioMissing" class="notice">{{ t('lesson.noAudio') }}</p>
      </div>

      <div v-if="keyList.length" class="keys" aria-hidden="true">
        <MoveKey
          v-for="(k, i) in keyList"
          :key="`${k}-${i}`"
          :notation="k"
          :active="keys?.active === i"
          :disabled="!view?.interaction.turns || showing"
          @press="view?.turn(parseAlg(k)[0]!, { source: 'user' })"
        />
        <span v-if="(keycaps?.repeat ?? 1) > 1" class="repeat">×{{ keycaps?.repeat }}</span>
      </div>

      <div v-if="isTask" class="task" :class="{ done: taskDone }">
        <span class="badge">{{ taskDone ? t('lesson.taskDone') : t('lesson.yourTurn') }}</span>
        <p v-if="feedback && !taskDone" class="feedback" role="status">{{ feedback }}</p>
        <p v-if="hintLevel > 0 && !taskDone" class="hint" role="status">{{ hints[hintLevel - 1] }}</p>
        <div v-if="!taskDone" class="task-actions">
          <button v-if="hintLevel < hints.length" type="button" class="chip" @click="hint">{{ t('action.hint') }}</button>
          <button v-if="solution && hintLevel > 0" type="button" class="chip" :disabled="showing" @click="showMe">
            {{ showing ? t('lesson.showing') : t('lesson.showMe') }}
          </button>
          <button v-if="!pickGoal" type="button" class="chip" :disabled="!canUndo || showing" @click="history?.undo()">
            ↶ {{ t('action.undo') }}
          </button>
          <button type="button" class="chip" :disabled="showing" @click="resetTask">⟲ {{ t('action.reset') }}</button>
        </div>
      </div>

      <nav class="transport">
        <div class="left">
          <button type="button" class="icon" :disabled="stepIndex === 0" :aria-label="t('action.back')" @click="back">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button type="button" class="icon play" :aria-label="playing ? t('player.pause') : t('player.play')" @click="togglePlay">
            <svg v-if="playing" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7 4.5v11M13 4.5v11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
            <svg v-else viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M6.5 4.2v11.6L15.5 10z" fill="currentColor" /></svg>
          </button>
          <button type="button" class="icon" :aria-label="t('action.replay')" @click="replay">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4.5 10a5.5 5.5 0 1 0 1.8-4.1M4.5 3.8v3h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <span class="count">{{ t('lesson.stepOf', { n: stepIndex + 1, total: lesson.steps.length }) }}</span>
        </div>
        <button
          type="button"
          class="primary next"
          :disabled="!canNext"
          :title="canNext ? undefined : t('lesson.taskLocked')"
          @click="next"
        >
          {{ isLastStep ? (isLastLesson ? t('lesson.finishCourse') : t('lesson.nextLesson')) : t('action.next') }}
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      </nav>
    </footer>

    <SettingsPanel
      v-if="showSettings"
      :locale="locale"
      :settings="settings"
      @change="changeSettings"
      @reset="onReset"
      @close="showSettings = false"
    />
    <span class="visually-hidden">{{ nextLesson ? text.lessons[nextLesson.id]?.title : '' }}</span>
  </div>
</template>

<style scoped>
.lesson {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100dvh;
}

/* ── Top bar ── */
.top {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: var(--gutter) var(--gutter) 0;
}
.titles {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}
.part {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--part);
  filter: saturate(0.9);
}
h1 {
  font-size: var(--step-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dots {
  display: flex;
  gap: 6px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}
.dots li {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--hairline);
  transition: all 0.25s var(--ease);
}
.dots li.is-task {
  border-radius: 2px;
}
.dots li.done {
  background: var(--part);
  border-color: var(--part);
}
.dots li.on {
  border-color: var(--ink);
  transform: scale(1.25);
}
.top > .icon:last-child {
  margin-left: 0;
}
.top > .dots + .icon {
  margin-left: 0.4rem;
}
.top > .titles + .icon {
  margin-left: auto;
}
.map,
.icon {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}
.icon:disabled {
  opacity: 0.35;
  cursor: default;
}
.icon.play {
  background: var(--ink);
  color: var(--surface);
  border-color: var(--ink);
}

/* ── Stage ── */
.stage {
  position: relative;
  min-height: 0;
}
.gate {
  position: absolute;
  inset: auto var(--gutter) var(--gutter);
  margin-inline: auto;
  max-width: 30rem;
  display: grid;
  gap: 0.7rem;
  justify-items: start;
  padding: 1.4rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.gate h2 {
  font-size: var(--step-2);
}
.gate p {
  margin: 0;
  color: var(--ink-soft);
}

/* ── Dock ── */
.dock {
  display: grid;
  gap: 0.85rem;
  padding: 0 var(--gutter) max(var(--gutter), env(safe-area-inset-bottom));
}
.speech {
  display: grid;
  gap: 0.35rem;
}
.notice {
  margin: 0;
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.keys {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.repeat {
  margin-left: 0.2rem;
  font-family: var(--font-mono);
  font-size: var(--step-1);
  color: var(--ink-soft);
}
.task {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0.9rem;
  padding: 0.7rem 0.8rem;
  border-left: 3px solid var(--part);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: color-mix(in oklab, var(--surface) 70%, transparent);
}
.task.done {
  border-color: var(--success);
}
.badge {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.task.done .badge {
  color: var(--success);
}
.feedback,
.hint {
  margin: 0;
  flex: 1 1 18rem;
  font-size: var(--step--1);
}
.hint {
  color: var(--ink);
}
.task-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-left: auto;
}
.chip {
  height: 2.4em;
  padding: 0 0.9em;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font-size: var(--step--1);
}
.chip:disabled {
  opacity: 0.45;
  cursor: default;
}
.transport {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}
.left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.count {
  margin-left: 0.4rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.9em;
  padding: 0 1.3em;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--surface);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.15s var(--ease), opacity 0.2s var(--ease);
}
.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.primary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .dots {
    display: none;
  }
  .top > .titles + .dots + .icon {
    margin-left: auto;
  }
  .count {
    display: none;
  }
}
</style>
