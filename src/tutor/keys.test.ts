import { describe, expect, it } from 'vitest';
import { keycapsFor } from './keys';

describe('keycapsFor', () => {
  it('shows a plain algorithm move by move', () => {
    expect(keycapsFor("R U R' U'")).toEqual({ keys: ['R', 'U', "R'", "U'"], repeat: 1 });
  });

  it('shows a repeated group once with its count', () => {
    expect(keycapsFor("(R U R' U')5")).toEqual({ keys: ['R', 'U', "R'", "U'"], repeat: 5 });
  });

  it('expands groups that are only part of the algorithm', () => {
    expect(keycapsFor("U (R U)2").keys).toEqual(['U', 'R', 'U', 'R', 'U']);
  });
});
