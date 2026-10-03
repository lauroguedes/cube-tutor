import { formatMove, parseAlg } from '../engine/moves';

/**
 * How to show an algorithm as keycaps. A repeated group like `(R U R' U')5`
 * shows its four moves once with a ×5 badge, instead of twenty keys.
 */
export interface Keycaps {
  keys: string[];
  repeat: number;
}

export function keycapsFor(alg: string): Keycaps {
  const m = /^\s*\(([^()]*)\)\s*(\d+)\s*$/.exec(alg);
  if (m) return { keys: parseAlg(m[1]!).map(formatMove), repeat: Number(m[2]) };
  return { keys: parseAlg(alg).map(formatMove), repeat: 1 };
}
