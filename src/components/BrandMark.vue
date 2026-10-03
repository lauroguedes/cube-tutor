<script setup lang="ts">
import { LOGO_PATHS as P } from '../brand/logo';

// Logo symbol + wordmark. The side faces follow the theme ink, so the mark
// works on light and dark backgrounds; the top stays highlighter yellow.
withDefaults(defineProps<{ href?: string; label: string; wordmark?: boolean }>(), { wordmark: true });
</script>

<template>
  <component :is="href ? 'a' : 'span'" class="brand" :href="href" :aria-label="wordmark ? undefined : label">
    <svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
      <g stroke-linecap="round" stroke-linejoin="round">
        <path :d="P.left" class="left" />
        <path :d="P.right" class="right" />
        <path :d="P.top" class="top" />
        <path :d="`${P.gridLeft} ${P.gridRight}`" class="grid-side" />
        <path :d="P.gridTop" class="grid-top" />
        <path :d="`${P.outline} M32 33 L32 54 M13.81 22.5 L32 33 L50.19 22.5`" class="edge" />
      </g>
    </svg>
    <span v-if="wordmark" class="word">{{ label }}</span>
  </component>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.015em;
}
.mark {
  width: 1.75em;
  height: 1.75em;
  flex: none;
  transition: transform 0.35s var(--ease);
}
a.brand:hover .mark {
  transform: rotate(-12deg) scale(1.06);
}
.left {
  fill: var(--ink);
}
.right {
  fill: color-mix(in oklab, var(--ink) 78%, var(--surface));
}
.top {
  fill: var(--highlight);
}
.grid-side {
  fill: none;
  stroke: color-mix(in oklab, var(--surface) 35%, transparent);
  stroke-width: 1.3;
}
.grid-top {
  fill: none;
  stroke: rgb(21 22 26 / 0.55);
  stroke-width: 1.3;
}
.edge {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.6;
}
</style>
