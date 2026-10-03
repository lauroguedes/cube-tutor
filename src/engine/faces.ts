import type { Vec3 } from './geometry';

/** Spatial faces, named from the viewer: they don't move, the pieces do. */
export type Face = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';

export const FACES: readonly Face[] = ['U', 'D', 'F', 'B', 'R', 'L'];

export const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

export const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' };

export function faceFromNormal(n: Vec3): Face {
  for (const f of FACES) {
    const m = FACE_NORMAL[f];
    if (m[0] === n[0] && m[1] === n[1] && m[2] === n[2]) return f;
  }
  throw new Error(`Not a face normal: ${n.join(',')}`);
}

export type Color = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';

/**
 * The color each face has on a solved cube in its starting position
 * (standard "Western" scheme: white top, green front, red right).
 */
export const HOME_COLOR: Record<Face, Color> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};
