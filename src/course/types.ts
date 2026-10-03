import type { Stage } from '../engine/predicates';
import type { ViewCue } from '../tutor/script';

// Course structure, shared by every language. Text lives in ./text/<locale>.ts,
// keyed by the same ids, so a translation never has to touch exercise logic.

export type Base = 'home' | 'grip' | 'daisy';

export interface Setup {
  /** Starting position: home (white up), grip (white down) or a finished daisy. */
  base?: Base;
  /** Moves applied to the base, e.g. a scramble. */
  alg?: string;
  /** Start at the state that these moves solve (after `alg`). Also the "show me" solution. */
  reverse?: string;
  view?: ViewCue;
  labels?: boolean;
  explode?: boolean;
  autorotate?: boolean;
  /** Highlight selector, same syntax as the {{highlight}} cue. */
  highlight?: string;
  /** Notation keycaps shown under the caption. */
  keys?: string;
}

export type Goal =
  /** Make any `count` turns. */
  | { kind: 'turns'; count: number }
  /** Reach the start state followed by these moves (any equivalent way counts). */
  | { kind: 'state'; alg: string }
  /** Tap pieces matching a selector (`type:corner`, `piece:white,green`). */
  | { kind: 'pick'; select: string; count: number }
  /** Move a piece (by its colors) to a position (named by the faces it touches). */
  | { kind: 'place'; piece: string[]; at: string[] }
  | { kind: 'daisy' }
  | { kind: 'stage'; stage: Stage };

export interface StepDef {
  /** Unique across the course. Also names the narration audio file. */
  readonly id: string;
  /** `talk` = explanation; `try` = task that must be completed to continue. */
  readonly kind: 'talk' | 'try';
  readonly setup?: Setup;
  readonly goal?: Goal;
  /** Moves the tutor shows for "Show me" (defaults to setup.reverse). */
  readonly solution?: string;
  /** Learner may turn the cube while/after the tutor talks (default true). */
  readonly turns?: boolean;
}

export type PartId = 1 | 2 | 3 | 4;

export interface LessonDef {
  readonly id: string;
  readonly part: PartId;
  readonly steps: readonly StepDef[];
}

export interface StepText {
  /** Narration with cue markers. */
  say: string;
  /** Spoken when a task is completed. */
  done?: string;
  /** Escalating text hints for tasks. */
  hints?: string[];
}

export interface LessonText {
  title: string;
  summary: string;
}

export interface CourseText {
  parts: Record<PartId, string>;
  lessons: Record<string, LessonText>;
  steps: Record<string, StepText>;
}
