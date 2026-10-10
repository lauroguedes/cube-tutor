<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
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
  SETTINGS_EVENT,
  type Settings,
} from '../tutor/progress';
import { parseScript, type Word } from '../tutor/script';
import { parseSelectorText, resolveSelector } from '../tutor/selectors';
import Caption from './Caption.vue';
import CubeStage from './CubeStage.vue';
import MoveKey from './MoveKey.vue';
import SettingsMenu from './SettingsMenu.vue';
import ShopLink from './ShopLink.vue';
import StoryScene from './StoryScene.vue';
import type { SceneRef } from '../tutor/scenes';

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

// client:only island, so storage is readable here: no flash of the wrong start card.
const unlocked = ref(isLessonUnlocked(props.lessonId));
const started = ref(false);
const stepIndex = ref(0);
const settings = ref<Settings>(loadProgress().settings);
const completed = ref<string[]>(loadProgress().completedSteps);
const stageEl = ref<HTMLElement | null>(null);
const menu = ref<InstanceType<typeof SettingsMenu> | null>(null);

const words = ref<readonly Word[]>([]);
const currentWord = ref(-1);
const keys = ref<{ alg: string; active: number } | null>(null);
const playing = ref(false);
const narrationEnded = ref(false);
const scene = ref<SceneRef | null>(null);
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
/** Time to move on: draw attention to Next. */
const nudge = computed(
  () => started.value && canNext.value && !showing.value && (isTask.value ? taskDone.value : narrationEnded.value),
);

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
  scene.value = null;

  v.cancelTurns();
  taskStart = startState(step.value.setup);
  v.setState(taskStart);
  history.value?.clear();
  applySetupVisuals();

  // Tasks can be tried straight away; explanations lock the cube while the tutor talks.
  v.interaction.turns = isTask.value && step.value.goal?.kind !== 'pick';
  v.interaction.pick = step.value.goal?.kind === 'pick';
  v.interaction.orbit = true;
  updateFraming();

  // No manifest yet (e.g. a network blip at start): this step uses captions, the next ones retry.
  if (!manifest.value) void loadManifest(props.locale, settings.value.voice).then((m) => (manifest.value = m));

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
  p.on('scene', (sc) => {
    scene.value = sc;
    updateFraming();
  });
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

// ─── Settings (changed from the gear menu, broadcast on window) ─────────────
async function onSettings(e: Event) {
  const next = (e as CustomEvent<Settings>).detail;
  const prev = settings.value;
  settings.value = next;
  if (next.rate !== prev.rate) player.value?.setRate(next.rate);
  if (next.muted !== prev.muted) {
    player.value?.setMuted(next.muted);
    if (next.muted) audioMissing.value = false;
  }
  if (next.voice !== prev.voice && started.value) {
    manifest.value = await loadManifest(props.locale, next.voice);
    if (!isTask.value || !taskDone.value) replay();
  }
}

// ─── Layout: keep the cube clear of the task rail ───────────────────────────
function updateFraming() {
  const v = view.value;
  const el = stageEl.value;
  if (!v || !el) return;
  const wide = el.clientWidth >= 720;
  // A story scene takes one side (wide) or the top (narrow).
  if (started.value && scene.value) return v.setFraming(wide ? { x: 0.22, zoom: 1.12 } : { y: 0.22, zoom: 1.55 });
  if (!started.value || !isTask.value) return v.setFraming({});
  v.setFraming(wide ? { x: -0.1 } : { y: -0.1, zoom: 1.12 });
}
let resizeObserver: ResizeObserver | null = null;
watch(isTask, updateFraming);

// ─── Keyboard ───────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (!started.value || menu.value?.isOpen()) return;
  const target = e.target instanceof Element ? e.target : null;
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
  window.addEventListener('keydown', onKey);
  window.addEventListener(SETTINGS_EVENT, onSettings);
  if (stageEl.value) {
    resizeObserver = new ResizeObserver(updateFraming);
    resizeObserver.observe(stageEl.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener(SETTINGS_EVENT, onSettings);
  resizeObserver?.disconnect();
  disposePlayer();
  history.value?.dispose();
});

const partColor = `var(--part-${lesson.part})`;
const nextLesson = LESSONS[lessonNumber];
const resumeId = computed(() => (unlocked.value ? null : nextLessonId()));
</script>

<template>
  <div class="lesson fx-mount" :style="{ '--part': partColor }">
    <header class="top">
      <a class="icon-btn" :href="localePath(locale, '/learn')" :aria-label="t('lesson.allLessons')">
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
      <SettingsMenu ref="menu" :locale="locale" />
    </header>

    <div ref="stageEl" class="stage">
      <CubeStage :label="t('cube.label')" @ready="onReady">
        <template #fallback>{{ t('cube.noWebgl') }}</template>
      </CubeStage>

      <div v-if="started && unlocked" class="story-layer">
        <StoryScene :scene="scene" :locale="locale" />
      </div>

      <!-- Task rail: status and hints above the actions, beside the cube. -->
      <Transition name="fx">
        <aside v-if="started && unlocked && !courseFinished && isTask" :key="step.id" class="rail">
          <div class="alert" :class="{ done: taskDone }" role="status">
            <p class="badge">
              <svg v-if="taskDone" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path d="M4.5 10.5 8.2 14l7.3-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span v-else class="pulse-dot" aria-hidden="true" />
              {{ taskDone ? t('lesson.taskDone') : t('lesson.yourTurn') }}
            </p>
            <Transition name="fx" mode="out-in">
              <p v-if="feedback && !taskDone" :key="`f-${feedback}`" class="note">{{ feedback }}</p>
              <p v-else-if="hintLevel > 0 && !taskDone" :key="`h-${hintLevel}`" class="note hint">{{ hints[hintLevel - 1] }}</p>
            </Transition>
          </div>

          <Transition name="fx">
            <div v-if="!taskDone" class="actions">
              <button v-if="hintLevel < hints.length" type="button" class="chip" @click="hint">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <path d="M7.5 15.5h5M8.3 18h3.4M10 2.5a5 5 0 0 0-3 9c.7.6 1 1.2 1 2h4c0-.8.3-1.4 1-2a5 5 0 0 0-3-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="label">{{ t('action.hint') }}</span>
              </button>
              <button v-if="solution && hintLevel > 0" type="button" class="chip" :disabled="showing" @click="showMe">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <path d="M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                  <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6" />
                </svg>
                <span class="label">{{ showing ? t('lesson.showing') : t('lesson.showMe') }}</span>
              </button>
              <button v-if="!pickGoal" type="button" class="chip" :disabled="!canUndo || showing" @click="history?.undo()">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <path d="M7.5 5 3.5 9l4 4M4 9h7.5a4.5 4.5 0 0 1 0 9H9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="label">{{ t('action.undo') }}</span>
              </button>
              <button type="button" class="chip" :disabled="showing" @click="resetTask">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <path d="M3.5 10a6.5 6.5 0 1 0 2-4.7M3.5 3v3.8h3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="label">{{ t('action.reset') }}</span>
              </button>
            </div>
          </Transition>
        </aside>
      </Transition>

      <Transition name="fx">
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
          <div class="gate-actions">
            <button type="button" class="primary" :disabled="!view" @click="start">{{ t('lesson.start') }}</button>
            <!-- The tutor suggests following along with a real cube. -->
            <ShopLink v-if="lesson.id === 'welcome'" :locale="locale" variant="button" />
          </div>
        </div>
        <div v-else-if="courseFinished" class="gate">
          <h2>{{ t('lesson.finishCourse') }}</h2>
          <p>{{ t('lesson.courseDone') }}</p>
          <div class="gate-actions">
            <a class="primary" :href="localePath(locale, '/play')">{{ t('home.freePlay') }}</a>
            <ShopLink :locale="locale" variant="button" />
          </div>
        </div>
      </Transition>
    </div>

    <Transition name="fx">
      <footer v-if="started && unlocked && !courseFinished" class="dock">
        <div class="speech" aria-live="polite">
          <Caption :words="words" :current="currentWord" />
          <Transition name="fx">
            <p v-if="audioMissing" class="notice">{{ t('lesson.noAudio') }}</p>
          </Transition>
        </div>

        <Transition name="fx">
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
        </Transition>

        <nav class="transport">
          <div class="left">
            <button type="button" class="icon-btn" :disabled="stepIndex === 0" :aria-label="t('action.back')" @click="back">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
            <button type="button" class="icon-btn solid" :aria-label="playing ? t('player.pause') : t('player.play')" @click="togglePlay">
              <svg v-if="playing" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7 4.5v11M13 4.5v11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
              <svg v-else viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M6.5 4.2v11.6L15.5 10z" fill="currentColor" /></svg>
            </button>
            <button type="button" class="icon-btn" :aria-label="t('action.replay')" @click="replay">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4.5 10a5.5 5.5 0 1 0 1.8-4.1M4.5 3.8v3h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
            <span class="count">{{ t('lesson.stepOf', { n: stepIndex + 1, total: lesson.steps.length }) }}</span>
          </div>
          <button
            type="button"
            class="primary next"
            :class="{ nudge }"
            :disabled="!canNext"
            :title="canNext ? undefined : t('lesson.taskLocked')"
            @click="next"
          >
            {{ isLastStep ? (isLastLesson ? t('lesson.finishCourse') : t('lesson.nextLesson')) : t('action.next') }}
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </nav>
      </footer>
    </Transition>

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
  margin-right: auto;
}
.part {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--part);
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
  margin: 0 0.3rem 0 0;
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
.gate-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

/* ── Story scenes (history) ── */
.story-layer {
  position: absolute;
  top: 50%;
  left: var(--gutter);
  translate: 0 -50%;
  width: min(30rem, 46%);
  pointer-events: none;
}

/* ── Task rail ── */
.rail {
  position: absolute;
  top: 50%;
  right: var(--gutter);
  translate: 0 -50%;
  width: min(17.5rem, 38%);
  display: grid;
  gap: 0.7rem;
  justify-items: end;
}
.alert {
  width: 100%;
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--part);
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
  background: var(--part);
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
  font-size: var(--step--1);
  line-height: 1.45;
  color: var(--ink-soft);
}
.note.hint {
  color: var(--ink);
}
.actions {
  display: grid;
  gap: 0.45rem;
  justify-items: end;
}
.actions .chip {
  background: color-mix(in oklab, var(--surface) 90%, transparent);
  backdrop-filter: blur(8px);
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

/* Next: a bouncing highlighter halo behind it when it's time to move on. */
.next.nudge {
  animation:
    hop 1.8s var(--ease) infinite,
    halo 1.8s cubic-bezier(0.22, 0.9, 0.36, 1) infinite;
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
@keyframes hop {
  0%,
  50%,
  100% {
    transform: translateY(0);
  }
  12% {
    transform: translateY(-6px);
  }
  24% {
    transform: translateY(0);
  }
  32% {
    transform: translateY(-2.5px);
  }
  40% {
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .story-layer {
    top: 0.4rem;
    left: var(--gutter);
    right: var(--gutter);
    width: auto;
    translate: none;
  }
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
}

@media (max-width: 560px) {
  .dots,
  .count {
    display: none;
  }
}
</style>
