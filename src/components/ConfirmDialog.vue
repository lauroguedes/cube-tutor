<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

// A small confirmation dialog in the app's style, replacing window.confirm.
// Focus starts on the safe choice, Tab stays inside, Escape or a click
// outside cancels.

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
  }>(),
  { danger: false },
);
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const id = useId();
const dialog = ref<HTMLElement | null>(null);
const cancelButton = ref<HTMLButtonElement | null>(null);
let returnFocus: HTMLElement | null = null;

function onKey(e: KeyboardEvent) {
  if (!props.open) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    emit('cancel');
  } else if (e.key === 'Tab' && dialog.value) {
    const buttons = [...dialog.value.querySelectorAll<HTMLElement>('button')];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement as HTMLElement | null;
      window.addEventListener('keydown', onKey, true);
      await nextTick();
      cancelButton.value?.focus();
    } else {
      window.removeEventListener('keydown', onKey, true);
      returnFocus?.focus();
      returnFocus = null;
    }
  },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="fx">
      <div v-if="open" class="scrim" @pointerdown.self="emit('cancel')">
        <section
          ref="dialog"
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="`${id}-title`"
          :aria-describedby="`${id}-message`"
        >
          <span class="icon" :class="{ danger }" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M12 8v5M12 16.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </span>
          <h2 :id="`${id}-title`">{{ title }}</h2>
          <p :id="`${id}-message`">{{ message }}</p>
          <div class="buttons">
            <button ref="cancelButton" type="button" class="chip" @click="emit('cancel')">{{ cancelLabel }}</button>
            <button type="button" class="primary" :class="{ danger }" @click="emit('confirm')">{{ confirmLabel }}</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--gutter);
  background: color-mix(in oklab, var(--sweep-deep) 55%, transparent);
  backdrop-filter: blur(6px);
}
.dialog {
  width: min(24rem, 100%);
  display: grid;
  gap: 0.6rem;
  padding: 1.4rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 30px 80px -30px rgb(0 0 0 / 0.5);
}
.icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  background: color-mix(in oklab, var(--highlight) 30%, transparent);
  color: var(--ink);
}
.icon.danger {
  background: color-mix(in oklab, var(--warn) 16%, transparent);
  color: var(--warn);
}
h2 {
  margin-top: 0.3rem;
  font-size: var(--step-1);
}
p {
  margin: 0;
  color: var(--ink-soft);
  font-size: var(--step--1);
  line-height: 1.5;
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.primary {
  height: 2.5em;
  font-size: var(--step--1);
}
.primary.danger {
  background: var(--warn);
  color: #fff;
}
</style>
