<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Locale } from '../i18n/ui';
import { useTranslations } from '../i18n/utils';
import type { VoiceId } from '../tutor/narration';
import type { Settings } from '../tutor/progress';

const props = defineProps<{ locale: Locale; settings: Settings }>();
const emit = defineEmits<{ change: [patch: Partial<Settings>]; reset: []; close: [] }>();
const t = useTranslations(props.locale);

const voices: VoiceId[] = ['female', 'male'];
const rates = [0.85, 1, 1.15];
const panel = ref<HTMLElement | null>(null);

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

function confirmReset() {
  if (window.confirm(t('settings.resetConfirm'))) emit('reset');
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  panel.value?.querySelector<HTMLElement>('button')?.focus();
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <section ref="panel" class="panel" role="dialog" aria-modal="true" :aria-label="t('lesson.settings')">
      <fieldset>
        <legend>{{ t('settings.voice') }}</legend>
        <div class="seg">
          <button
            v-for="v in voices"
            :key="v"
            type="button"
            :aria-pressed="settings.voice === v"
            @click="emit('change', { voice: v })"
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
            @click="emit('change', { rate: r })"
          >
            {{ r }}×
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>{{ t('settings.sound') }}</legend>
        <div class="seg">
          <button type="button" :aria-pressed="!settings.muted" @click="emit('change', { muted: false })">{{ t('settings.on') }}</button>
          <button type="button" :aria-pressed="settings.muted" @click="emit('change', { muted: true })">{{ t('settings.off') }}</button>
        </div>
      </fieldset>
      <div class="foot">
        <button type="button" class="link" @click="confirmReset">{{ t('settings.reset') }}</button>
        <button type="button" class="close" @click="emit('close')">{{ t('settings.close') }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: start end;
  padding: calc(var(--gutter) + 44px) var(--gutter);
  background: color-mix(in oklab, var(--sweep-deep) 40%, transparent);
}
.panel {
  width: min(320px, 100%);
  display: grid;
  gap: 1.1rem;
  padding: 1.2rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 18px 50px -20px rgb(0 0 0 / 0.35);
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}
legend {
  font-size: var(--step--1);
  color: var(--ink-soft);
  margin-bottom: 0.4rem;
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
  cursor: pointer;
}
.close {
  height: 2.3em;
  padding: 0 1em;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
</style>
