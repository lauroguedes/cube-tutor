<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { CubeView } from '../render/CubeView';
import type { CubeState } from '../engine/state';
import { loadProgress, SETTINGS_EVENT, type Settings } from '../tutor/progress';

const props = defineProps<{ initial?: CubeState; label: string }>();
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

// Follow the cube style chosen in Settings (or on the home page), live.
function onSettings(e: Event) {
  view.value?.setStyle((e as CustomEvent<Settings>).detail.style);
}

onMounted(() => {
  if (!host.value || !webglAvailable()) {
    failed.value = true;
    return;
  }
  view.value = new CubeView(host.value, props.initial, loadProgress().settings.style);
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
