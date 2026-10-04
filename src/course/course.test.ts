import { describe, expect, it } from 'vitest';
import { parseAlg } from '../engine/moves';
import { applyAlg, SOLVED } from '../engine/state';
import { ui } from '../i18n/ui';
import { parseScript } from '../tutor/script';
import { LESSONS, courseText, narrationItems } from './index';
import { isGoalMet, startState, stepSolution } from './setup';

// Course integrity: every step has text in every language, every script
// parses, no task starts already solved, and every "Show me" solution works.

const steps = LESSONS.flatMap((l) => l.steps.map((s) => ({ lesson: l.id, ...s })));

describe('course structure', () => {
  it('has unique lesson and step ids', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });

  it('every try step has a goal, and talk steps have none', () => {
    for (const s of steps) expect(!!s.goal, s.id).toBe(s.kind === 'try');
  });
});

describe.each(Object.keys(ui) as (keyof typeof ui)[])('text (%s)', (locale) => {
  const text = courseText(locale);

  it('has a title for every lesson and a name for every part', () => {
    for (const l of LESSONS) {
      expect(text.lessons[l.id]?.title, l.id).toBeTruthy();
      expect(text.parts[l.part]).toBeTruthy();
    }
  });

  it.each(steps.map((s) => [s.id, s] as const))('%s has narration that parses', (_, s) => {
    const t = text.steps[s.id];
    expect(t, `missing text for ${s.id}`).toBeDefined();
    expect(() => parseScript(t!.say)).not.toThrow();
    if (s.kind === 'try') {
      expect(t!.done, `${s.id} needs a "done" line`).toBeTruthy();
      expect(t!.hints?.length, `${s.id} needs hints`).toBeGreaterThan(0);
    }
  });

  it.each(steps.map((s) => [s.id] as const))('%s has the same cues as English', (id) => {
    const cues = (say: string) => parseScript(say).cues.map((c) => JSON.stringify(c.cue));
    expect(cues(text.steps[id]!.say)).toEqual(cues(courseText('en').steps[id]!.say));
  });

  it('has no leftover marker braces in spoken text', () => {
    for (const item of narrationItems(locale)) {
      expect(item.script.text, item.id).not.toMatch(/[{}]/);
    }
  });
});

describe('tasks', () => {
  const tasks = steps.filter((s) => s.kind === 'try');

  it.each(tasks.map((s) => [s.id, s] as const))('%s is not already solved at the start', (_, s) => {
    const start = startState(s.setup);
    if (s.goal!.kind === 'turns' || s.goal!.kind === 'pick') return;
    expect(isGoalMet(s.goal!, { start, state: start, turns: 0, picks: new Set() })).toBe(false);
  });

  it.each(tasks.filter((s) => stepSolution(s)).map((s) => [s.id, s] as const))(
    '%s is completed by its "Show me" solution',
    (_, s) => {
      const start = startState(s.setup);
      const end = applyAlg(start, parseAlg(stepSolution(s)!));
      expect(isGoalMet(s.goal!, { start, state: end, turns: 1, picks: new Set() })).toBe(true);
    },
  );

  it('the corner placement task starts with the cross intact', async () => {
    const { isCrossSolved } = await import('../engine/predicates');
    const s = steps.find((x) => x.id === 'corners-try-all')!;
    expect(isCrossSolved(startState(s.setup))).toBe(true);
  });

  it('the middle layer task starts with the first layer intact', async () => {
    const { isFirstLayerSolved } = await import('../engine/predicates');
    const s = steps.find((x) => x.id === 'middle-try-all')!;
    expect(isFirstLayerSolved(startState(s.setup))).toBe(true);
  });

  it('the home state is solved (sanity)', () => {
    expect(startState(undefined)).toEqual(SOLVED);
  });
});
