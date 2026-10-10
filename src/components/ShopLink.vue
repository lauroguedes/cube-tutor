<script setup lang="ts">
import { SHOP_URLS } from '../brand/project';
import type { Locale } from '../i18n/ui';
import { useTranslations } from '../i18n/utils';

// "Get a real cube": an affiliate link, shown only in languages that have a
// store in SHOP_URLS. Marked rel="sponsored" and labelled as an affiliate link.

const props = withDefaults(defineProps<{ locale: Locale; variant?: 'pill' | 'button' }>(), { variant: 'pill' });
const t = useTranslations(props.locale);
const url = SHOP_URLS[props.locale];
</script>

<template>
  <a v-if="url" :href="url" class="shop" :class="variant" target="_blank" rel="sponsored noopener">
    <!-- A small cube -->
    <svg class="cube" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.5 17 6.3v7.4L10 17.5 3 13.7V6.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M3 6.3 10 10l7-3.7M10 10v7.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    </svg>
    <span class="label">{{ t('shop.cta') }}</span>
    <span class="tail">
      <span class="note">· {{ t('shop.note') }}</span>
      <svg class="out" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 13 13.5 6.5M8 6.5h5.5V12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </a>
</template>

<style scoped>
.shop {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 0.45rem;
  max-width: 100%;
  color: var(--ink);
  text-decoration: none;
  transition:
    background-color 0.18s var(--ease),
    border-color 0.18s var(--ease),
    transform 0.12s var(--ease);
}
.cube {
  width: 1.1em;
  height: 1.1em;
  flex: none;
}
.out {
  width: 1em;
  height: 1em;
  flex: none;
  color: var(--ink-soft);
  transition: transform 0.18s var(--ease);
}
.shop:hover .out {
  transform: translate(1px, -1px);
}
.label {
  font-weight: 700;
  white-space: nowrap;
}
/* The affiliate disclosure is always visible; with the arrow it moves to
   its own line when space runs out. */
.tail {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}
.note {
  color: var(--ink-soft);
  font-size: 0.85em;
}

/* Quiet pill (home page). */
.pill {
  padding: 0.45rem 0.8rem 0.45rem 0.65rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  font-size: var(--step--1);
}
.pill:hover {
  border-color: var(--ink-soft);
  background: color-mix(in oklab, var(--surface) 85%, var(--ink));
}

/* Secondary button (lesson cards). */
.button {
  min-height: 2.9em;
  padding: 0.3em 1.1em;
  border: 1px solid var(--hairline);
  border-radius: 999px;
}
.button:hover {
  background: var(--hover);
  border-color: var(--ink-soft);
}
.shop:active {
  transform: scale(0.97);
}
</style>
