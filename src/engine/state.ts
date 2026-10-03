import { FACE_NORMAL, FACES, HOME_COLOR, faceFromNormal, type Color, type Face } from './faces';
import {
  AXIS_INDEX,
  IDENTITY,
  matEquals,
  mulMat,
  mulVec,
  rotation,
  vecEquals,
  vecKey,
  type Mat3,
  type Vec3,
} from './geometry';
import { MOVE_SPECS, moveQuarters, type Alg, type Move } from './moves';

// A cube state is the accumulated rotation of each of the 26 visible pieces
// ("cubies"). Because every move rotates pieces about the cube's center, a
// cubie's current position is simply `rot × home`. That makes the logical
// model identical to what the 3D view needs: each mesh is built at its home
// position and given the cubie's rotation as its transform.

export type PieceKind = 'center' | 'edge' | 'corner';

export interface Sticker {
  /** Outward normal at home (solved, unrotated) position. */
  readonly homeNormal: Vec3;
  readonly color: Color;
}

export interface CubieDef {
  readonly id: number;
  readonly home: Vec3;
  readonly kind: PieceKind;
  readonly stickers: readonly Sticker[];
}

const KIND_BY_STICKERS: Record<number, PieceKind> = { 1: 'center', 2: 'edge', 3: 'corner' };

/** The 26 pieces, in a fixed order. `id` doubles as the index into `CubeState.rots`. */
export const CUBIES: readonly CubieDef[] = (() => {
  const defs: CubieDef[] = [];
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const home: Vec3 = [x, y, z];
        const stickers: Sticker[] = [];
        for (const face of FACES) {
          const n = FACE_NORMAL[face];
          const axis = n.findIndex((c) => c !== 0);
          if (home[axis] === n[axis]) stickers.push({ homeNormal: n, color: HOME_COLOR[face] });
        }
        defs.push({ id: defs.length, home, kind: KIND_BY_STICKERS[stickers.length]!, stickers });
      }
  return defs;
})();

export interface CubeState {
  readonly rots: readonly Mat3[];
}

export const SOLVED: CubeState = { rots: CUBIES.map(() => IDENTITY) };

export function cubiePosition(state: CubeState, id: number): Vec3 {
  return mulVec(state.rots[id]!, CUBIES[id]!.home);
}

export function applyMove(state: CubeState, m: Move): CubeState {
  const spec = MOVE_SPECS[m.name];
  const r = rotation(spec.axis, moveQuarters(m));
  const ai = AXIS_INDEX[spec.axis];
  const rots = state.rots.map((rot, id) => {
    const pos = mulVec(rot, CUBIES[id]!.home);
    return spec.layers.includes(pos[ai]) ? mulMat(r, rot) : rot;
  });
  return { rots };
}

export function applyAlg(state: CubeState, alg: Alg): CubeState {
  let s = state;
  for (const m of alg) s = applyMove(s, m);
  return s;
}

/** Exact equality, including the (invisible) spin of center pieces. */
export function statesEqual(a: CubeState, b: CubeState): boolean {
  return a.rots.every((r, i) => matEquals(r, b.rots[i]!));
}

/**
 * Equality of everything a learner can see: every sticker in the same place.
 * A center's spin is invisible on a plain cube, so only its position counts.
 */
export function looksEqual(a: CubeState, b: CubeState): boolean {
  return CUBIES.every((def) =>
    def.kind === 'center'
      ? vecEquals(mulVec(a.rots[def.id]!, def.home), mulVec(b.rots[def.id]!, def.home))
      : matEquals(a.rots[def.id]!, b.rots[def.id]!),
  );
}

// ─── Sticker view ───────────────────────────────────────────────────────────

/** Fast lookup of what color is showing at a given position and direction. */
export interface StickerMap {
  colorAt(pos: Vec3, face: Face): Color;
  center(face: Face): Color;
}

export function stickers(state: CubeState): StickerMap {
  const map = new Map<string, Color>();
  for (const def of CUBIES) {
    const rot = state.rots[def.id]!;
    const pos = mulVec(rot, def.home);
    for (const s of def.stickers) {
      map.set(`${vecKey(pos)}|${vecKey(mulVec(rot, s.homeNormal))}`, s.color);
    }
  }
  const colorAt = (pos: Vec3, face: Face): Color => {
    const c = map.get(`${vecKey(pos)}|${vecKey(FACE_NORMAL[face])}`);
    if (!c) throw new Error(`No sticker at ${vecKey(pos)} facing ${face}`);
    return c;
  };
  return {
    colorAt,
    center: (face) => colorAt(FACE_NORMAL[face], face),
  };
}

/** The 9 colors of a face, read row by row as you'd see it looking at that face. */
export function faceColors(state: CubeState, face: Face): Color[] {
  const sm = stickers(state);
  const [rightDir, downDir] = FACE_READING_AXES[face];
  const n = FACE_NORMAL[face];
  const out: Color[] = [];
  for (const row of [-1, 0, 1])
    for (const col of [-1, 0, 1]) {
      const pos: Vec3 = [
        n[0] + rightDir[0] * col + downDir[0] * row,
        n[1] + rightDir[1] * col + downDir[1] * row,
        n[2] + rightDir[2] * col + downDir[2] * row,
      ];
      out.push(sm.colorAt(pos, face));
    }
  return out;
}

/** For each face: [direction of "right", direction of "down"] when viewing it in a standard net. */
const FACE_READING_AXES: Record<Face, [Vec3, Vec3]> = {
  U: [[1, 0, 0], [0, 0, 1]],
  D: [[1, 0, 0], [0, 0, -1]],
  F: [[1, 0, 0], [0, -1, 0]],
  B: [[-1, 0, 0], [0, -1, 0]],
  R: [[0, 0, -1], [0, -1, 0]],
  L: [[0, 0, 1], [0, -1, 0]],
};

/** Which spatial faces a cubie currently shows each of its colors on. */
export function cubieFacing(state: CubeState, id: number): Map<Color, Face> {
  const rot = state.rots[id]!;
  const out = new Map<Color, Face>();
  for (const s of CUBIES[id]!.stickers) out.set(s.color, faceFromNormal(mulVec(rot, s.homeNormal)));
  return out;
}

/** Find the piece carrying exactly these colors (e.g. ['white', 'green'] → that edge). */
export function findCubie(colors: readonly Color[]): CubieDef {
  const want = [...colors].sort().join('|');
  const def = CUBIES.find((c) => c.stickers.map((s) => s.color).sort().join('|') === want);
  if (!def) throw new Error(`No piece with colors ${colors.join(', ')}`);
  return def;
}
