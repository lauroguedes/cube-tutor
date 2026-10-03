import { describe, expect, it } from 'vitest';
import { parseAlg } from './moves';
import {
  areLastLayerCornersPositioned,
  isCrossSolved,
  isFirstLayerSolved,
  isLastLayerCrossOriented,
  isSecondLayerSolved,
  isSolved,
  stagesComplete,
  STAGES,
} from './predicates';
import { SOLVED, applyAlg } from './state';

const after = (alg: string) => applyAlg(SOLVED, parseAlg(alg));

describe('stage predicates', () => {
  it('a solved cube completes every stage, however it is held', () => {
    for (const grip of ['', 'z2', 'x', "y'", 'x y2 z']) {
      expect(stagesComplete(after(grip))).toBe(STAGES.length);
    }
  });

  it('turning the face opposite the cross keeps the first two layers', () => {
    // White starts on U, so a D turn only disturbs the yellow layer.
    const s = after('D');
    expect(isCrossSolved(s)).toBe(true);
    expect(isFirstLayerSolved(s)).toBe(true);
    expect(isSecondLayerSolved(s)).toBe(true);
    expect(isLastLayerCrossOriented(s)).toBe(true);
    expect(areLastLayerCornersPositioned(s)).toBe(false);
    expect(isSolved(s)).toBe(false);
  });

  it('turning the cross face itself breaks the cross', () => {
    expect(isCrossSolved(after('U'))).toBe(false);
    expect(stagesComplete(after('U'))).toBe(0);
  });

  it('a middle-slice move breaks everything, because centers move', () => {
    expect(stagesComplete(after('E'))).toBe(0);
    expect(stagesComplete(after('M'))).toBe(0);
  });

  it('judges the cross against the white center wherever it is', () => {
    // Hold the cube upside down, then mess up the (now top) yellow layer.
    expect(isFirstLayerSolved(after('z2 U'))).toBe(true);
    expect(isCrossSolved(after('z2 D'))).toBe(false);
  });

  it('can check the cross for other colors', () => {
    expect(isCrossSolved(after('U'), 'yellow')).toBe(true);
    expect(isCrossSolved(after('U'), 'white')).toBe(false);
  });
});
