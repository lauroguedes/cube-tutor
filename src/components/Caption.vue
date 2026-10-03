<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { Word } from '../tutor/script';

// The tutor's words, with a highlighter sweeping across each word as it's
// spoken. Only the current sentence is shown, so the line stays short.

const props = defineProps<{ words: readonly Word[]; current: number }>();

/** Sentence ranges as [firstWord, lastWord] index pairs. */
const sentences = computed(() => {
  const out: [number, number][] = [];
  let start = 0;
  props.words.forEach((w, i) => {
    if (/[.!?]["”’)]*$/.test(w.text) || i === props.words.length - 1) {
      out.push([start, i]);
      start = i + 1;
    }
  });
  return out;
});

const sentence = computed(() => {
  const cur = Math.max(0, props.current);
  return sentences.value.find(([a, b]) => cur >= a && cur <= b) ?? sentences.value[0] ?? [0, -1];
});

const visible = computed(() => {
  const [a, b] = sentence.value;
  return props.words.slice(a, b + 1).map((w, k) => ({ text: w.text, index: a + k }));
});

const line = ref<HTMLElement | null>(null);
watch(sentence, async () => {
  await nextTick();
  line.value?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], {
    duration: 260,
    easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  });
});
</script>

<template>
  <p ref="line" class="caption">
    <template v-for="w in visible" :key="w.index">
      <span class="word" :class="{ said: w.index < current, now: w.index === current }">{{ w.text }}</span>{{ ' ' }}
    </template>
  </p>
</template>

<style scoped>
.caption {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 520;
  line-height: 1.28;
  letter-spacing: -0.012em;
  text-wrap: balance;
  max-width: 34ch;
  min-height: 2.6em;
}
.word {
  color: var(--ink-soft);
  transition: color 0.2s var(--ease);
  background-image: linear-gradient(var(--highlight), var(--highlight));
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0% 38%;
  border-radius: 2px;
}
.word.said {
  color: var(--ink);
}
.word.now {
  color: var(--ink);
  background-size: 100% 38%;
  transition:
    color 0.2s var(--ease),
    background-size 0.32s var(--ease);
}
@media (prefers-color-scheme: dark) {
  .word.now {
    color: var(--ink);
    background-size: 100% 18%;
    background-position: 0 100%;
  }
}
</style>
