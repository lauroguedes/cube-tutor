import { LESSONS } from '../course/lessons';
import type { CubeStyle } from '../render/palette';
import type { VoiceId } from './narration';

// Learner progress and settings, kept in this browser only (no accounts).
// Every storage access is guarded: private windows or blocked storage just
// mean progress isn't remembered between visits.

export const STORAGE_KEY = 'cube-tutor:v1';
/** Fired on window with the new Settings whenever they change, so every island can follow. */
export const SETTINGS_EVENT = 'cube-tutor:settings';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Settings {
  voice: VoiceId;
  rate: number;
  muted: boolean;
  theme: ThemeChoice;
  style: CubeStyle;
}

export interface Progress {
  completedSteps: string[];
  completedLessons: string[];
  settings: Settings;
}

const DEFAULTS: Progress = {
  completedSteps: [],
  completedLessons: [],
  settings: { voice: 'female', rate: 1, muted: false, theme: 'system', style: 'classic' },
};

/** Used only when storage is unavailable, so progress still works for this visit. */
let memory: Progress | null = null;

/**
 * Read progress fresh from storage every time (it's tiny), so another tab or
 * an older copy in memory can never overwrite newer progress or settings.
 */
export function loadProgress(): Progress {
  let stored: Partial<Progress> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    stored = raw ? (JSON.parse(raw) as Partial<Progress>) : {};
  } catch {
    // Unavailable or corrupted storage.
  }
  if (stored === null) return memory ?? (memory = structuredClone(DEFAULTS));
  memory = {
    completedSteps: Array.isArray(stored.completedSteps) ? stored.completedSteps : [],
    completedLessons: Array.isArray(stored.completedLessons) ? stored.completedLessons : [],
    settings: { ...DEFAULTS.settings, ...(stored.settings ?? {}) },
  };
  return memory;
}

function save(p: Progress): void {
  memory = p;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Not persisted; progress still works for this visit.
  }
}

export function completeStep(stepId: string): void {
  const p = loadProgress();
  if (!p.completedSteps.includes(stepId)) save({ ...p, completedSteps: [...p.completedSteps, stepId] });
}

export function completeLesson(lessonId: string): void {
  const p = loadProgress();
  if (!p.completedLessons.includes(lessonId)) save({ ...p, completedLessons: [...p.completedLessons, lessonId] });
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const p = loadProgress();
  const settings = { ...p.settings, ...patch };
  save({ ...p, settings });
  if (patch.theme) applyTheme(patch.theme);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
  return settings;
}

/** Follow the system theme, or force light/dark (mirrors the inline script in Base.astro). */
export function applyTheme(theme: ThemeChoice): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function resetProgress(): void {
  save({ ...DEFAULTS, settings: loadProgress().settings });
}

/** A lesson is open once every lesson before it is complete. */
export function isLessonUnlocked(lessonId: string, p: Progress = loadProgress()): boolean {
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  return LESSONS.slice(0, Math.max(0, i)).every((l) => p.completedLessons.includes(l.id));
}

/** Where to continue: the first incomplete lesson (or the last one if all are done). */
export function nextLessonId(p: Progress = loadProgress()): string {
  return (LESSONS.find((l) => !p.completedLessons.includes(l.id)) ?? LESSONS[LESSONS.length - 1]!).id;
}
