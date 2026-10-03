import type { Move, MoveName } from '../engine/moves';

const KEY_MOVES: Record<string, MoveName> = {
  r: 'R', l: 'L', u: 'U', d: 'D', f: 'F', b: 'B',
  m: 'M', e: 'E', s: 'S', x: 'x', y: 'y', z: 'z',
};

/** Keyboard turning: R L U D F B M E S x y z, hold Shift for the counter-clockwise turn. */
export function moveFromKey(e: KeyboardEvent): Move | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const target = e.target as HTMLElement | null;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return null;
  const name = KEY_MOVES[e.key.toLowerCase()];
  if (!name) return null;
  return { name, amount: e.shiftKey ? -1 : 1 };
}
