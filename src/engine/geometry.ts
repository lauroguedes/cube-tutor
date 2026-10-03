// Integer 3D geometry for the cube. Every move is a quarter-turn rotation
// about a coordinate axis through the cube's center, so all positions and
// orientations stay exact integers: no floating-point drift, ever.
//
// Frame: +x = Right, +y = Up, +z = Front (right-handed, same as Three.js).

export type Vec3 = readonly [number, number, number];

/** Row-major 3×3 integer rotation matrix. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number];

export type Axis = 'x' | 'y' | 'z';

export const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mulMat(a: Mat3, b: Mat3): Mat3 {
  const r: number[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r.push(a[i * 3]! * b[j]! + a[i * 3 + 1]! * b[3 + j]! + a[i * 3 + 2]! * b[6 + j]!);
    }
  }
  return r as unknown as Mat3;
}

export function mulVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/**
 * Rotation by `quarters` × 90° about `axis`, positive = counter-clockwise
 * when looking from the positive end of the axis (right-hand rule).
 */
export function rotation(axis: Axis, quarters: number): Mat3 {
  const q = ((quarters % 4) + 4) % 4;
  const c = [1, 0, -1, 0][q]!;
  const s = [0, 1, 0, -1][q]!;
  switch (axis) {
    case 'x':
      return [1, 0, 0, 0, c, -s, 0, s, c];
    case 'y':
      return [c, 0, s, 0, 1, 0, -s, 0, c];
    case 'z':
      return [c, -s, 0, s, c, 0, 0, 0, 1];
  }
}

export function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function matEquals(a: Mat3, b: Mat3): boolean {
  for (let i = 0; i < 9; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}
