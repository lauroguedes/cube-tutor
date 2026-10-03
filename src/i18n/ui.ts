// UI strings per locale. English is the source of truth: other locales are
// typed against it, so a missing key is a compile error, not a blank button.

export const defaultLocale = 'en';

const en = {
  'app.title': 'Cube Tutor',
  'app.tagline': 'Learn to solve the cube with a patient teacher.',
  'action.begin': 'Begin',
  'action.next': 'Next',
  'action.back': 'Back',
  'action.replay': 'Replay',
  'action.undo': 'Undo',
  'action.reset': 'Reset',
  'action.hint': 'Hint',
  'player.play': 'Play',
  'player.pause': 'Pause',
  'player.speed': 'Speed',
} as const;

export type UiKey = keyof typeof en;

export const ui = {
  en,
} satisfies Record<string, Record<UiKey, string>>;

export type Locale = keyof typeof ui;
