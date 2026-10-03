<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import { CUBE_STYLES } from '../render/palette';
import { VOICES } from '../tutor/narration';
import {
  loadProgress,
  resetProgress,
  SETTINGS_EVENT,
  updateSettings,
  type Settings,
  type ThemeChoice,
} from '../tutor/progress';

// Gear button + settings dropdown, used on every page. Changes are saved and
// broadcast (SETTINGS_EVENT), so the cube and the tutor follow them live.

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);

const open = ref(false);
const settings = ref<Settings>(loadProgress().settings);
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);

const themes: { value: ThemeChoice; key: 'settings.themeSystem' | 'settings.themeLight' | 'settings.themeDark' }[] = [
  { value: 'system', key: 'settings.themeSystem' },
  { value: 'light', key: 'settings.themeLight' },
  { value: 'dark', key: 'settings.themeDark' },
];
const rates = [0.85, 1, 1.15];

function change(patch: Partial<Settings>) {
  settings.value = updateSettings(patch);
}

function onSettings(e: Event) {
  settings.value = (e as CustomEvent<Settings>).detail;
}

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    panel.value?.querySelector<HTMLElement>('button[aria-pressed="true"]')?.focus();
  }
}

function close(returnFocus = true) {
  if (!open.value) return;
  open.value = false;
  if (returnFocus) button.value?.focus();
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation();
    close();
  }
}

function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close(false);
}

function confirmReset() {
  if (!window.confirm(t('settings.resetConfirm'))) return;
  resetProgress();
  window.location.href = localePath(props.locale, '/');
}

onMounted(() => {
  settings.value = loadProgress().settings;
  window.addEventListener(SETTINGS_EVENT, onSettings);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointerDown);
});
onBeforeUnmount(() => {
  window.removeEventListener(SETTINGS_EVENT, onSettings);
  window.removeEventListener('keydown', onKey, true);
  window.removeEventListener('pointerdown', onPointerDown);
});

defineExpose({ isOpen: () => open.value });
</script>

<template>
  <div ref="root" class="menu">
    <button
      ref="button"
      type="button"
      class="icon-btn"
      :aria-label="t('lesson.settings')"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <!-- Gear -->
      <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
        <path
          d="M10.3 2.8h3.4l.5 2.4a7.4 7.4 0 0 1 1.9 1.1l2.3-.8 1.7 3-1.8 1.6a7.6 7.6 0 0 1 0 2.2l1.8 1.6-1.7 3-2.3-.8a7.4 7.4 0 0 1-1.9 1.1l-.5 2.4h-3.4l-.5-2.4a7.4 7.4 0 0 1-1.9-1.1l-2.3.8-1.7-3 1.8-1.6a7.6 7.6 0 0 1 0-2.2L3.9 9.5l1.7-3 2.3.8a7.4 7.4 0 0 1 1.9-1.1z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <circle cx="12" cy="12" r="2.9" fill="none" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>

    <Transition name="fx">
      <section v-if="open" ref="panel" class="panel" role="dialog" :aria-label="t('lesson.settings')">
        <fieldset>
          <legend>{{ t('settings.theme') }}</legend>
          <div class="seg">
            <button
              v-for="th in themes"
              :key="th.value"
              type="button"
              :aria-pressed="settings.theme === th.value"
              @click="change({ theme: th.value })"
            >
              {{ t(th.key) }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{{ t('settings.style') }}</legend>
          <div class="seg">
            <button
              v-for="st in CUBE_STYLES"
              :key="st"
              type="button"
              :aria-pressed="settings.style === st"
              @click="change({ style: st })"
            >
              {{ t(`style.${st}`) }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{{ t('settings.voice') }}</legend>
          <div class="seg">
            <button
              v-for="v in VOICES"
              :key="v"
              type="button"
              :aria-pressed="settings.voice === v"
              :title="t(v === 'female' ? 'settings.femaleHint' : 'settings.maleHint')"
              @click="change({ voice: v })"
            >
              {{ t(v === 'female' ? 'settings.female' : 'settings.male') }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{{ t('settings.speed') }}</legend>
          <div class="seg">
            <button
              v-for="r in rates"
              :key="r"
              type="button"
              :aria-pressed="settings.rate === r"
              @click="change({ rate: r })"
            >
              {{ r }}×
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{{ t('settings.sound') }}</legend>
          <div class="seg">
            <button type="button" :aria-pressed="!settings.muted" @click="change({ muted: false })">{{ t('settings.on') }}</button>
            <button type="button" :aria-pressed="settings.muted" @click="change({ muted: true })">{{ t('settings.off') }}</button>
          </div>
        </fieldset>

        <div class="foot">
          <button type="button" class="link" @click="confirmReset">{{ t('settings.reset') }}</button>
          <button type="button" class="chip" @click="close()">{{ t('settings.close') }}</button>
        </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.menu {
  position: relative;
  flex: none;
}
.panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 10px);
  right: 0;
  width: min(330px, calc(100vw - 2 * var(--gutter)));
  display: grid;
  gap: 1rem;
  padding: 1.1rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--surface) 94%, transparent);
  backdrop-filter: blur(14px);
  box-shadow: 0 22px 60px -24px rgb(0 0 0 / 0.45);
  transform-origin: top right;
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}
legend {
  font-size: var(--step--1);
  color: var(--ink-soft);
  margin-bottom: 0.35rem;
}
.seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--sweep);
}
.seg button {
  flex: 1;
  height: 2.3em;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font-size: var(--step--1);
  transition:
    background-color 0.18s var(--ease),
    box-shadow 0.18s var(--ease);
}
.seg button:hover:not([aria-pressed='true']) {
  background: var(--hover);
}
.seg button[aria-pressed='true'] {
  background: var(--surface);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
  font-weight: 700;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.link {
  border: 0;
  background: none;
  padding: 0;
  color: var(--warn);
  font-size: var(--step--1);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.link:hover {
  text-decoration-thickness: 2px;
}
</style>
