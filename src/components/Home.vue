<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { LESSONS, courseText } from '../course';
import { randomScramble, seededRandom } from '../engine/generate';
import { invertAlg } from '../engine/moves';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import type { CubeView } from '../render/CubeView';
import { CUBE_STYLES, STYLES, type CubeStyle } from '../render/palette';
import { audioBase, loadManifest, VOICES, type VoiceId } from '../tutor/narration';
import { loadProgress, nextLessonId, updateSettings, SETTINGS_EVENT, type Settings } from '../tutor/progress';
import CubeStage from './CubeStage.vue';
import SettingsMenu from './SettingsMenu.vue';

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);
const text = courseText(props.locale);

const voice = ref<VoiceId>('female');
const style = ref<CubeStyle>('classic');
const resumeId = ref<string | null>(null);
const sampling = ref<VoiceId | null>(null);
let sample: HTMLAudioElement | null = null;
let view: CubeView | null = null;
let idle = 0;

const startHref = computed(() => localePath(props.locale, `/learn/${resumeId.value ?? LESSONS[0]!.id}`));

/** A mini 3×3 face per style for the picker: the front of a solved cube with a twist. */
const PREVIEW = ['green', 'green', 'white', 'green', 'green', 'white', 'red', 'red', 'orange'] as const;
function previewColors(st: CubeStyle) {
  const spec = STYLES[st];
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  return { body: hex(spec.body), tiles: PREVIEW.map((c) => hex(spec.stickers[c])), gap: st === 'classic' ? '3px' : '1.5px' };
}

function chooseStyle(st: CubeStyle) {
  style.value = st;
  updateSettings({ style: st });
}

function onSettings(e: Event) {
  const s = (e as CustomEvent<Settings>).detail;
  voice.value = s.voice;
  style.value = s.style;
}

onMounted(() => {
  const p = loadProgress();
  voice.value = p.settings.voice;
  style.value = p.settings.style;
  window.addEventListener(SETTINGS_EVENT, onSettings);
  const started = p.completedSteps.length > 0;
  resumeId.value = started ? nextLessonId(p) : null;
});

function choose(v: VoiceId) {
  voice.value = v;
  updateSettings({ voice: v });
}

async function listen(v: VoiceId) {
  choose(v);
  sample?.pause();
  if (sampling.value === v) {
    sampling.value = null;
    return;
  }
  const manifest = await loadManifest(props.locale, v);
  const clip = manifest?.clips['welcome-try'];
  if (!clip) return;
  sample = new Audio(`${audioBase(props.locale, v)}/${clip.file}`);
  sampling.value = v;
  sample.addEventListener('ended', () => (sampling.value = null));
  sample.play().catch(() => (sampling.value = null));
}

// A slow, gentle demo: the cube scrambles and solves itself in the background,
// until the visitor starts turning it themselves.
let demoStopped = false;

function onReady(v: CubeView) {
  view = v;
  v.interaction.turns = true;
  v.autoRotate = true;
  v.speed = 0.8;
  v.on('turnstart', () => {
    demoStopped = true;
    clearTimeout(idle);
    v.autoRotate = false;
  });
  const random = seededRandom(7);
  const loop = async () => {
    if (!view || demoStopped) return;
    const moves = randomScramble(6, random);
    await view.play(moves, { duration: 0.42 });
    idle = window.setTimeout(async () => {
      if (!view || demoStopped) return;
      await view.play(invertAlg(moves), { duration: 0.42 });
      idle = window.setTimeout(loop, 1600);
    }, 1400);
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) idle = window.setTimeout(loop, 900);
}

onBeforeUnmount(() => {
  window.removeEventListener(SETTINGS_EVENT, onSettings);
  view = null;
  clearTimeout(idle);
  sample?.pause();
});
</script>

<template>
  <main class="home fx-mount">
    <div class="corner"><SettingsMenu :locale="locale" /></div>
    <section class="copy">
      <p class="brand">{{ t('app.title') }}</p>
      <h1>{{ t('home.title') }}</h1>
      <p class="lede">{{ t('home.lede') }}</p>

      <fieldset class="voices">
        <legend>{{ t('home.chooseVoice') }}</legend>
        <div class="voice-row">
          <div v-for="v in VOICES" :key="v" class="voice" :class="{ on: voice === v }">
            <button type="button" class="pick" :aria-pressed="voice === v" @click="choose(v)">
              <span class="name">{{ t(v === 'female' ? 'settings.female' : 'settings.male') }}</span>
              <span class="kind">{{ t(v === 'female' ? 'settings.femaleHint' : 'settings.maleHint') }}</span>
            </button>
            <button
              type="button"
              class="sample"
              :aria-label="`${t('home.listen')}: ${t(v === 'female' ? 'settings.female' : 'settings.male')}`"
              @click="listen(v)"
            >
              <svg v-if="sampling === v" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M6 4.5v11M14 4.5v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
              <svg v-else viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M6 4v12l10-6z" fill="currentColor" /></svg>
            </button>
          </div>
        </div>
      </fieldset>

      <fieldset class="styles">
        <legend>{{ t('home.chooseStyle') }}</legend>
        <div class="style-row">
          <button
            v-for="st in CUBE_STYLES"
            :key="st"
            type="button"
            class="style"
            :class="{ on: style === st }"
            :aria-pressed="style === st"
            @click="chooseStyle(st)"
          >
            <span
              class="swatch"
              :style="{ background: previewColors(st).body, gap: previewColors(st).gap, padding: previewColors(st).gap }"
              aria-hidden="true"
            >
              <span v-for="(c, i) in previewColors(st).tiles" :key="i" :style="{ background: c }" />
            </span>
            {{ t(`style.${st}`) }}
          </button>
        </div>
      </fieldset>

      <div class="cta">
        <a class="primary" :href="startHref">
          {{ resumeId ? t('home.continue', { lesson: text.lessons[resumeId]?.title ?? '' }) : t('home.start') }}
        </a>
        <a class="secondary" :href="localePath(locale, '/learn')">{{ t('home.allLessons') }}</a>
      </div>
      <p class="what">{{ t('home.what') }} <a :href="localePath(locale, '/play')">{{ t('home.freePlay') }}</a></p>
    </section>

    <div class="cube">
      <CubeStage :label="t('cube.label')" @ready="onReady">
        <template #fallback>{{ t('cube.noWebgl') }}</template>
      </CubeStage>
    </div>
  </main>
</template>

<style scoped>
.home {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  min-height: 100dvh;
  max-width: 76rem;
  margin: 0 auto;
  padding: var(--gutter);
  gap: var(--gutter);
}
.copy {
  display: grid;
  gap: 1.3rem;
  justify-items: start;
}
.brand {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
}
h1 {
  font-size: clamp(2.6rem, 1.6rem + 4.5vw, 5.4rem);
  font-weight: 700;
  font-variation-settings: 'opsz' 96;
  letter-spacing: -0.035em;
  line-height: 0.95;
  max-width: 10ch;
}
.lede {
  margin: 0;
  font-size: var(--step-1);
  color: var(--ink-soft);
  max-width: 34ch;
}
.corner {
  position: absolute;
  top: var(--gutter);
  right: var(--gutter);
  z-index: 5;
}
.voices,
.styles {
  border: 0;
  padding: 0;
  margin: 0.2rem 0 0;
}
.style-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.style {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  height: 3em;
  padding: 0 1em 0 0.45em;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.2s var(--ease),
    box-shadow 0.2s var(--ease),
    background-color 0.2s var(--ease);
}
.style:hover {
  border-color: var(--ink-soft);
  background-color: color-mix(in oklab, var(--surface) 85%, var(--ink));
}
.style.on {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.swatch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 2.1em;
  height: 2.1em;
  border-radius: 7px;
  transition: transform 0.25s var(--ease);
}
.style:hover .swatch {
  transform: rotate(-8deg) scale(1.06);
}
.swatch span {
  border-radius: 2.5px;
}
legend {
  font-size: var(--step--1);
  color: var(--ink-soft);
  margin-bottom: 0.5rem;
}
.voice-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.voice {
  display: flex;
  align-items: center;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.voice:hover {
  border-color: var(--ink-soft);
}
.voice.on {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.pick {
  display: grid;
  justify-items: start;
  line-height: 1.1;
  border: 0;
  background: none;
  height: 3em;
  padding: 0 0.6em 0 1.1em;
  cursor: pointer;
}
.name {
  font-weight: 700;
}
.kind {
  font-size: 0.72em;
  color: var(--ink-soft);
}
.sample {
  display: grid;
  place-items: center;
  width: 2.2em;
  height: 2.2em;
  margin-right: 0.3em;
  border: 0;
  border-radius: 50%;
  background: var(--sweep);
  cursor: pointer;
  transition:
    background-color 0.18s var(--ease),
    transform 0.12s var(--ease);
}
.sample:hover {
  background: color-mix(in oklab, var(--sweep) 75%, var(--ink));
}
.sample:active {
  transform: scale(0.92);
}
.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  margin-top: 0.4rem;
}
.primary {
  height: 3.2em;
  padding: 0 1.5em;
}
.secondary {
  color: var(--ink);
}
.what {
  margin: 0;
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.what a {
  color: inherit;
}
.cube {
  height: min(78vh, 720px);
  min-height: 320px;
}
@media (max-width: 820px) {
  .home {
    grid-template-columns: 1fr;
    align-content: start;
  }
  .cube {
    order: -1;
    height: 42vh;
    min-height: 260px;
  }
}
</style>
