import { FACE_NORMAL, type Color } from '../engine/faces';
import { CUBIES, cubiePosition, findCubie, type CubeState } from '../engine/state';
import { parseCue, type PieceSelector } from './script';

/** Cubie ids a selector refers to in a given state. */
export function resolveSelector(sel: PieceSelector, state: CubeState): number[] {
  switch (sel.kind) {
    case 'type':
      return CUBIES.filter((c) => sel.types.includes(c.kind)).map((c) => c.id);
    case 'pieces':
      return sel.pieces.map((colors) => findCubie(colors as Color[]).id);
    case 'layer': {
      const n = FACE_NORMAL[sel.face];
      const ai = n.findIndex((v) => v !== 0) as 0 | 1 | 2;
      return CUBIES.filter((c) => cubiePosition(state, c.id)[ai] === n[ai]).map((c) => c.id);
    }
  }
}

/** Parse selector text like `type:corner` (same syntax as the {{highlight}} cue). */
export function parseSelectorText(text: string): PieceSelector | null {
  const cue = parseCue('highlight', text);
  return cue.type === 'highlight' ? cue.target : null;
}
