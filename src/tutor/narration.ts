import type { Locale } from '../i18n/ui';
import { estimateTiming, textHash, timingFromCharacters, type ParsedScript, type ScriptTiming } from './script';

// Narration audio generated at build time by tools/narrate. Each voice has a
// manifest with per-character start times for every clip, so word and cue
// timing is computed here from the current script. Moving a cue marker never
// needs new audio; only changing the spoken words does.

export type VoiceId = 'female' | 'male';

export const VOICES: readonly VoiceId[] = ['female', 'male'];

export interface ManifestClip {
  /** Hash of the spoken text this clip was generated from. */
  hash: string;
  file: string;
  duration: number;
  /** Start time (s) of each character of the spoken text. */
  starts: number[];
}

export interface Manifest {
  model: string;
  clips: Record<string, ManifestClip>;
}

export function audioBase(locale: Locale, voice: VoiceId): string {
  return `/audio/${locale}/${voice}`;
}

export function clipHash(script: ParsedScript): string {
  return textHash(script.text);
}

const manifests = new Map<string, Promise<Manifest | null>>();

export function loadManifest(locale: Locale, voice: VoiceId): Promise<Manifest | null> {
  const key = `${locale}/${voice}`;
  let p = manifests.get(key);
  if (!p) {
    p = fetch(`${audioBase(locale, voice)}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
      .catch(() => null)
      .then((m) => {
        // Don't remember a failure: the next step tries again (e.g. after a network blip).
        if (!m) manifests.delete(key);
        return m;
      });
    manifests.set(key, p);
  }
  return p;
}

export interface ResolvedClip {
  /** null = no matching audio: captions run on estimated timing. */
  url: string | null;
  timing: ScriptTiming;
}

/** Audio URL and timing for one clip, falling back to estimated timing when audio is missing or stale. */
export function resolveClip(
  manifest: Manifest | null,
  locale: Locale,
  voice: VoiceId,
  clipId: string,
  script: ParsedScript,
): ResolvedClip {
  const clip = manifest?.clips[clipId];
  if (!clip || clip.hash !== clipHash(script) || clip.starts.length !== script.text.length) {
    return { url: null, timing: estimateTiming(script) };
  }
  const ends = clip.starts.map((_, i) => clip.starts[i + 1] ?? clip.duration);
  return {
    url: `${audioBase(locale, voice)}/${clip.file}`,
    timing: timingFromCharacters(script, clip.starts, ends, clip.duration),
  };
}
