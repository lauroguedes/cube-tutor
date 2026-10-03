import type { Locale } from '../i18n/ui';
import { parseScript, type ParsedScript } from '../tutor/script';
import { LESSONS } from './lessons';
import { en } from './text/en';
import type { CourseText, LessonDef, PartId, StepDef, StepText } from './types';

export { LESSONS } from './lessons';
export type * from './types';

const TEXTS: Record<Locale, CourseText> = { en };

export function courseText(locale: Locale): CourseText {
  return TEXTS[locale];
}

export function stepText(locale: Locale, stepId: string): StepText {
  const t = TEXTS[locale].steps[stepId];
  if (!t) throw new Error(`Missing ${locale} text for step "${stepId}"`);
  return t;
}

export function lessonById(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id);
}

export function partOf(lessonId: string): PartId {
  return lessonById(lessonId)?.part ?? 1;
}

/** Every piece of narration in the course: one audio clip each. */
export interface NarrationItem {
  /** Audio clip id: the step id, or `<step id>--done` for the success line. */
  id: string;
  script: ParsedScript;
}

export function narrationItems(locale: Locale): NarrationItem[] {
  const items: NarrationItem[] = [];
  for (const lesson of LESSONS)
    for (const step of lesson.steps) {
      const t = stepText(locale, step.id);
      items.push({ id: step.id, script: parseScript(t.say) });
      if (t.done) items.push({ id: doneClipId(step), script: parseScript(t.done) });
    }
  return items;
}

export function doneClipId(step: StepDef): string {
  return `${step.id}--done`;
}
