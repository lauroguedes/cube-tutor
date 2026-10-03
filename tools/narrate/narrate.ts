// Generates the tutor's narration with ElevenLabs.
//
//   npm run narrate               generate missing or changed clips, both voices
//   npm run narrate -- --dry-run  show what would be generated and how many characters
//   npm run narrate -- --voice female --only welcome-intro
//
// Each clip is requested with character timestamps, saved as an MP3, and its
// per-character start times are written to public/audio/<locale>/<voice>/manifest.json.
// A clip is regenerated only when its text, voice or model changes.
// The API key is read from .env and is never shipped to the browser.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { narrationItems } from '../../src/course/index';
import { defaultLocale, type Locale } from '../../src/i18n/ui';
import { clipHash, type Manifest, type ManifestClip, type VoiceId } from '../../src/tutor/narration';
import { textHash } from '../../src/tutor/script';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_FORMAT = 'mp3_44100_96';

interface Args {
  dryRun: boolean;
  voices: VoiceId[];
  only: Set<string> | null;
  locale: Locale;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, voices: ['female', 'male'], only: null, locale: defaultLocale, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--voice') args.voices = [argv[++i] as VoiceId];
    else if (a === '--only') args.only = new Set(argv[++i]!.split(','));
    else if (a === '--locale') args.locale = argv[++i] as Locale;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function env(name: string, ...fallbacks: string[]): string {
  for (const n of [name, ...fallbacks]) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  throw new Error(`Missing ${name} in .env`);
}

function voiceIdFor(voice: VoiceId): string {
  // ELEVENLABS_VOICE_MAILE_ID is accepted too (spelling used in the original .env).
  return voice === 'male'
    ? env('ELEVENLABS_VOICE_MALE_ID', 'ELEVENLABS_VOICE_MAILE_ID')
    : env('ELEVENLABS_VOICE_FEMALE_ID');
}

interface TtsResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  } | null;
}

async function synthesize(text: string, voiceId: string, model: string, apiKey: string, context: { previous?: string; next?: string }): Promise<TtsResponse> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  const body = JSON.stringify({
    text,
    model_id: model,
    previous_text: context.previous,
    next_text: context.next,
  });
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });
    if (res.ok) return (await res.json()) as TtsResponse;
    const detail = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 5) throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
    const wait = 1500 * 2 ** (attempt - 1);
    console.warn(`  ${res.status}, retrying in ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

/** Per-character start times for `text`, from the TTS alignment. */
function characterStarts(text: string, alignment: NonNullable<TtsResponse['alignment']>): { starts: number[]; duration: number } {
  const chars = alignment.characters;
  const s = alignment.character_start_times_seconds;
  const e = alignment.character_end_times_seconds;
  const duration = e[e.length - 1] ?? 0;
  if (chars.join('') === text) return { starts: s.map(round), duration: round(duration + 0.25) };

  // The alignment text differs slightly (e.g. normalised quotes): map proportionally.
  console.warn(`  alignment text differs from script; mapping proportionally`);
  const starts = [...text].map((_, i) => round(s[Math.min(s.length - 1, Math.floor((i / text.length) * s.length))] ?? 0));
  return { starts, duration: round(duration + 0.25) };
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
  const model = process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_v4';

  const items = narrationItems(args.locale).filter((it) => !args.only || args.only.has(it.id));
  let totalChars = 0;

  for (const voice of args.voices) {
    let voiceId: string;
    try {
      voiceId = voiceIdFor(voice);
    } catch (err) {
      if (!args.dryRun) throw err;
      voiceId = 'unknown'; // a dry run still reports counts without voice ids
    }
    const dir = join(ROOT, 'public', 'audio', args.locale, voice);
    const manifestPath = join(dir, 'manifest.json');
    mkdirSync(dir, { recursive: true });
    const manifest: Manifest & { clips: Record<string, ManifestClip & { source?: string }> } = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath, 'utf8'))
      : { model, clips: {} };
    manifest.model = model;

    const todo = items.filter((it) => {
      const existing = manifest.clips[it.id];
      const source = textHash(it.script.text, voiceId, model);
      return args.force || !existing || existing.source !== source || !existsSync(join(dir, existing.file));
    });
    const chars = todo.reduce((n, it) => n + it.script.text.length, 0);
    totalChars += chars;
    console.log(`${voice}: ${todo.length} of ${items.length} clips to generate (${chars.toLocaleString()} characters)`);
    if (args.dryRun || todo.length === 0) continue;

    const apiKey = env('ELEVENLABS_API_KEY');
    for (const [n, it] of todo.entries()) {
      const index = items.indexOf(it);
      const sameLesson = (j: number) => items[j] && items[j]!.id.split('-')[0] === it.id.split('-')[0];
      const previous = sameLesson(index - 1) ? items[index - 1]!.script.text : undefined;
      const next = sameLesson(index + 1) && !items[index + 1]!.id.endsWith('--done') ? items[index + 1]!.script.text : undefined;

      process.stdout.write(`  [${n + 1}/${todo.length}] ${it.id}… `);
      const res = await synthesize(it.script.text, voiceId, model, apiKey, { previous, next });
      if (!res.alignment) throw new Error(`No timestamps returned for ${it.id}`);
      const file = `${it.id}.mp3`;
      writeFileSync(join(dir, file), Buffer.from(res.audio_base64, 'base64'));
      const { starts, duration } = characterStarts(it.script.text, res.alignment);
      manifest.clips[it.id] = { hash: clipHash(it.script), source: textHash(it.script.text, voiceId, model), file, duration, starts };
      // Save after every clip so an interrupted run keeps its progress.
      writeFileSync(manifestPath, JSON.stringify(manifest));
      console.log(`${duration.toFixed(1)}s`);
    }

    // Drop clips that no longer exist in the course.
    const ids = new Set(narrationItems(args.locale).map((it) => it.id));
    for (const id of Object.keys(manifest.clips)) if (!ids.has(id)) delete manifest.clips[id];
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }

  console.log(`${args.dryRun ? 'Would generate' : 'Generated'} ${totalChars.toLocaleString()} characters in total.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
