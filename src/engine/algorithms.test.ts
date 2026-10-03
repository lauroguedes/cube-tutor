import { describe, expect, it } from 'vitest';
import { SOLVED_IN_GRIP, lblAlg } from './algorithms';
import { FACE_NORMAL, type Face } from './faces';
import { addVec, matEquals, vecEquals, type Vec3 } from './geometry';
import { setupFor } from './generate';
import { parseAlg, repeatAlg, type Alg } from './moves';
import {
  areLastLayerCornersPositioned,
  areLastLayerCornersSolved,
  isCrossSolved,
  isFirstLayerSolved,
  isLastLayerCrossOriented,
  isSecondLayerSolved,
  isSolved,
} from './predicates';
import {
  CUBIES,
  applyAlg,
  cubieFacing,
  cubiePosition,
  looksEqual,
  stickers,
  type CubeState,
} from './state';

// Proofs of everything the tutor says about each beginner algorithm.
// Grip: white on the bottom (D), yellow on top (U), green in front.

const G = SOLVED_IN_GRIP;
const at = (...faces: Face[]): Vec3 => faces.reduce<Vec3>((p, f) => addVec(p, FACE_NORMAL[f]), [0, 0, 0]);
const run = (alg: Alg, state: CubeState = G) => applyAlg(state, alg);

/** Id of the piece currently at `pos`. */
function pieceAt(state: CubeState, pos: Vec3): number {
  return CUBIES.find((c) => vecEquals(cubiePosition(state, c.id), pos))!.id;
}

/** Ids of the pieces (and so the slots) of the top layer, in the solved grip. */
const TOP_SLOTS = CUBIES.filter((c) => cubiePosition(G, c.id)[1] === 1 && c.kind !== 'center').map((c) =>
  cubiePosition(G, c.id),
);

/** The top-layer slots whose piece moved or turned. */
function changedTopSlots(before: CubeState, after: CubeState): string[] {
  return TOP_SLOTS.filter((p) => {
    const a = pieceAt(before, p);
    const b = pieceAt(after, p);
    return a !== b || !matEquals(before.rots[a]!, after.rots[b]!);
  }).map(slotName);
}

function slotName(p: Vec3): string {
  return (['U', p[2] === 1 ? 'F' : p[2] === -1 ? 'B' : '', p[0] === 1 ? 'R' : p[0] === -1 ? 'L' : ''] as const).join('');
}

function orientedTopEdges(state: CubeState): string[] {
  const sm = stickers(state);
  return (['F', 'R', 'B', 'L'] as const)
    .filter((side) => sm.colorAt(at('U', side), 'U') === sm.center('U'))
    .map((side) => `U${side}`);
}

describe('the solving grip', () => {
  it('has white on the bottom and yellow on top', () => {
    const sm = stickers(G);
    expect(sm.center('D')).toBe('white');
    expect(sm.center('U')).toBe('yellow');
    expect(sm.center('F')).toBe('green');
  });
});

describe("corner insertion: R U R' U'", () => {
  const alg = lblAlg('cornerInsert');

  it('returns to the start after six repetitions', () => {
    expect(looksEqual(run(repeatAlg(alg, 6)), G)).toBe(true);
  });

  it('solves a corner waiting above its slot, in any twist, with 1, 3 or 5 repetitions', () => {
    const corner = pieceAt(G, at('D', 'F', 'R'));
    const whiteFacings = new Set<Face>();
    for (const k of [1, 3, 5]) {
      const start = setupFor(repeatAlg(alg, k), G);
      // The case: everything else in the first layer is solved…
      expect(isCrossSolved(start)).toBe(true);
      for (const slot of [at('D', 'F', 'L'), at('D', 'B', 'R'), at('D', 'B', 'L')]) {
        const id = pieceAt(start, slot);
        expect(id).toBe(pieceAt(G, slot));
        expect(matEquals(start.rots[id]!, G.rots[id]!)).toBe(true);
      }
      // …and the missing corner sits directly above its slot.
      expect(vecEquals(cubiePosition(start, corner), at('U', 'F', 'R'))).toBe(true);
      whiteFacings.add(cubieFacing(start, corner).get('white')!);
    }
    // Each repetition count handles a different twist.
    expect(whiteFacings).toEqual(new Set(['U', 'F', 'R']));
  });
});

describe('middle layer edges', () => {
  it.each([
    ['middleRight', 'R'],
    ['middleLeft', 'L'],
  ] as const)('%s keeps the first layer and inserts the top-front edge to the front-%s', (id, side) => {
    const alg = lblAlg(id);
    expect(isFirstLayerSolved(run(alg))).toBe(true);

    const start = setupFor(alg, G);
    expect(isFirstLayerSolved(start)).toBe(true);
    const sm = stickers(start);
    // The edge that belongs in the slot waits at top-front: front color facing front, side color on top.
    expect(sm.colorAt(at('U', 'F'), 'F')).toBe(sm.center('F'));
    expect(sm.colorAt(at('U', 'F'), 'U')).toBe(sm.center(side));
  });
});

describe("yellow cross: F R U R' U' F'", () => {
  const alg = lblAlg('yellowCross');

  it('keeps the first two layers', () => {
    expect(isSecondLayerSolved(run(alg))).toBe(true);
  });

  it('turns a horizontal line into the cross', () => {
    const start = setupFor(alg, G);
    expect(isSecondLayerSolved(start)).toBe(true);
    expect(orientedTopEdges(start)).toEqual(['UR', 'UL']);
    expect(isLastLayerCrossOriented(run(alg, start))).toBe(true);
  });

  it('turns an L held at back-left into a horizontal line', () => {
    const lCase = setupFor([...alg, ...alg], G);
    expect(orientedTopEdges(lCase)).toEqual(['UB', 'UL']);
    expect(orientedTopEdges(run(alg, lCase))).toEqual(['UR', 'UL']);
  });

  it('turns a dot into an L', () => {
    const dot = setupFor([...alg, ...parseAlg('U2'), ...alg, ...alg], G);
    expect(orientedTopEdges(dot)).toEqual([]);
    expect(orientedTopEdges(run(alg, dot))).toHaveLength(2);
  });
});

describe("corner positioning: U R U' L' U R' U' L", () => {
  const alg = lblAlg('positionCorners');

  it('keeps the first two layers and the yellow cross', () => {
    expect(isLastLayerCrossOriented(run(alg))).toBe(true);
  });

  it('moves only three top corners, leaving the front-right one in its place', () => {
    expect(changedTopSlots(G, run(alg)).sort()).toEqual(['UBL', 'UBR', 'UFL'].sort());
  });

  it('puts them back after three repetitions', () => {
    expect(areLastLayerCornersPositioned(run(repeatAlg(alg, 3)))).toBe(true);
    expect(areLastLayerCornersPositioned(run(alg))).toBe(false);
  });
});

describe("corner twisting: R' D' R D", () => {
  const alg = lblAlg('orientCorner');

  it('twists the front-right top corner and touches nothing else in the top layer', () => {
    for (const k of [2, 4]) {
      expect(changedTopSlots(G, run(repeatAlg(alg, k)))).toEqual(['UFR']);
    }
  });

  it('repairs the bottom layers once the total repetitions add up to six', () => {
    // Twist one corner forward, turn the top, twist another back: the method's core trick.
    const s = run([...repeatAlg(alg, 2), ...parseAlg('U'), ...repeatAlg(alg, 4), ...parseAlg("U'")]);
    expect(isSecondLayerSolved(s)).toBe(true);
    // U brings the back-right corner to the front-right, so those two end up twisted.
    expect(changedTopSlots(G, s).sort()).toEqual(['UBR', 'UFR'].sort());
  });
});

describe("edge cycle: R U' R U R U R U' R' U' R2", () => {
  const alg = lblAlg('cycleEdges');

  it('keeps everything except three top edges, leaving the back edge in place', () => {
    const s = run(alg);
    expect(areLastLayerCornersSolved(s)).toBe(true);
    expect(changedTopSlots(G, s).sort()).toEqual(['UF', 'UL', 'UR'].sort());
  });

  it('solves the cube after three repetitions', () => {
    expect(isSolved(run(repeatAlg(alg, 3)))).toBe(true);
  });
});
