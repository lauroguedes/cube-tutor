<script setup lang="ts">
import { LOGO } from '../brand/logo';

// Logo symbol + wordmark. The bubble follows the theme ink (its sticker
// holes show whatever is behind), so it works on light and dark backgrounds;
// the highlighted sticker stays yellow.
withDefaults(defineProps<{ href?: string; label: string; wordmark?: boolean }>(), { wordmark: true });
</script>

<template>
  <component :is="href ? 'a' : 'span'" class="brand" :href="href" :aria-label="wordmark ? undefined : label">
    <svg class="mark" :viewBox="LOGO.viewBox" aria-hidden="true">
      <path :d="LOGO.face" class="face" fill-rule="evenodd" />
      <rect v-bind="LOGO.accent" class="accent" />
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
.face {
  fill: var(--ink);
}
.accent {
  fill: var(--highlight);
  transform-box: fill-box;
  transform-origin: center;
}
/* Hovering the logo: the tutor "speaks" and the highlighted sticker pops. */
a.brand:hover .accent {
  animation: speak 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes speak {
  40% {
    transform: scale(1.35);
  }
}
</style>
