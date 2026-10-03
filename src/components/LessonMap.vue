<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { LESSONS, courseText } from '../course';
import type { PartId } from '../course/types';
import type { Locale } from '../i18n/ui';
import { localePath, useTranslations } from '../i18n/utils';
import { isLessonUnlocked, loadProgress, nextLessonId, type Progress } from '../tutor/progress';

// The course map. Rendered on the server with everything open, then
// hydrated with this browser's progress (locked / done / up next).

const props = defineProps<{ locale: Locale }>();
const t = useTranslations(props.locale);
const text = courseText(props.locale);
const progress = ref<Progress | null>(null);

onMounted(() => (progress.value = loadProgress()));

const parts = computed(() => {
  const groups = new Map<PartId, { lesson: (typeof LESSONS)[number]; number: number }[]>();
  LESSONS.forEach((lesson, i) => {
    const list = groups.get(lesson.part) ?? [];
    list.push({ lesson, number: i + 1 });
    groups.set(lesson.part, list);
  });
  return [...groups.entries()];
});

function status(id: string): 'done' | 'next' | 'locked' | 'open' {
  const p = progress.value;
  if (!p) return 'open';
  if (p.completedLessons.includes(id)) return 'done';
  if (id === nextLessonId(p)) return 'next';
  return isLessonUnlocked(id, p) ? 'open' : 'locked';
}
</script>

<template>
  <div class="parts">
    <section v-for="[part, lessons] in parts" :key="part" class="part" :style="{ '--part': `var(--part-${part})` }">
      <h2>
        <span class="eyebrow">{{ t('learn.part', { n: part }) }}</span>
        {{ text.parts[part] }}
      </h2>
      <ol>
        <li v-for="{ lesson, number } in lessons" :key="lesson.id" :class="status(lesson.id)">
          <component
            :is="status(lesson.id) === 'locked' ? 'div' : 'a'"
            class="row"
            :href="status(lesson.id) === 'locked' ? undefined : localePath(locale, `/learn/${lesson.id}`)"
            :aria-disabled="status(lesson.id) === 'locked' || undefined"
          >
            <span class="num">{{ String(number).padStart(2, '0') }}</span>
            <span class="body">
              <span class="name">{{ text.lessons[lesson.id]?.title }}</span>
              <span class="summary">{{ text.lessons[lesson.id]?.summary }}</span>
            </span>
            <span class="state">
              <template v-if="status(lesson.id) === 'done'">
                <svg class="icon done-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                  <path d="M7.5 12.4l3 2.9 6-6.3" fill="none" stroke="var(--surface)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="visually-hidden">{{ t('learn.done') }}</span>
              </template>
              <template v-else-if="status(lesson.id) === 'locked'">
                <svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <rect x="5" y="10.5" width="14" height="10" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.7" />
                  <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                </svg>
                <span class="visually-hidden">{{ t('learn.locked') }}</span>
              </template>
              <span v-else-if="status(lesson.id) === 'next'" class="next-tag">{{ t('learn.next') }}</span>
            </span>
          </component>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.parts {
  display: grid;
  gap: 2.4rem;
}
h2 {
  display: grid;
  gap: 0.2rem;
  font-size: var(--step-2);
  margin-bottom: 0.8rem;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--part);
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--hairline);
}
li {
  border-bottom: 1px solid var(--hairline);
}
.row {
  display: grid;
  grid-template-columns: 2.6rem 1fr auto;
  align-items: baseline;
  gap: 0.8rem;
  padding: 0.95rem 0.6rem;
  color: inherit;
  text-decoration: none;
}
a.row:hover .name {
  text-decoration: underline;
  text-decoration-color: var(--part);
  text-underline-offset: 4px;
}
.num {
  font-family: var(--font-mono);
  color: var(--ink-soft);
}
.body {
  display: grid;
  gap: 0.15rem;
}
.name {
  font-weight: 700;
}
.summary {
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.state {
  display: inline-flex;
  align-items: center;
  align-self: center;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.icon {
  display: block;
}
li.done .num {
  color: var(--part);
}
li.done .state {
  color: var(--success);
}
.next-tag {
  background: var(--highlight);
  color: var(--highlight-ink);
  padding: 0.1em 0.5em;
  border-radius: 4px;
}
.row {
  border-radius: var(--radius-sm);
  transition: background-color 0.18s var(--ease);
}
a.row:hover {
  background: var(--hover);
}
li.locked .row {
  opacity: 0.45;
}
</style>
