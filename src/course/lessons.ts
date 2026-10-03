import { LBL } from '../engine/algorithms';
import type { LessonDef } from './types';

// The course, in order. Each task's start position is defined as "the state
// that this solution solves" (setup.reverse), so every task is guaranteed to
// be solvable and to show exactly the case being taught. course.test.ts checks
// that no task starts already solved and that every solution really works.

const YC = LBL.yellowCross;
const YC_INV = "F U R U' R' F'";
const PLACE = LBL.positionCorners;
const TWIST = LBL.orientCorner;
const EDGES = LBL.cycleEdges;

export const LESSONS: readonly LessonDef[] = [
  // ── Part 1: The cube ──────────────────────────────────────────────────────
  {
    id: 'welcome',
    part: 1,
    steps: [
      { id: 'welcome-intro', kind: 'talk', setup: { autorotate: true } },
      { id: 'welcome-try', kind: 'try', goal: { kind: 'turns', count: 1 } },
    ],
  },
  {
    id: 'history',
    part: 1,
    // One continuous story: animated scenes beside the cube follow the narration.
    steps: [{ id: 'history-story', kind: 'talk', turns: false, setup: { autorotate: true } }],
  },
  {
    id: 'anatomy',
    part: 1,
    steps: [
      { id: 'anatomy-core', kind: 'talk', turns: false },
      { id: 'anatomy-pieces', kind: 'talk', turns: false },
      { id: 'anatomy-corners', kind: 'try', goal: { kind: 'pick', select: 'type:corner', count: 8 } },
      {
        id: 'anatomy-edge',
        kind: 'try',
        setup: { alg: "R U F'" },
        goal: { kind: 'pick', select: 'piece:white,green', count: 1 },
      },
    ],
  },
  // ── Part 2: Moving the cube ───────────────────────────────────────────────
  {
    id: 'turning',
    part: 2,
    steps: [
      { id: 'turning-faces', kind: 'talk', turns: false },
      { id: 'turning-try', kind: 'try', goal: { kind: 'state', alg: 'R' } },
      { id: 'turning-back', kind: 'try', setup: { alg: 'R' }, goal: { kind: 'state', alg: "R'" } },
    ],
  },
  {
    id: 'notation',
    part: 2,
    steps: [
      { id: 'notation-letters', kind: 'talk', turns: false, setup: { labels: true } },
      { id: 'notation-prime', kind: 'talk', turns: false, setup: { labels: true } },
      { id: 'notation-try', kind: 'try', setup: { labels: true, keys: "U R'" }, goal: { kind: 'state', alg: "U R'" } },
      {
        id: 'notation-read',
        kind: 'try',
        setup: { labels: true, keys: "F U2 L'" },
        goal: { kind: 'state', alg: "F U2 L'" },
      },
    ],
  },
  {
    id: 'pieces',
    part: 2,
    steps: [
      { id: 'pieces-follow', kind: 'talk', turns: false },
      {
        id: 'pieces-try',
        kind: 'try',
        setup: { highlight: 'piece:white,green' },
        goal: { kind: 'place', piece: ['white', 'green'], at: ['D', 'F'] },
        solution: 'F2',
      },
    ],
  },
  {
    id: 'first-algorithm',
    part: 2,
    steps: [
      { id: 'alg-meet', kind: 'talk', turns: false },
      { id: 'alg-try', kind: 'try', setup: { keys: "R U R' U'" }, goal: { kind: 'state', alg: "R U R' U'" } },
      {
        id: 'alg-six',
        kind: 'try',
        setup: { alg: "R U R' U'", keys: "R U R' U'" },
        goal: { kind: 'stage', stage: 'solved' },
        solution: "(R U R' U')5",
      },
    ],
  },
  // ── Part 3: Solving ───────────────────────────────────────────────────────
  {
    id: 'plan',
    part: 3,
    steps: [{ id: 'plan-layers', kind: 'talk', turns: false, setup: { base: 'grip' } }],
  },
  {
    id: 'daisy',
    part: 3,
    steps: [
      { id: 'daisy-goal', kind: 'talk', turns: false, setup: { base: 'daisy', view: 'top' } },
      { id: 'daisy-rules', kind: 'talk', turns: false, setup: { base: 'daisy' } },
      { id: 'daisy-try-middle', kind: 'try', setup: { base: 'daisy', reverse: 'R' }, goal: { kind: 'daisy' } },
      { id: 'daisy-try-bottom', kind: 'try', setup: { base: 'daisy', reverse: 'U R2' }, goal: { kind: 'daisy' } },
      { id: 'daisy-try-full', kind: 'try', setup: { base: 'grip', alg: "F R' D2 L U' B" }, goal: { kind: 'daisy' } },
    ],
  },
  {
    id: 'cross',
    part: 3,
    steps: [
      { id: 'cross-flip', kind: 'talk', turns: false, setup: { base: 'daisy', alg: 'U' } },
      {
        id: 'cross-try',
        kind: 'try',
        setup: { base: 'daisy', alg: 'U' },
        goal: { kind: 'stage', stage: 'cross' },
        solution: "U' F2 R2 B2 L2",
      },
      {
        id: 'cross-check',
        kind: 'talk',
        setup: { base: 'daisy', alg: 'F2 R2 B2 L2', view: 'bottom', highlight: 'pieces:white,green;white,orange;white,blue;white,red' },
      },
    ],
  },
  {
    id: 'corners',
    part: 3,
    steps: [
      { id: 'corners-drop', kind: 'talk', turns: false, setup: { base: 'grip', reverse: `(${LBL.cornerInsert})3` } },
      { id: 'corners-find', kind: 'talk', turns: false, setup: { base: 'grip', reverse: `U' ${LBL.cornerInsert}` } },
      {
        id: 'corners-try',
        kind: 'try',
        setup: { base: 'grip', reverse: `(${LBL.cornerInsert})5` },
        goal: { kind: 'stage', stage: 'firstLayer' },
      },
      {
        id: 'corners-try-align',
        kind: 'try',
        setup: { base: 'grip', reverse: `U' (${LBL.cornerInsert})3` },
        goal: { kind: 'stage', stage: 'firstLayer' },
      },
      {
        id: 'corners-try-all',
        kind: 'try',
        setup: { base: 'grip', alg: "R U R' U2 L' U' L U F U2 F' U' B' U B" },
        goal: { kind: 'stage', stage: 'firstLayer' },
      },
    ],
  },
  {
    id: 'middle',
    part: 3,
    steps: [
      { id: 'middle-right', kind: 'talk', turns: false, setup: { base: 'grip', reverse: LBL.middleRight } },
      { id: 'middle-left', kind: 'talk', turns: false, setup: { base: 'grip', reverse: LBL.middleLeft } },
      {
        id: 'middle-try-right',
        kind: 'try',
        setup: { base: 'grip', reverse: LBL.middleRight, keys: LBL.middleRight },
        goal: { kind: 'stage', stage: 'secondLayer' },
      },
      {
        id: 'middle-try-left',
        kind: 'try',
        setup: { base: 'grip', reverse: LBL.middleLeft, keys: LBL.middleLeft },
        goal: { kind: 'stage', stage: 'secondLayer' },
      },
      {
        id: 'middle-try-all',
        kind: 'try',
        setup: {
          base: 'grip',
          alg: `y ${LBL.middleRight} y' U2 ${LBL.middleLeft} y2 ${LBL.middleRight} y2`,
        },
        goal: { kind: 'stage', stage: 'secondLayer' },
      },
    ],
  },
  {
    id: 'yellow-cross',
    part: 3,
    steps: [
      { id: 'yc-cases', kind: 'talk', turns: false, setup: { base: 'grip', alg: `${YC_INV} ${YC_INV} U2 ${YC_INV}`, view: 'top' } },
      { id: 'yc-try-line', kind: 'try', setup: { base: 'grip', reverse: YC, keys: YC, view: 'top' }, goal: { kind: 'stage', stage: 'lastLayerCross' } },
      { id: 'yc-try-l', kind: 'try', setup: { base: 'grip', reverse: `${YC} ${YC}`, keys: YC, view: 'top' }, goal: { kind: 'stage', stage: 'lastLayerCross' } },
      {
        id: 'yc-try-dot',
        kind: 'try',
        setup: { base: 'grip', reverse: `${YC} U2 ${YC} ${YC}`, keys: YC, view: 'top' },
        goal: { kind: 'stage', stage: 'lastLayerCross' },
      },
    ],
  },
  {
    id: 'yellow-corners',
    part: 3,
    steps: [
      { id: 'ycp-intro', kind: 'talk', turns: false, setup: { base: 'grip', reverse: PLACE } },
      {
        id: 'ycp-try',
        kind: 'try',
        setup: { base: 'grip', reverse: PLACE, keys: PLACE },
        goal: { kind: 'stage', stage: 'lastLayerCornersPositioned' },
      },
      {
        id: 'ycp-try-twice',
        kind: 'try',
        setup: { base: 'grip', reverse: `${PLACE} ${PLACE}`, keys: PLACE },
        goal: { kind: 'stage', stage: 'lastLayerCornersPositioned' },
      },
    ],
  },
  {
    id: 'twist-corners',
    part: 3,
    steps: [
      { id: 'yct-intro', kind: 'talk', turns: false, setup: { base: 'grip', reverse: `(${TWIST})4 U (${TWIST})2 U'` } },
      {
        id: 'yct-try',
        kind: 'try',
        setup: { base: 'grip', reverse: `(${TWIST})2 U (${TWIST})4 U'`, keys: TWIST },
        goal: { kind: 'stage', stage: 'lastLayerCornersSolved' },
      },
    ],
  },
  {
    id: 'last-edges',
    part: 3,
    steps: [
      { id: 'le-intro', kind: 'talk', turns: false, setup: { base: 'grip', reverse: EDGES } },
      { id: 'le-try', kind: 'try', setup: { base: 'grip', reverse: EDGES, keys: EDGES }, goal: { kind: 'stage', stage: 'solved' } },
      {
        id: 'le-try-twice',
        kind: 'try',
        setup: { base: 'grip', reverse: `${EDGES} ${EDGES}`, keys: EDGES },
        goal: { kind: 'stage', stage: 'solved' },
      },
    ],
  },
  // ── Part 4: On your own ───────────────────────────────────────────────────
  {
    id: 'full-solve',
    part: 4,
    steps: [
      { id: 'full-recap', kind: 'talk', turns: false, setup: { base: 'grip' } },
      {
        id: 'full-try',
        kind: 'try',
        setup: { base: 'grip', alg: "R2 D' F L' U2 B' R F2 D L2 U' R' B2 F' U" },
        goal: { kind: 'stage', stage: 'solved' },
      },
      { id: 'full-next', kind: 'talk', setup: { base: 'grip', autorotate: true } },
    ],
  },
];
