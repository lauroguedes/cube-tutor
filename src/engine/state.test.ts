import { describe, expect, it } from 'vitest';
import { seededRandom, randomScramble } from './generate';
import { invertAlg, parseAlg, repeatAlg, type MoveName } from './moves';
import { isSolved } from './predicates';
import { CUBIES, SOLVED, applyAlg, faceColors, findCubie, looksEqual, statesEqual } from './state';

const after = (alg: string) => applyAlg(SOLVED, parseAlg(alg));

describe('cube model', () => {
  it('has 6 centers, 12 edges and 8 corners', () => {
    const count = (k: string) => CUBIES.filter((c) => c.kind === k).length;
    expect([count('center'), count('edge'), count('corner')]).toEqual([6, 12, 8]);
  });

  it('starts solved with white on top and green in front', () => {
    expect(isSolved(SOLVED)).toBe(true);
    expect(new Set(faceColors(SOLVED, 'U'))).toEqual(new Set(['white']));
    expect(new Set(faceColors(SOLVED, 'F'))).toEqual(new Set(['green']));
  });

  it('finds pieces by their colors', () => {
    expect(findCubie(['green', 'white']).kind).toBe('edge');
    expect(findCubie(['red', 'white', 'green']).kind).toBe('corner');
  });
});

describe('move directions match standard notation', () => {
  // Each check: after one clockwise turn, which colors land where.
  it('R lifts the front-right column up to the top', () => {
    expect(faceColors(after('R'), 'U').filter((_, i) => i % 3 === 2)).toEqual(['green', 'green', 'green']);
  });
  it('U sends the front-top row to the left (so the front shows red)', () => {
    expect(faceColors(after('U'), 'F').slice(0, 3)).toEqual(['red', 'red', 'red']);
  });
  it('F sends the bottom row of the top face to the right face', () => {
    expect(faceColors(after('F'), 'R').filter((_, i) => i % 3 === 0)).toEqual(['white', 'white', 'white']);
  });
  it('L brings the top-left column down to the front', () => {
    expect(faceColors(after('L'), 'F').filter((_, i) => i % 3 === 0)).toEqual(['white', 'white', 'white']);
  });
  it('M follows L', () => {
    expect(faceColors(after('M'), 'F').filter((_, i) => i % 3 === 1)).toEqual(['white', 'white', 'white']);
  });
  it('D sends the front-bottom row to the right', () => {
    expect(faceColors(after('D'), 'F').slice(6)).toEqual(['orange', 'orange', 'orange']);
  });
  it('B sends the top row to the left face', () => {
    expect(faceColors(after('B'), 'L').filter((_, i) => i % 3 === 0)).toEqual(['white', 'white', 'white']);
  });
  it('x follows R, y follows U, z follows F', () => {
    expect(new Set(faceColors(after('x'), 'U'))).toEqual(new Set(['green']));
    expect(new Set(faceColors(after('y'), 'F'))).toEqual(new Set(['red']));
    expect(new Set(faceColors(after('z'), 'R'))).toEqual(new Set(['white']));
  });
});

describe('group properties', () => {
  const names: MoveName[] = ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'r', 'u', 'f', 'x', 'y', 'z'];

  it.each(names)('%s four times is identity, and %s then its inverse is identity', (n) => {
    expect(statesEqual(after(`${n} ${n} ${n} ${n}`), SOLVED)).toBe(true);
    expect(statesEqual(after(`${n} ${n}'`), SOLVED)).toBe(true);
    expect(statesEqual(after(`${n}2`), after(`${n} ${n}`))).toBe(true);
  });

  it('wide moves equal face + slice', () => {
    expect(statesEqual(after('r'), after("R M'"))).toBe(true);
    expect(statesEqual(after('u'), after("U E'"))).toBe(true);
    expect(statesEqual(after('f'), after('F S'))).toBe(true);
  });

  it('rotations equal turning all layers', () => {
    expect(statesEqual(after('x'), after("R M' L'"))).toBe(true);
    expect(statesEqual(after('y'), after("U E' D'"))).toBe(true);
    expect(statesEqual(after('z'), after("F S B'"))).toBe(true);
  });

  it("R U R' U' has order 6 and R U has order 105", () => {
    expect(statesEqual(applyAlg(SOLVED, repeatAlg(parseAlg("R U R' U'"), 6)), SOLVED)).toBe(true);
    for (let k = 1; k < 6; k++)
      expect(statesEqual(applyAlg(SOLVED, repeatAlg(parseAlg("R U R' U'"), k)), SOLVED)).toBe(false);
    const ru105 = applyAlg(SOLVED, repeatAlg(parseAlg('R U'), 105));
    expect(looksEqual(ru105, SOLVED)).toBe(true);
    expect(looksEqual(applyAlg(SOLVED, repeatAlg(parseAlg('R U'), 35)), SOLVED)).toBe(false);
    // …but the U and R centers have each spun a quarter turn (105 ≡ 1 mod 4).
    expect(statesEqual(ru105, SOLVED)).toBe(false);
  });

  it('any scramble followed by its inverse is solved', () => {
    const random = seededRandom(42);
    for (let k = 0; k < 50; k++) {
      const scramble = randomScramble(25, random);
      const scrambled = applyAlg(SOLVED, scramble);
      expect(isSolved(scrambled)).toBe(false);
      expect(statesEqual(applyAlg(scrambled, invertAlg(scramble)), SOLVED)).toBe(true);
    }
  });
});
