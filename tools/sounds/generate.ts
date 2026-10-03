// Generates the cube's sound effects and the free play focus music with
// ElevenLabs. Files are written once and committed; re-run only to change them.
//
//   npm run sounds              generate anything missing
//   npm run sounds -- --force   regenerate everything
//
// public/audio/sfx/turn-<n>.mp3   short layer-turn clicks (played with slight random pitch)
// public/audio/music/focus.mp3    calm instrumental loop for free play

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO = join(ROOT, 'public', 'audio');
const force = process.argv.includes('--force');

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY in .env');

const TURN_PROMPT =
  'A single quick click of a modern speed cube layer being turned ninety degrees by hand, smooth plastic snap, close up, dry studio, no reverb, no music';
const TURN_VARIANTS = 4;
const MUSIC_PROMPT =
  'Calm instrumental lo-fi for focus and concentration: soft Rhodes piano chords, warm analog pads, gentle brushed drums, subtle vinyl crackle, slow tempo around 70 BPM, relaxed and steady, no vocals, no lyrics';
const MUSIC_LENGTH_MS = 150_000;

async function post(path: string, body: unknown): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.elevenlabs.io${path}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detail = await res.text();
    if ((res.status !== 429 && res.status < 500) || attempt >= 4) throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

function need(file: string): boolean {
  mkdirSync(dirname(file), { recursive: true });
  return force || !existsSync(file);
}

for (let i = 1; i <= TURN_VARIANTS; i++) {
  const file = join(AUDIO, 'sfx', `turn-${i}.mp3`);
  if (!need(file)) continue;
  process.stdout.write(`turn-${i}.mp3… `);
  writeFileSync(
    file,
    await post('/v1/sound-generation?output_format=mp3_44100_128', {
      text: TURN_PROMPT,
      duration_seconds: 0.5,
      prompt_influence: 0.7,
    }),
  );
  console.log('done');
}

const music = join(AUDIO, 'music', 'focus.mp3');
if (need(music)) {
  process.stdout.write('focus.mp3 (this takes a minute)… ');
  writeFileSync(music, await post('/v1/music?output_format=mp3_44100_128', { prompt: MUSIC_PROMPT, music_length_ms: MUSIC_LENGTH_MS }));
  console.log('done');
}
