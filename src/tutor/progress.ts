import { LESSONS } from '../course/lessons';
import type { VoiceId } from './narration';

// Learner progress and settings, kept in this browser only (no accounts).
// Every storage access is guarded: private windows or blocked storage just
// mean progress isn't remembered between visits.

const KEY = 'cube-tutor:v1';

export interface Settings {
  voice: VoiceId;
  rate: number;
  muted: boolean;
}

export interface Progress {
  completedSteps: string[];
  completedLessons: string[];
  settings: Settings;
}

const DEFAULTS: Progress = {
  completedSteps: [],
  completedLessons: [],
  settings: { voice: 'female', rate: 1, muted: false },
};

let memory: Progress | null = null;

export function loadProgress(): Progress {
  if (memory) return memory;
  let stored: Partial<Progress> = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Partial<Progress>;
  } catch {
    // Unavailable or corrupted storage: start fresh.
  }
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
    localStorage.setItem(KEY, JSON.stringify(p));
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
  return settings;
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
