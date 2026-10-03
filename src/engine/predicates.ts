import { FACE_NORMAL, FACES, OPPOSITE, type Color, type Face } from './faces';
import { addVec, type Vec3 } from './geometry';
import { stickers, type CubeState, type StickerMap } from './state';

// Goal checks for lessons and exercises. Everything is judged against the
// center colors, never against absolute screen directions, so a learner who
// turns the whole cube over (or does slice moves) is still judged correctly.

function pos(...faces: Face[]): Vec3 {
  return faces.reduce<Vec3>((acc, f) => addVec(acc, FACE_NORMAL[f]), [0, 0, 0]);
}

/** True if every sticker of the piece at the meeting point of `faces` matches its face's center. */
function pieceSolvedAt(sm: StickerMap, ...faces: Face[]): boolean {
  const p = pos(...faces);
  return faces.every((f) => sm.colorAt(p, f) === sm.center(f));
}

export function faceOfCenter(sm: StickerMap, color: Color): Face {
  const f = FACES.find((face) => sm.center(face) === color);
  if (!f) throw new Error(`No center is ${color}`);
  return f;
}

function sideFaces(base: Face): Face[] {
  return FACES.filter((f) => f !== base && f !== OPPOSITE[base]);
}

/** The 4 pairs of side faces that meet at a vertical edge. */
function sidePairs(base: Face): [Face, Face][] {
  const sides = sideFaces(base);
  const pairs: [Face, Face][] = [];
  for (let i = 0; i < sides.length; i++)
    for (let j = i + 1; j < sides.length; j++)
      if (OPPOSITE[sides[i]!] !== sides[j]) pairs.push([sides[i]!, sides[j]!]);
  return pairs;
}

// ─── Stage goals for the beginner layer-by-layer method ────────────────────
// `color` is the color of the first layer (white in the course).

export function isCrossSolved(state: CubeState, color: Color = 'white'): boolean {
  const sm = stickers(state);
  const base = faceOfCenter(sm, color);
  return sideFaces(base).every((side) => pieceSolvedAt(sm, base, side));
}

export function isFirstLayerSolved(state: CubeState, color: Color = 'white'): boolean {
  const sm = stickers(state);
  const base = faceOfCenter(sm, color);
  return (
    sideFaces(base).every((side) => pieceSolvedAt(sm, base, side)) &&
    sidePairs(base).every(([a, b]) => pieceSolvedAt(sm, base, a, b))
  );
}

export function isSecondLayerSolved(state: CubeState, color: Color = 'white'): boolean {
  if (!isFirstLayerSolved(state, color)) return false;
  const sm = stickers(state);
  const base = faceOfCenter(sm, color);
  return sidePairs(base).every(([a, b]) => pieceSolvedAt(sm, a, b));
}

/** First two layers solved and the last layer shows a cross of its own color. */
export function isLastLayerCrossOriented(state: CubeState, color: Color = 'white'): boolean {
  if (!isSecondLayerSolved(state, color)) return false;
  const sm = stickers(state);
  const top = OPPOSITE[faceOfCenter(sm, color)];
  const topColor = sm.center(top);
  return sideFaces(top).every((side) => sm.colorAt(pos(top, side), top) === topColor);
}

/** Every last-layer corner sits between the three centers it belongs to (twist ignored). */
export function areLastLayerCornersPositioned(state: CubeState, color: Color = 'white'): boolean {
  if (!isLastLayerCrossOriented(state, color)) return false;
  const sm = stickers(state);
  const top = OPPOSITE[faceOfCenter(sm, color)];
  return sidePairs(top).every(([a, b]) => {
    const p = pos(top, a, b);
    const have = [top, a, b].map((f) => sm.colorAt(p, f)).sort().join('|');
    const want = [top, a, b].map((f) => sm.center(f)).sort().join('|');
    return have === want;
  });
}

export function areLastLayerCornersSolved(state: CubeState, color: Color = 'white'): boolean {
  if (!isLastLayerCrossOriented(state, color)) return false;
  const sm = stickers(state);
  const top = OPPOSITE[faceOfCenter(sm, color)];
  return sidePairs(top).every(([a, b]) => pieceSolvedAt(sm, top, a, b));
}

export function isSolved(state: CubeState): boolean {
  const sm = stickers(state);
  return FACES.every((face) => {
    const n = FACE_NORMAL[face];
    const center = sm.center(face);
    for (const a of [-1, 0, 1])
      for (const b of [-1, 0, 1]) {
        const p: Vec3 =
          n[0] !== 0 ? [n[0], a, b] : n[1] !== 0 ? [a, n[1], b] : [a, b, n[2]];
        if (sm.colorAt(p, face) !== center) return false;
      }
    return true;
  });
}

export const STAGES = [
  'cross',
  'firstLayer',
  'secondLayer',
  'lastLayerCross',
  'lastLayerCornersPositioned',
  'lastLayerCornersSolved',
  'solved',
] as const;

export type Stage = (typeof STAGES)[number];

const STAGE_CHECKS: Record<Stage, (s: CubeState, c: Color) => boolean> = {
  cross: isCrossSolved,
  firstLayer: isFirstLayerSolved,
  secondLayer: isSecondLayerSolved,
  lastLayerCross: isLastLayerCrossOriented,
  lastLayerCornersPositioned: areLastLayerCornersPositioned,
  lastLayerCornersSolved: areLastLayerCornersSolved,
  solved: (s) => isSolved(s),
};

export function isStageComplete(state: CubeState, stage: Stage, color: Color = 'white'): boolean {
  return STAGE_CHECKS[stage](state, color);
}

/** Number of consecutive beginner stages already complete (0 = not even the cross). */
export function stagesComplete(state: CubeState, color: Color = 'white'): number {
  let n = 0;
  for (const stage of STAGES) {
    if (!STAGE_CHECKS[stage](state, color)) break;
    n++;
  }
  return n;
}
