import { describe, expect, it } from 'vitest';
import { NotationError, formatAlg, invertAlg, parseAlg, simplifyAlg } from './moves';

describe('parseAlg', () => {
  it('parses face turns with suffixes', () => {
    expect(parseAlg("R U R' U'")).toEqual([
      { name: 'R', amount: 1 },
      { name: 'U', amount: 1 },
      { name: 'R', amount: -1 },
      { name: 'U', amount: -1 },
    ]);
    expect(parseAlg("F2 B2'")).toEqual([
      { name: 'F', amount: 2 },
      { name: 'B', amount: -2 },
    ]);
  });

  it('accepts typographic apostrophes, compact spacing and R3', () => {
    expect(parseAlg('R’U')).toEqual(parseAlg("R' U"));
    expect(parseAlg('R3')).toEqual(parseAlg("R'"));
  });

  it('parses wide moves, slices and rotations', () => {
    expect(formatAlg(parseAlg("Rw r' M E2 S x y' z2"))).toBe("r r' M E2 S x y' z2");
  });

  it('expands repeated groups', () => {
    expect(parseAlg("(R U R' U')6")).toHaveLength(24);
    expect(parseAlg("(R U)2 F")).toEqual(parseAlg('R U R U F'));
  });

  it('rejects invalid notation', () => {
    expect(() => parseAlg('Q')).toThrow(NotationError);
    expect(() => parseAlg('(R U')).toThrow(NotationError);
    expect(() => parseAlg('R U)')).toThrow(NotationError);
    expect(() => parseAlg('Mw')).toThrow(NotationError);
    expect(() => parseAlg('R4')).toThrow(NotationError);
  });
});

describe('transforms', () => {
  it('formats round-trip', () => {
    const text = "R U2 R' U' R U' R'";
    expect(formatAlg(parseAlg(text))).toBe(text);
  });

  it('inverts', () => {
    expect(formatAlg(invertAlg(parseAlg("R U F2'")))).toBe("F2 U' R'");
  });

  it('simplifies cancelling and merging turns', () => {
    expect(formatAlg(simplifyAlg(parseAlg('R R')))).toBe('R2');
    expect(formatAlg(simplifyAlg(parseAlg("R R R")))).toBe("R'");
    expect(simplifyAlg(parseAlg("U R R' U'"))).toEqual([]);
  });
});
