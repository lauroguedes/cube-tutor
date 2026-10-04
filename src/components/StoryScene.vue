<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { courseText } from '../course';
import { LOCALES, type Locale } from '../i18n/ui';
import { useTranslations } from '../i18n/utils';
import type { SceneRef } from '../tutor/scenes';

// Animated explainers that illustrate a story beside the cube. The tutor's
// {{scene}} cues pick which one shows; parts (timeline:2) reveal more of it.

const props = defineProps<{ scene: SceneRef | null; locale: Locale }>();
const t = useTranslations(props.locale);
const text = courseText(props.locale);

const PATTERNS = '43,252,003,274,489,856,000'.split(',');
// Digit grouping and decimal mark follow the language (43,252… vs 43.252…).
const format = new Intl.NumberFormat(LOCALES[props.locale].lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GROUP = format.formatToParts(1_000_000).find((p) => p.type === 'group')?.value ?? ',';
const STICKERS = ['#16a34a', '#f2f2ee', '#c81e32', '#1d4ed8', '#ffd23a', '#f26a1b', '#f2f2ee', '#16a34a', '#c81e32'];
const METHOD_LESSONS = ['daisy', 'cross', 'corners', 'middle', 'yellow-cross', 'yellow-corners', 'twist-corners', 'last-edges'];
const METHOD_COLORS = ['#ffd23a', '#f2f2ee', '#f2f2ee', '#16a34a', '#ffd23a', '#f26a1b', '#c81e32', '#1d4ed8'];
const TIMELINE = [
  { year: '1974', key: 'scene.timeline.1974' },
  { year: '1977', key: 'scene.timeline.1977' },
  { year: '1980', key: 'scene.timeline.1980' },
] as const;

const name = computed(() => props.scene?.name ?? null);
const part = computed(() => props.scene?.part ?? 1);

// Stopwatch for the 1982 championship: counts up to 22.95 s.
const WINNING_TIME = 22.95;
const clock = ref(0);
let raf = 0;
function runClock() {
  cancelAnimationFrame(raf);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clock.value = WINNING_TIME;
    return;
  }
  const start = performance.now();
  const duration = 2400;
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / duration);
    clock.value = WINNING_TIME * (1 - Math.pow(1 - k, 3));
    if (k < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
watch(name, (n) => {
  if (n === 'championship') runClock();
});
onBeforeUnmount(() => cancelAnimationFrame(raf));

const RING = 2 * Math.PI * 44;
</script>

<template>
  <div class="story" aria-live="off">
    <Transition name="fx" mode="out-in">
      <!-- 1974 -->
      <section v-if="name === 'year'" key="year" class="scene">
        <p class="eyebrow">{{ t('scene.year.eyebrow') }}</p>
        <p class="giant year">
          <span v-for="(d, i) in '1974'" :key="i" class="rise" :style="{ '--i': i }">{{ d }}</span>
        </p>
        <span class="sweep" />
        <p class="caption">{{ t('scene.year.caption') }}</p>
      </section>

      <!-- The inventor -->
      <section v-else-if="name === 'rubik'" key="rubik" class="scene">
        <p class="eyebrow">{{ t('scene.rubik.eyebrow') }}</p>
        <div class="inventor">
          <svg class="compass" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="draw" cx="40" cy="12" r="5" />
            <path class="draw" d="M37 17 18 70M43 17 62 70M24 54h32" />
            <path class="draw arc" d="M14 72a30 30 0 0 1 52 0" />
          </svg>
          <div>
            <h3 class="name">{{ t('scene.rubik.name') }}</h3>
            <p class="caption">{{ t('scene.rubik.role') }}</p>
          </div>
        </div>
      </section>

      <!-- The prototype -->
      <section v-else-if="name === 'blocks'" key="blocks" class="scene">
        <p class="eyebrow">{{ t('scene.blocks.eyebrow') }}</p>
        <div class="blocks">
          <span v-for="(c, i) in STICKERS" :key="i" class="tile pop" :style="{ '--i': i, background: c }" />
        </div>
        <p class="big">{{ t('scene.blocks.big') }}</p>
        <p class="caption">{{ t('scene.blocks.caption') }}</p>
      </section>

      <!-- A month -->
      <section v-else-if="name === 'month'" key="month" class="scene">
        <p class="eyebrow">{{ t('scene.month.eyebrow') }}</p>
        <div class="calendar" aria-hidden="true">
          <span v-for="i in 30" :key="i" class="day" :style="{ '--i': i }" />
        </div>
        <p class="big">{{ t('scene.month.big') }}</p>
        <p class="caption">{{ t('scene.month.caption') }}</p>
      </section>

      <!-- Timeline -->
      <section v-else-if="name === 'timeline'" key="timeline" class="scene">
        <p class="eyebrow">{{ t('scene.timeline.eyebrow') }}</p>
        <ol class="timeline" :style="{ '--progress': (part - 1) / (TIMELINE.length - 1) }">
          <li v-for="(ev, i) in TIMELINE" :key="ev.year" :class="{ shown: i < part, now: i === part - 1 }">
            <span class="dot" />
            <span class="when">{{ ev.year }}</span>
            <span class="what">{{ t(ev.key) }}</span>
          </li>
        </ol>
      </section>

      <!-- 43 quintillion -->
      <section v-else-if="name === 'patterns'" key="patterns" class="scene">
        <p class="eyebrow">{{ t('scene.patterns.eyebrow') }}</p>
        <p class="number">
          <template v-for="(g, i) in PATTERNS" :key="i">
            <span class="rise" :style="{ '--i': i }">{{ g }}</span><span v-if="i < PATTERNS.length - 1" class="comma rise" :style="{ '--i': i }">{{ GROUP }}</span>
          </template>
        </p>
        <p class="caption">{{ t('scene.patterns.caption') }}</p>
      </section>

      <!-- Age of the universe -->
      <section v-else-if="name === 'universe'" key="universe" class="scene">
        <p class="eyebrow">{{ t('scene.universe.eyebrow') }}</p>
        <div class="bars">
          <div class="bar-row">
            <span class="bar-label">{{ t('scene.universe.age') }}</span>
            <span class="bar"><span class="fill small" /></span>
            <span class="bar-value">{{ t('scene.universe.ageValue') }}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">{{ t('scene.universe.all') }}</span>
            <span class="bar"><span class="fill full" /></span>
            <span class="bar-value strong">{{ t('scene.universe.allValue') }}</span>
          </div>
        </div>
      </section>

      <!-- Only one -->
      <section v-else-if="name === 'one'" key="one" class="scene">
        <p class="eyebrow">{{ t('scene.one.eyebrow') }}</p>
        <div class="one">
          <span class="ring" />
          <span class="giant">1</span>
        </div>
        <p class="caption big-caption">{{ t('scene.one.caption') }}</p>
      </section>

      <!-- 1982 championship -->
      <section v-else-if="name === 'championship'" key="championship" class="scene">
        <p class="eyebrow">{{ t('scene.championship.eyebrow') }}</p>
        <div class="watch">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="track" cx="50" cy="50" r="44" />
            <circle
              class="progress"
              cx="50"
              cy="50"
              r="44"
              :stroke-dasharray="RING"
              :stroke-dashoffset="RING * (1 - clock / 60)"
            />
          </svg>
          <span class="time">{{ format.format(clock) }}<small>s</small></span>
        </div>
        <p class="caption">{{ t('scene.championship.caption') }}</p>
      </section>

      <!-- God's number -->
      <section v-else-if="name === 'gods-number'" key="gods" class="scene">
        <p class="eyebrow">{{ t('scene.gods.eyebrow') }}</p>
        <p class="giant">20</p>
        <div class="moves" aria-hidden="true">
          <span v-for="i in 20" :key="i" class="move-dot" :style="{ '--i': i }" />
        </div>
        <p class="caption">{{ t('scene.gods.caption') }}</p>
      </section>

      <!-- The method -->
      <section v-else-if="name === 'method'" key="method" class="scene">
        <p class="eyebrow">{{ t('scene.method.eyebrow') }}</p>
        <ol class="steps">
          <li v-for="(id, i) in METHOD_LESSONS" :key="id" class="pop" :style="{ '--i': i }">
            <span class="swatch" :style="{ background: METHOD_COLORS[i] }" />
            {{ text.lessons[id]?.title }}
          </li>
        </ol>
        <p class="caption">{{ t('scene.method.caption') }}</p>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.story {
  pointer-events: none;
}
.scene {
  display: grid;
  gap: 0.7rem;
  justify-items: start;
  max-width: 27rem;
}
.eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--part, var(--ink-soft));
}
.giant {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 3rem + 7vw, 8.5rem);
  font-weight: 700;
  line-height: 0.86;
  letter-spacing: -0.05em;
  font-variation-settings: 'opsz' 96;
}
.big {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}
.caption {
  margin: 0;
  font-size: var(--step-0);
  color: var(--ink-soft);
  max-width: 30ch;
}
.big-caption {
  font-family: var(--font-display);
  font-size: var(--step-2);
  color: var(--ink);
}

/* Shared entrance motions */
.rise {
  display: inline-block;
  animation: rise 0.7s var(--ease) both;
  animation-delay: calc(var(--i, 0) * 90ms);
}
@keyframes rise {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(0.35em);
  }
}
.pop {
  animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

/* 1974 */
.sweep {
  display: block;
  width: 11rem;
  height: 0.5rem;
  border-radius: 3px;
  background: var(--highlight);
  transform-origin: left;
  animation: sweep 0.8s var(--ease) 0.45s both;
}
@keyframes sweep {
  from {
    transform: scaleX(0);
  }
}

/* Inventor */
.inventor {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}
.compass {
  width: 4.6rem;
  height: 4.6rem;
  flex: none;
}
.draw {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 140;
  stroke-dashoffset: 140;
  animation: draw 1.2s var(--ease) forwards;
}
.draw.arc {
  stroke: var(--highlight);
  animation-delay: 0.5s;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
.name {
  font-size: var(--step-3);
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* Prototype */
.blocks {
  display: grid;
  grid-template-columns: repeat(3, 2.2rem);
  gap: 4px;
  padding: 5px;
  border-radius: 10px;
  background: #0e0e10;
}
.tile {
  height: 2.2rem;
  border-radius: 5px;
}

/* Month */
.calendar {
  display: grid;
  grid-template-columns: repeat(10, 1.1rem);
  gap: 5px;
}
.day {
  height: 1.1rem;
  border-radius: 3px;
  border: 1.5px solid var(--hairline);
  animation: fill-day 0.25s var(--ease) both;
  animation-delay: calc(var(--i) * 55ms);
}
@keyframes fill-day {
  from {
    background: transparent;
  }
  to {
    background: var(--ink);
    border-color: var(--ink);
  }
}

/* Timeline */
.timeline {
  position: relative;
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0 0 0 1.6rem;
  display: grid;
  gap: 1.3rem;
}
.timeline::before,
.timeline::after {
  content: '';
  position: absolute;
  left: 0.42rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  background: var(--hairline);
}
.timeline::after {
  background: var(--highlight);
  transform-origin: top;
  transform: scaleY(var(--progress));
  transition: transform 0.7s var(--ease);
}
.timeline li {
  position: relative;
  display: grid;
  grid-template-columns: 4.2rem 1fr;
  align-items: baseline;
  gap: 0.6rem;
  opacity: 0.18;
  filter: blur(3px);
  transition:
    opacity 0.5s var(--ease),
    filter 0.5s var(--ease);
}
.timeline li.shown {
  opacity: 1;
  filter: none;
}
.dot {
  position: absolute;
  left: -1.6rem;
  top: 0.45rem;
  z-index: 1;
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 50%;
  border: 2px solid var(--hairline);
  background: var(--sweep);
  transition: all 0.4s var(--ease);
}
.timeline li.shown .dot {
  border-color: var(--ink);
  background: var(--ink);
}
.timeline li.now .dot {
  background: var(--highlight);
  border-color: var(--highlight);
  box-shadow: 0 0 0 6px color-mix(in oklab, var(--highlight) 30%, transparent);
}
.when {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 700;
}
.what {
  color: var(--ink-soft);
}
.timeline li.now .what {
  color: var(--ink);
}

/* 43 quintillion */
.number {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 1.2rem + 2.6vw, 3.2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
}
.number .rise:first-child {
  background: linear-gradient(var(--highlight), var(--highlight)) no-repeat 0 92% / 100% 30%;
}

/* Universe */
.bars {
  display: grid;
  gap: 1rem;
  width: min(26rem, 100%);
}
.bar-row {
  display: grid;
  gap: 0.3rem;
}
.bar-label {
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.bar {
  height: 0.8rem;
  border-radius: 999px;
  background: var(--hover);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transform-origin: left;
  animation: grow 1.4s var(--ease) both;
}
.fill.small {
  width: 1.5%;
  background: var(--ink-soft);
  animation-delay: 0.2s;
}
.fill.full {
  width: 100%;
  background: var(--highlight);
  animation-delay: 0.7s;
  animation-duration: 2.2s;
}
@keyframes grow {
  from {
    transform: scaleX(0);
  }
}
.bar-value {
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
.bar-value.strong {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 700;
}

/* One */
.one {
  position: relative;
  display: grid;
  place-items: center;
  width: 9rem;
  height: 9rem;
}
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--highlight);
  animation: ring 2s var(--ease) infinite;
}
@keyframes ring {
  0% {
    transform: scale(0.85);
    opacity: 1;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

/* Stopwatch */
.watch {
  position: relative;
  width: 10rem;
  height: 10rem;
  display: grid;
  place-items: center;
}
.watch svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}
.track,
.progress {
  fill: none;
  stroke-width: 5;
}
.track {
  stroke: var(--hover);
}
.progress {
  stroke: var(--highlight);
  stroke-linecap: round;
}
.time {
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.time small {
  font-size: 0.45em;
  margin-left: 0.1em;
  color: var(--ink-soft);
}

/* God's number */
.moves {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 16rem;
}
.move-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--ink);
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 60ms + 0.2s);
}

/* Method */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  max-width: 26rem;
}
.steps li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem 0.35rem 0.4rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: color-mix(in oklab, var(--surface) 85%, transparent);
  font-size: var(--step--1);
  font-weight: 700;
}
.swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
}

@media (max-width: 720px) {
  .giant {
    font-size: clamp(3.2rem, 2rem + 8vw, 4.6rem);
  }
  .scene {
    gap: 0.45rem;
  }
  .compass {
    width: 3.2rem;
    height: 3.2rem;
  }
  .watch,
  .one {
    width: 6.5rem;
    height: 6.5rem;
  }
}
</style>
