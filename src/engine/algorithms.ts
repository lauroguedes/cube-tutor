import { parseAlg, type Move } from './moves';
import { SOLVED, applyAlg, type CubeState } from './state';

// Algorithms taught in the beginner layer-by-layer course. Every claim the
// tutor makes about these (what they preserve, what they cycle) is proven in
// algorithms.test.ts, so the narration can never teach something false.
//
// They assume the solving grip: white (first layer) on the bottom, yellow on top.

export const LBL = {
  /** "Sexy move". Repeated, it drops a corner from above into the bottom-front-right slot. */
  cornerInsert: "R U R' U'",
  /** Middle layer: send the top-front edge down into the front-right slot. */
  middleRight: "U R U' R' U' F' U F",
  /** Middle layer: send the top-front edge down into the front-left slot. */
  middleLeft: "U' L' U L U F U' F'",
  /** Orient the last-layer edges: dot → L → line → cross. */
  yellowCross: "F R U R' U' F'",
  /** Cycle three last-layer corners, keeping the front-right one in place. */
  positionCorners: "U R U' L' U R' U' L",
  /** Twist the front-right top corner (repeat in pairs; turn U between corners, never the cube). */
  orientCorner: "R' D' R D",
  /** Cycle three last-layer edges, keeping the back one in place. */
  cycleEdges: "R U' R U R U R U' R' U' R2",
} as const;

export type LblAlgId = keyof typeof LBL;

export function lblAlg(id: LblAlgId): Move[] {
  return parseAlg(LBL[id]);
}

/** Whole-cube rotation from the home position (white on top) to the solving grip. */
export const SOLVING_GRIP = 'z2';

/** A solved cube held in the solving grip (white bottom, green front). */
export const SOLVED_IN_GRIP: CubeState = applyAlg(SOLVED, parseAlg(SOLVING_GRIP));
