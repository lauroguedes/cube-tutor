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
  'action.redo': 'Redo',
  'player.play': 'Play',
  'player.pause': 'Pause',
  'player.speed': 'Speed',
  'cube.label': 'Interactive 3D cube. Drag a face to turn it, drag the background to look around.',
  'cube.noWebgl': 'Your browser can’t show 3D graphics, so the cube can’t be displayed. Try a recent version of Chrome, Safari, Firefox or Edge.',
  'play.title': 'Free play',
  'play.intro': 'Drag a face to turn it. Drag the background to look around. Keys R L U D F B turn the faces; hold Shift to turn the other way.',
  'play.scramble': 'Scramble',
  'play.solve': 'Back to solved',
  'play.counterClockwise': 'Counter-clockwise',
  'play.labels': 'Face letters',
  'play.inside': 'Look inside',
  'play.views': 'View',
  'play.moves': 'Moves',
  'play.solved': 'Solved',
  'view.default': 'Default',
  'view.top': 'Top',
  'view.bottom': 'Bottom',
  'view.back': 'Back',
} as const;

export type UiKey = keyof typeof en;

export const ui = {
  en,
} satisfies Record<string, Record<UiKey, string>>;

export type Locale = keyof typeof ui;
