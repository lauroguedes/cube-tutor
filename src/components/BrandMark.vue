<script setup lang="ts">
import { LOGO } from '../brand/logo';

// Logo symbol + wordmark. The body follows the theme ink, so the mark works
// on light and dark backgrounds; the turning layer stays highlighter yellow.
withDefaults(defineProps<{ href?: string; label: string; wordmark?: boolean }>(), { wordmark: true });
</script>

<template>
  <component :is="href ? 'a' : 'span'" class="brand" :href="href" :aria-label="wordmark ? undefined : label">
    <svg class="mark" :viewBox="LOGO.viewBox" aria-hidden="true">
      <rect v-for="(r, i) in LOGO.rows" :key="i" v-bind="r" class="body" />
      <rect v-bind="LOGO.layer" class="layer" :style="{ '--turn': `${LOGO.turn}deg` }" />
    </svg>
    <span v-if="wordmark" class="word">{{ label }}</span>
  </component>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 650;
  letter-spacing: -0.02em;
}
.mark {
  width: 1.6em;
  height: 1.6em;
  flex: none;
  overflow: visible;
}
.body {
  fill: var(--ink);
}
.layer {
  fill: var(--highlight);
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(var(--turn));
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
/* Hovering the logo finishes the turn, a little cube move. */
a.brand:hover .layer {
  transform: rotate(-24deg);
}
</style>
