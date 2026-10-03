import { describe, expect, it } from 'vitest';
import { formatAlg } from '../engine/moves';
import { ScriptError, estimateTiming, parseScript, timingFromCharacters } from './script';

describe('parseScript', () => {
  it('removes markers and records where they fire', () => {
    const s = parseScript('Watch the right face. {{move R}} It turns away from you.');
    expect(s.text).toBe('Watch the right face. It turns away from you.');
    expect(s.cues).toHaveLength(1);
    expect(s.text.slice(s.cues[0]!.at)).toMatch(/^It turns/);
    const cue = s.cues[0]!.cue;
    expect(cue.type === 'move' && formatAlg(cue.alg)).toBe('R');
  });

  it('handles markers at the start, middle of a word gap and end', () => {
    const s = parseScript('{{view top}}Look at the top.{{highlight none}}  Done. {{labels off}}');
    expect(s.text).toBe('Look at the top. Done.');
    expect(s.cues.map((c) => c.at)).toEqual([0, 17, 22]);
  });

  it('normalises whitespace and line breaks', () => {
    const s = parseScript('One,\n   two {{move U}}\n three.');
    expect(s.text).toBe('One, two three.');
    expect(s.text.slice(s.cues[0]!.at)).toBe('three.');
  });

  it('splits words with character ranges', () => {
    const s = parseScript("Turn R prime, then U.");
    expect(s.words.map((w) => w.text)).toEqual(['Turn', 'R', 'prime,', 'then', 'U.']);
    expect(s.text.slice(s.words[2]!.start, s.words[2]!.end)).toBe('prime,');
  });

  it('parses every cue type', () => {
    const s = parseScript(
      '{{moves R U R\' U\'}}{{highlight type:corner}}{{highlight piece:white,green}}{{highlight pieces:white,green;white,red}}' +
        "{{highlight layer:U}}{{arrow R'}}{{arrow none}}{{view bottom}}{{labels on}}{{explode on}}{{autorotate off}}" +
        "{{state grip: R U}}{{state F2}}{{keys R U R' U'}}{{keys none}}Hi.",
    );
    expect(s.cues.map((c) => c.cue.type)).toEqual([
      'move', 'highlight', 'highlight', 'highlight', 'highlight', 'arrow', 'arrow',
      'view', 'labels', 'explode', 'autorotate', 'state', 'state', 'keys', 'keys',
    ]);
    const grip = s.cues[11]!.cue;
    expect(grip.type === 'state' && grip.base).toBe('grip');
  });

  it('rejects unknown or malformed cues', () => {
    expect(() => parseScript('{{dance R}}')).toThrow(ScriptError);
    expect(() => parseScript('{{arrow R U}}')).toThrow(ScriptError);
    expect(() => parseScript('{{view sideways}}')).toThrow(ScriptError);
    expect(() => parseScript('{{highlight type:triangle}}')).toThrow(ScriptError);
    expect(() => parseScript('{{move Q}}')).toThrow();
  });
});

describe('timing', () => {
  it('maps character timestamps to words and cues', () => {
    const s = parseScript('Go {{move R}}now.');
    // "Go now." = 7 chars, 0.1 s each
    const starts = [...s.text].map((_, i) => i * 0.1);
    const ends = starts.map((t) => t + 0.1);
    const timing = timingFromCharacters(s, starts, ends);
    expect(timing.words).toEqual([
      [0, 0.2],
      [0.3, 0.7],
    ]);
    expect(timing.cues).toEqual([0.3]);
    expect(timing.duration).toBeCloseTo(0.7);
  });

  it('estimates timing without audio, monotonically', () => {
    const s = parseScript('First sentence. {{move R}}Second, with a pause.');
    const t = estimateTiming(s);
    const flat = t.words.flat();
    expect([...flat].sort((a, b) => a - b)).toEqual(flat);
    expect(t.cues[0]).toBeGreaterThan(t.words[1]![1]);
    expect(t.duration).toBeGreaterThan(flat[flat.length - 1]!);
  });
});
