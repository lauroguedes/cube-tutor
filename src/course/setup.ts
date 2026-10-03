import { DAISY, SOLVED_IN_GRIP } from '../engine/algorithms';
import type { Color } from '../engine/faces';
import { setupFor } from '../engine/generate';
import { parseAlg } from '../engine/moves';
import { isDaisy, isStageComplete } from '../engine/predicates';
import { SOLVED, applyAlg, cubieFacing, findCubie, looksEqual, type CubeState } from '../engine/state';
import { parseSelectorText, resolveSelector } from '../tutor/selectors';
import type { Base, Goal, Setup, StepDef } from './types';

const BASES: Record<Base, CubeState> = { home: SOLVED, grip: SOLVED_IN_GRIP, daisy: DAISY };

export function baseState(base: Base = 'home'): CubeState {
  return BASES[base];
}

/** The cube state a step starts from. */
export function startState(setup: Setup | undefined): CubeState {
  let s = baseState(setup?.base);
  if (setup?.alg) s = applyAlg(s, parseAlg(setup.alg));
  if (setup?.reverse) s = setupFor(parseAlg(setup.reverse), s);
  return s;
}

/** Moves the tutor demonstrates for "Show me". */
export function stepSolution(step: StepDef): string | null {
  return step.solution ?? step.setup?.reverse ?? (step.goal?.kind === 'state' ? step.goal.alg : null);
}

export interface Attempt {
  start: CubeState;
  state: CubeState;
  /** Number of learner turns since the task started. */
  turns: number;
  /** Cubie ids the learner has tapped. */
  picks: ReadonlySet<number>;
}

export function isGoalMet(goal: Goal, a: Attempt): boolean {
  switch (goal.kind) {
    case 'turns':
      return a.turns >= goal.count;
    case 'state':
      return looksEqual(a.state, applyAlg(a.start, parseAlg(goal.alg)));
    case 'pick': {
      const sel = parseSelectorText(goal.select);
      if (!sel) return false;
      const wanted = new Set(resolveSelector(sel, a.state));
      let found = 0;
      for (const id of a.picks) if (wanted.has(id)) found++;
      return found >= goal.count;
    }
    case 'place': {
      const piece = findCubie(goal.piece as Color[]);
      const facing = cubieFacing(a.state, piece.id);
      const faces = new Set(facing.values());
      return goal.at.length === faces.size && goal.at.every((f) => faces.has(f as never));
    }
    case 'daisy':
      return isDaisy(a.state);
    case 'stage':
      return isStageComplete(a.state, goal.stage);
  }
}

/** Whether a tapped piece is one the pick goal is looking for. */
export function isWantedPick(goal: Goal, state: CubeState, cubieId: number): boolean {
  if (goal.kind !== 'pick') return false;
  const sel = parseSelectorText(goal.select);
  return !!sel && resolveSelector(sel, state).includes(cubieId);
}
