import { parseAlg, type Move } from '../engine/moves';

// Narration scripts with inline cue markers, e.g.
//
//   "Watch the right face. {{move R}} It turns away from you."
//
// The marker is removed from the spoken text and remembered at that character
// offset. At build time the TTS character timestamps turn each offset into a
// time, so the cube moves exactly on the word that follows the marker.
//
// This module is shared by the browser and the narration build tool, so the
// text sent to the voice and the text shown as captions are always identical.

export type ViewCue = 'default' | 'front' | 'top' | 'bottom' | 'back' | 'right' | 'left';

/** Which pieces a highlight refers to; resolved against the cube state at the moment it fires. */
export type PieceSelector =
  | { kind: 'type'; types: ('center' | 'edge' | 'corner')[] }
  | { kind: 'pieces'; pieces: string[][] }
  | { kind: 'layer'; face: 'U' | 'D' | 'F' | 'B' | 'R' | 'L' };

export type Cue =
  | { type: 'move'; alg: Move[] }
  | { type: 'highlight'; target: PieceSelector | null }
  | { type: 'arrow'; move: Move | null }
  | { type: 'view'; view: ViewCue }
  | { type: 'labels'; on: boolean }
  | { type: 'explode'; on: boolean }
  | { type: 'autorotate'; on: boolean }
  | { type: 'state'; base: 'home' | 'grip' | 'daisy'; alg: Move[] }
  | { type: 'keys'; alg: string | null };

export interface TimedCue {
  /** Character offset in the clean text where the cue fires. */
  readonly at: number;
  readonly cue: Cue;
}

export interface Word {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export interface ParsedScript {
  /** Text without markers: what is spoken and shown as captions. */
  readonly text: string;
  readonly cues: readonly TimedCue[];
  readonly words: readonly Word[];
}

export class ScriptError extends Error {}

const VIEWS: readonly ViewCue[] = ['default', 'front', 'top', 'bottom', 'back', 'right', 'left'];
const FACES = ['U', 'D', 'F', 'B', 'R', 'L'] as const;

function onOff(arg: string, where: string): boolean {
  if (arg === 'on') return true;
  if (arg === 'off') return false;
  throw new ScriptError(`Expected "on" or "off" in ${where}`);
}

function parseSelector(arg: string, where: string): PieceSelector | null {
  if (arg === 'none') return null;
  const [kind, rest = ''] = arg.split(':').map((s) => s.trim()) as [string, string?];
  if (kind === 'type') {
    const types = rest.split(',').map((s) => s.trim());
    for (const t of types)
      if (t !== 'center' && t !== 'edge' && t !== 'corner') throw new ScriptError(`Unknown piece type "${t}" in ${where}`);
    return { kind: 'type', types: types as ('center' | 'edge' | 'corner')[] };
  }
  if (kind === 'piece' || kind === 'pieces') {
    return { kind: 'pieces', pieces: rest.split(';').map((p) => p.split(',').map((c) => c.trim())) };
  }
  if (kind === 'layer') {
    const face = rest as (typeof FACES)[number];
    if (!FACES.includes(face)) throw new ScriptError(`Unknown layer "${rest}" in ${where}`);
    return { kind: 'layer', face };
  }
  throw new ScriptError(`Unknown highlight "${arg}" in ${where}`);
}

export function parseCue(name: string, arg: string): Cue {
  const where = `{{${name} ${arg}}}`;
  switch (name) {
    case 'move':
    case 'moves':
      return { type: 'move', alg: parseAlg(arg) };
    case 'highlight':
      return { type: 'highlight', target: parseSelector(arg, where) };
    case 'arrow': {
      if (arg === 'none') return { type: 'arrow', move: null };
      const alg = parseAlg(arg);
      if (alg.length !== 1) throw new ScriptError(`An arrow shows exactly one move: ${where}`);
      return { type: 'arrow', move: alg[0]! };
    }
    case 'view':
      if (!VIEWS.includes(arg as ViewCue)) throw new ScriptError(`Unknown view in ${where}`);
      return { type: 'view', view: arg as ViewCue };
    case 'labels':
      return { type: 'labels', on: onOff(arg, where) };
    case 'explode':
      return { type: 'explode', on: onOff(arg, where) };
    case 'autorotate':
      return { type: 'autorotate', on: onOff(arg, where) };
    case 'state': {
      const m = /^(home|grip|daisy)\s*:?\s*(.*)$/.exec(arg);
      if (m) return { type: 'state', base: m[1] as 'home' | 'grip' | 'daisy', alg: parseAlg(m[2] ?? '') };
      return { type: 'state', base: 'home', alg: parseAlg(arg) };
    }
    case 'keys':
      if (arg === 'none') return { type: 'keys', alg: null };
      parseAlg(arg); // validate
      return { type: 'keys', alg: arg };
    default:
      throw new ScriptError(`Unknown cue "${name}" in ${where}`);
  }
}

const MARKER = /\{\{\s*([a-z]+)\s*([^}]*?)\s*\}\}/g;

export function parseScript(source: string): ParsedScript {
  const cues: TimedCue[] = [];
  let text = '';
  let last = 0;
  for (const m of source.matchAll(MARKER)) {
    text += source.slice(last, m.index);
    last = m.index + m[0].length;
    // Removing "word {{cue}} word" would leave two spaces: drop one.
    if (text.endsWith(' ') && /^\s/.test(source.slice(last))) text = text.slice(0, -1);
    cues.push({ at: text.length, cue: parseCue(m[1]!, m[2]!) });
  }
  text += source.slice(last);

  // Normalise whitespace, keeping cue offsets aligned.
  const raw = text;
  let clean = '';
  const map: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    map[i] = clean.length;
    const ch = raw[i]!;
    if (/\s/.test(ch)) {
      if (clean.length === 0 || clean.endsWith(' ')) continue;
      clean += ' ';
    } else clean += ch;
  }
  map[raw.length] = clean.length;
  const trimmedEnd = clean.trimEnd();
  const shifted = cues.map((c) => {
    // A cue right after a space fires at the next word.
    let at = Math.min(map[c.at]!, trimmedEnd.length);
    if (trimmedEnd[at] === ' ') at++;
    return { at: Math.min(at, trimmedEnd.length), cue: c.cue };
  });

  const words: Word[] = [];
  for (const w of trimmedEnd.matchAll(/\S+/g)) words.push({ text: w[0], start: w.index, end: w.index + w[0].length });

  return { text: trimmedEnd, cues: shifted, words };
}

// ─── Timing ─────────────────────────────────────────────────────────────────

/** Times (seconds) for the words and cues of one narrated script. */
export interface ScriptTiming {
  readonly duration: number;
  /** [start, end] per word. */
  readonly words: readonly (readonly [number, number])[];
  /** Fire time per cue. */
  readonly cues: readonly number[];
}

/**
 * Turn per-character timestamps (as returned by the TTS) into word and cue times.
 * `charStarts[i]`/`charEnds[i]` belong to `script.text[i]`.
 */
export function timingFromCharacters(
  script: ParsedScript,
  charStarts: readonly number[],
  charEnds: readonly number[],
  duration?: number,
): ScriptTiming {
  const n = script.text.length;
  const startAt = (i: number) => (i < n ? charStarts[i]! : charEnds[n - 1] ?? 0);
  const endAt = (i: number) => charEnds[Math.min(i, n - 1)] ?? 0;
  return {
    duration: duration ?? charEnds[n - 1] ?? 0,
    words: script.words.map((w) => [round(startAt(w.start)), round(endAt(w.end - 1))] as const),
    cues: script.cues.map((c) => round(startAt(c.at))),
  };
}

/** Reading-speed timing for when no audio is available (captions only). */
export function estimateTiming(script: ParsedScript, charsPerSecond = 14): ScriptTiming {
  const starts: number[] = [];
  const ends: number[] = [];
  let t = 0.3;
  for (const ch of script.text) {
    starts.push(t);
    t += /[.!?]/.test(ch) ? 0.45 : /[,;:—]/.test(ch) ? 0.2 : 1 / charsPerSecond;
    ends.push(t);
  }
  return timingFromCharacters(script, starts, ends, t + 0.4);
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/** Stable 32-bit FNV-1a hash (hex), used to detect when narration text changed. */
export function textHash(...parts: string[]): string {
  let h = 0x811c9dc5;
  for (const ch of parts.join('\u0000')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
