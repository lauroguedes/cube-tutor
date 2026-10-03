<script setup lang="ts">
// A notation move drawn as a keycap. Pressing it performs the move.
defineProps<{ notation: string; active?: boolean; disabled?: boolean; label?: string }>();
defineEmits<{ press: [] }>();
</script>

<template>
  <button
    type="button"
    class="key"
    :class="{ active }"
    :disabled="disabled"
    :aria-label="label ?? notation"
    @click="$emit('press')"
  >
    {{ notation }}
  </button>
</template>

<style scoped>
.key {
  min-width: 2.6em;
  height: 2.6em;
  padding: 0 0.6em;
  border: 1px solid var(--hairline);
  border-bottom-width: 3px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: var(--step-0);
  cursor: pointer;
  transition:
    transform 0.12s var(--ease),
    border-color 0.12s var(--ease),
    background 0.12s var(--ease);
}
.key:hover:not(:disabled) {
  border-color: var(--ink-soft);
}
.key:active:not(:disabled) {
  transform: translateY(2px);
  border-bottom-width: 1px;
}
.key.active {
  background: var(--highlight);
  color: var(--highlight-ink);
  border-color: #c9a300;
}
.key:disabled {
  opacity: 0.45;
  cursor: default;
}
</style>
