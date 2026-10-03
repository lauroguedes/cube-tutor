import { MOVE_SPECS, FACE_MOVES, invertAlg, type Alg, type Amount, type Move } from './moves';
import { SOLVED, applyAlg, type CubeState } from './state';

/** Small seeded PRNG (mulberry32) so exercises and tests are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random face-turn scramble. Never turns the same face twice in a row, and
 * never does three turns on one axis in a row (e.g. R L R), so no moves cancel.
 */
export function randomScramble(length = 25, random: () => number = Math.random): Move[] {
  const amounts: Amount[] = [1, -1, 2];
  const out: Move[] = [];
  while (out.length < length) {
    const name = FACE_MOVES[Math.floor(random() * FACE_MOVES.length)]!;
    const prev = out[out.length - 1];
    const prev2 = out[out.length - 2];
    if (prev && prev.name === name) continue;
    if (
      prev &&
      prev2 &&
      MOVE_SPECS[prev.name].axis === MOVE_SPECS[name].axis &&
      MOVE_SPECS[prev2.name].axis === MOVE_SPECS[name].axis
    )
      continue;
    out.push({ name, amount: amounts[Math.floor(random() * amounts.length)]! });
  }
  return out;
}

/**
 * The state that `solution` solves, starting from `target` (solved by default).
 * This is how exercises build a case that shows exactly one situation.
 */
export function setupFor(solution: Alg, target: CubeState = SOLVED): CubeState {
  return applyAlg(target, invertAlg(solution));
}
