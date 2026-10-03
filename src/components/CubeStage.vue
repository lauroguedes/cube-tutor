<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { CubeView } from '../render/CubeView';
import type { CubeState } from '../engine/state';
import { loadProgress, SETTINGS_EVENT, type Settings } from '../tutor/progress';
import { turnSounds } from '../audio/turnSounds';

const props = defineProps<{
  initial?: CubeState;
  label: string;
  /** Only the visitor's own turns click (e.g. the home page's background demo). */
  quietDemo?: boolean;
}>();
const emit = defineEmits<{ ready: [view: CubeView] }>();

const host = ref<HTMLDivElement | null>(null);
const failed = ref(false);
const view = shallowRef<CubeView | null>(null);

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

let sfx = true;

// Follow the cube style and sound setting chosen in Settings, live.
function onSettings(e: Event) {
  const s = (e as CustomEvent<Settings>).detail;
  view.value?.setStyle(s.style);
  sfx = s.sfx;
}

onMounted(() => {
  if (!host.value || !webglAvailable()) {
    failed.value = true;
    return;
  }
  const settings = loadProgress().settings;
  sfx = settings.sfx;
  view.value = new CubeView(host.value, props.initial, settings.style);
  // Every turn clicks, in lessons, demos and free play alike (unless muted).
  turnSounds.preload();
  view.value.on('turning', ({ duration, source }) => {
    if (!sfx || (props.quietDemo && source !== 'user')) return;
    turnSounds.play({ fast: duration < 0.2 });
  });
  window.addEventListener(SETTINGS_EVENT, onSettings);
  emit('ready', view.value);
});

onBeforeUnmount(() => {
  window.removeEventListener(SETTINGS_EVENT, onSettings);
  view.value?.dispose();
});
</script>

<template>
  <div class="stage" role="img" :aria-label="label">
    <div ref="host" class="host" />
    <p v-if="failed" class="fallback"><slot name="fallback" /></p>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
}
.host {
  position: absolute;
  inset: 0;
}
.fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--gutter);
  text-align: center;
  color: var(--ink-soft);
}
</style>
