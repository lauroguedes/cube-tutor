<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { LESSONS, courseText } from '../course';
import { randomScramble, seededRandom } from '../engine/generate';
import { invertAlg } from '../engine/moves';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import type { CubeView } from '../render/CubeView';
import { audioBase, loadManifest, VOICES, type VoiceId } from '../tutor/narration';
import { loadProgress, nextLessonId, updateSettings } from '../tutor/progress';
import CubeStage from './CubeStage.vue';

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);
const text = courseText(props.locale);

const voice = ref<VoiceId>('female');
const resumeId = ref<string | null>(null);
const sampling = ref<VoiceId | null>(null);
let sample: HTMLAudioElement | null = null;
let view: CubeView | null = null;
let idle = 0;

const startHref = computed(() => localePath(props.locale, `/learn/${resumeId.value ?? LESSONS[0]!.id}`));

onMounted(() => {
  const p = loadProgress();
  voice.value = p.settings.voice;
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
  view = null;
  clearTimeout(idle);
  sample?.pause();
});
</script>

<template>
  <main class="home">
    <section class="copy">
      <p class="brand">{{ t('app.title') }}</p>
      <h1>{{ t('home.title') }}</h1>
      <p class="lede">{{ t('home.lede') }}</p>

      <fieldset class="voices">
        <legend>{{ t('home.chooseVoice') }}</legend>
        <div class="voice-row">
          <div v-for="v in VOICES" :key="v" class="voice" :class="{ on: voice === v }">
            <button type="button" class="pick" :aria-pressed="voice === v" @click="choose(v)">
              {{ t(v === 'female' ? 'settings.female' : 'settings.male') }}
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
.voices {
  border: 0;
  padding: 0;
  margin: 0.4rem 0 0;
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
.voice.on {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.pick {
  border: 0;
  background: none;
  height: 2.8em;
  padding: 0 0.6em 0 1.1em;
  font-weight: 700;
  cursor: pointer;
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
  text-underline-offset: 4px;
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
