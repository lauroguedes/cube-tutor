// Story scenes: animated explainers shown beside the cube while the tutor
// tells a story (the history lesson). A {{scene name}} cue shows one;
// `name:n` advances a multi-part scene (e.g. timeline:2 reveals two events).

export const SCENES = [
  'year',
  'rubik',
  'blocks',
  'month',
  'timeline',
  'patterns',
  'universe',
  'one',
  'championship',
  'gods-number',
  'method',
] as const;

export type SceneName = (typeof SCENES)[number];

export interface SceneRef {
  name: SceneName;
  /** Part of a multi-part scene, starting at 1. */
  part: number;
}

export function parseScene(arg: string): SceneRef | null {
  if (arg === 'none') return null;
  const [name, part = '1'] = arg.split(':');
  if (!SCENES.includes(name as SceneName) || !/^\d+$/.test(part)) throw new Error(`Unknown scene "${arg}"`);
  return { name: name as SceneName, part: Number(part) };
}
