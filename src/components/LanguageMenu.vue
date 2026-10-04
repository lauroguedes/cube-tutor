<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { LOCALES, ui, type Locale } from '../i18n/ui';
import { LOCALE_KEY, translatePath, useTranslations } from '../i18n/utils';

// Language button + dropdown, shown next to the settings gear. Each option is
// a plain link to the same page in that language, and the choice is
// remembered so the home page opens in it next time.

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);
const locales = Object.keys(ui) as Locale[];

const open = ref(false);
// The current page, known only in the browser (the server renders home links).
const path = ref('/');
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const list = ref<HTMLElement | null>(null);

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    list.value?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
  }
}

function close(returnFocus = true) {
  if (!open.value) return;
  open.value = false;
  if (returnFocus) button.value?.focus();
}

function choose(l: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, l);
  } catch {
    // Not remembered; the link still opens the page in that language.
  }
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const links = [...(list.value?.querySelectorAll<HTMLElement>('a') ?? [])];
    const i = links.indexOf(document.activeElement as HTMLElement);
    links[(i + (e.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length]?.focus();
  }
}

function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close(false);
}

onMounted(() => {
  path.value = window.location.pathname;
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointerDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true);
  window.removeEventListener('pointerdown', onPointerDown);
});

defineExpose({ isOpen: () => open.value });
</script>

<template>
  <div ref="root" class="lang">
    <button
      ref="button"
      type="button"
      class="trigger"
      :aria-label="`${t('settings.language')}: ${LOCALES[locale].name}`"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="toggle"
    >
      <!-- Globe -->
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M3.6 12h16.8M12 3.4c2.3 2.4 3.4 5.3 3.4 8.6s-1.1 6.2-3.4 8.6c-2.3-2.4-3.4-5.3-3.4-8.6s1.1-6.2 3.4-8.6z" />
        </g>
      </svg>
      <span class="code">{{ LOCALES[locale].short }}</span>
    </button>

    <Transition name="fx">
      <nav v-if="open" ref="list" class="panel" :aria-label="t('settings.language')">
        <a
          v-for="l in locales"
          :key="l"
          :href="translatePath(path, l)"
          :hreflang="LOCALES[l].lang"
          :lang="LOCALES[l].lang"
          :aria-current="l === locale"
          @click="choose(l)"
        >
          <span class="short" aria-hidden="true">{{ LOCALES[l].short }}</span>
          {{ LOCALES[l].name }}
          <svg v-if="l === locale" class="check" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </nav>
    </Transition>
  </div>
</template>

<style scoped>
.lang {
  position: relative;
  flex: none;
}
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 40px;
  padding: 0 0.8rem 0 0.7rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background-color 0.18s var(--ease),
    border-color 0.18s var(--ease),
    transform 0.12s var(--ease);
}
.trigger:hover {
  background-color: var(--hover);
  border-color: var(--ink-soft);
}
.trigger:active {
  transform: scale(0.96);
}
/* Phones: just the language code, in a round button like the gear. */
@media (max-width: 440px) {
  .trigger {
    width: 40px;
    padding: 0;
    justify-content: center;
  }
  .trigger svg {
    display: none;
  }
}
.code {
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.04em;
}
.panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 10px);
  right: 0;
  display: grid;
  gap: 2px;
  min-width: 14rem;
  padding: 0.4rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--surface) 94%, transparent);
  backdrop-filter: blur(14px);
  box-shadow: 0 22px 60px -24px rgb(0 0 0 / 0.45);
  transform-origin: top right;
}
.panel a {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.7rem;
  border-radius: calc(var(--radius) - 0.3rem);
  color: var(--ink);
  font-size: var(--step--1);
  white-space: nowrap;
  text-decoration: none;
  transition: background-color 0.18s var(--ease);
}
.panel a:hover,
.panel a:focus-visible {
  background: var(--hover);
}
.panel a[aria-current='true'] {
  font-weight: 700;
}
.short {
  display: inline-grid;
  place-items: center;
  width: 2.1em;
  height: 1.6em;
  border-radius: 6px;
  background: var(--sweep);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ink-soft);
}
a[aria-current='true'] .short {
  background: var(--highlight);
  color: #15161a;
}
.check {
  margin-left: auto;
}
</style>
