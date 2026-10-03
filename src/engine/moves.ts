import type { Axis } from './geometry';

// Standard cube notation (Singmaster + modern extensions):
//   Face turns   R L U D F B   (clockwise when looking straight at that face)
//   Slice turns  M E S         (M follows L, E follows D, S follows F)
//   Wide turns   r l u d f b   (also written Rw, Lw, …): face + adjacent slice
//   Rotations    x y z         (whole cube; x follows R, y follows U, z follows F)
//   Suffixes     '  = counter-clockwise,  2 = half turn

export type MoveName =
  | 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  | 'M' | 'E' | 'S'
  | 'r' | 'l' | 'u' | 'd' | 'f' | 'b'
  | 'x' | 'y' | 'z';

/** 1 = clockwise quarter, -1 = counter-clockwise, ±2 = half turn (sign kept for animation direction). */
export type Amount = 1 | -1 | 2 | -2;

export interface Move {
  readonly name: MoveName;
  readonly amount: Amount;
}

export type Alg = readonly Move[];

interface MoveSpec {
  readonly axis: Axis;
  /** Which layers turn, by coordinate along the axis. */
  readonly layers: readonly number[];
  /** Rotation direction (right-hand rule, in quarters) for one clockwise turn. */
  readonly dir: 1 | -1;
}

const ALL = [-1, 0, 1] as const;

export const MOVE_SPECS: Record<MoveName, MoveSpec> = {
  R: { axis: 'x', layers: [1], dir: -1 },
  L: { axis: 'x', layers: [-1], dir: 1 },
  M: { axis: 'x', layers: [0], dir: 1 },
  r: { axis: 'x', layers: [0, 1], dir: -1 },
  l: { axis: 'x', layers: [-1, 0], dir: 1 },
  x: { axis: 'x', layers: ALL, dir: -1 },
  U: { axis: 'y', layers: [1], dir: -1 },
  D: { axis: 'y', layers: [-1], dir: 1 },
  E: { axis: 'y', layers: [0], dir: 1 },
  u: { axis: 'y', layers: [0, 1], dir: -1 },
  d: { axis: 'y', layers: [-1, 0], dir: 1 },
  y: { axis: 'y', layers: ALL, dir: -1 },
  F: { axis: 'z', layers: [1], dir: -1 },
  B: { axis: 'z', layers: [-1], dir: 1 },
  S: { axis: 'z', layers: [0], dir: -1 },
  f: { axis: 'z', layers: [0, 1], dir: -1 },
  b: { axis: 'z', layers: [-1, 0], dir: 1 },
  z: { axis: 'z', layers: ALL, dir: -1 },
};

export const FACE_MOVES: readonly MoveName[] = ['R', 'L', 'U', 'D', 'F', 'B'];

/** Signed number of right-hand-rule quarter turns about the move's axis. */
export function moveQuarters(move: Move): number {
  return MOVE_SPECS[move.name].dir * move.amount;
}

export function isRotation(move: Move): boolean {
  return move.name === 'x' || move.name === 'y' || move.name === 'z';
}

export function move(name: MoveName, amount: Amount = 1): Move {
  return { name, amount };
}

// ─── Parsing ────────────────────────────────────────────────────────────────

export class NotationError extends Error {}

const WIDE_FROM_UPPER: Partial<Record<string, MoveName>> = {
  R: 'r', L: 'l', U: 'u', D: 'd', F: 'f', B: 'b',
};

/**
 * Parse an algorithm string such as `R U R' U'`, `F2 Rw'`, or `(R U R' U')6`.
 * Whitespace between moves is optional. Groups in parentheses may be followed
 * by a repeat count.
 */
export function parseAlg(text: string): Move[] {
  let i = 0;
  const src = text.replace(/[’‘`´]/g, "'").replace(/×/g, '');

  function skipSpace() {
    while (i < src.length && /\s/.test(src[i]!)) i++;
  }

  function readCount(): number | null {
    const m = /^\d+/.exec(src.slice(i));
    if (!m) return null;
    i += m[0].length;
    return Number(m[0]);
  }

  function parseSequence(closing: boolean): Move[] {
    const out: Move[] = [];
    for (;;) {
      skipSpace();
      if (i >= src.length) {
        if (closing) throw new NotationError(`Missing ")" in "${text}"`);
        return out;
      }
      const ch = src[i]!;
      if (ch === ')') {
        if (!closing) throw new NotationError(`Unexpected ")" in "${text}"`);
        i++;
        return out;
      }
      if (ch === '(') {
        i++;
        const group = parseSequence(true);
        const times = readCount() ?? 1;
        for (let k = 0; k < times; k++) out.push(...group);
        continue;
      }
      out.push(parseMove());
    }
  }

  function parseMove(): Move {
    const ch = src[i]!;
    let name: MoveName;
    if (ch in MOVE_SPECS) {
      name = ch as MoveName;
      i++;
      if (src[i] === 'w') {
        const wide = WIDE_FROM_UPPER[ch];
        if (!wide) throw new NotationError(`"${ch}w" is not a valid move in "${text}"`);
        name = wide;
        i++;
      }
    } else {
      throw new NotationError(`Unknown move "${ch}" in "${text}"`);
    }
    const count = readCount() ?? 1;
    let prime = false;
    if (src[i] === "'") {
      prime = true;
      i++;
    }
    const q = ((count % 4) + 4) % 4;
    if (q === 0) throw new NotationError(`"${name}${count}" does nothing in "${text}"`);
    const base = q === 3 ? -1 : q;
    const amount = (prime ? -base : base) as Amount;
    return { name, amount };
  }

  return parseSequence(false);
}

// ─── Formatting and transforms ──────────────────────────────────────────────

export function formatMove(m: Move): string {
  switch (m.amount) {
    case 1:
      return m.name;
    case -1:
      return `${m.name}'`;
    case 2:
      return `${m.name}2`;
    case -2:
      return `${m.name}2'`;
  }
}

export function formatAlg(alg: Alg): string {
  return alg.map(formatMove).join(' ');
}

export function invertMove(m: Move): Move {
  return { name: m.name, amount: -m.amount as Amount };
}

export function invertAlg(alg: Alg): Move[] {
  return alg.map(invertMove).reverse();
}

export function repeatAlg(alg: Alg, times: number): Move[] {
  const out: Move[] = [];
  for (let k = 0; k < times; k++) out.push(...alg);
  return out;
}

/** Merge consecutive turns of the same layer (R R → R2, R R' → nothing). */
export function simplifyAlg(alg: Alg): Move[] {
  const out: Move[] = [];
  for (const m of alg) {
    const last = out[out.length - 1];
    if (last && last.name === m.name) {
      const q = (((last.amount + m.amount) % 4) + 4) % 4;
      out.pop();
      if (q !== 0) out.push({ name: m.name, amount: q === 3 ? -1 : (q as 1 | 2) });
    } else {
      out.push(m);
    }
  }
  return out;
}
