// The click of a layer turning, played with the Web Audio API.
//
// Each recorded variant is analysed once after loading: playback starts at
// the click itself (generated clips have a little silence first) and volumes
// are evened out. Every turn picks a different variant at a slightly random
// pitch, so a fast sequence sounds like a real cube, not a loop.

interface Variant {
  buffer: AudioBuffer;
  /** Seconds of silence before the click. */
  offset: number;
  /** Gain that brings the variant to a common peak level. */
  gain: number;
}

const FILES = [1, 2, 3, 4].map((n) => `/audio/sfx/turn-${n}.mp3`);
const VOLUME = 0.5;

class TurnSounds {
  private ctx: AudioContext | null = null;
  private variants: Variant[] = [];
  private loading: Promise<void> | null = null;
  private last = -1;
  private lastAt = 0;

  /** Start loading (call early; playback waits for a user gesture anyway). */
  preload(): void {
    if (this.loading || typeof window === 'undefined' || !('AudioContext' in window)) return;
    this.ctx = new AudioContext();
    // Browsers keep audio suspended until the visitor interacts with the page.
    const resume = () => void this.ctx?.resume();
    window.addEventListener('pointerdown', resume, { once: true, capture: true });
    window.addEventListener('keydown', resume, { once: true, capture: true });
    this.loading = Promise.all(FILES.map((f) => this.load(f))).then((vs) => {
      this.variants = vs.filter((v): v is Variant => v !== null);
    });
  }

  private async load(url: string): Promise<Variant | null> {
    try {
      const data = await (await fetch(url)).arrayBuffer();
      const buffer = await this.ctx!.decodeAudioData(data);
      const samples = buffer.getChannelData(0);
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s));
      if (peak < 0.01) return null; // effectively silent: skip it
      const first = samples.findIndex((s) => Math.abs(s) > peak * 0.12);
      const offset = Math.max(0, first / buffer.sampleRate - 0.004);
      return { buffer, offset, gain: Math.min(4, 0.6 / peak) };
    } catch {
      return null;
    }
  }

  /** Play one turn click. `fast` turns (scrambles, demos) are softer. */
  play(opts: { fast?: boolean } = {}): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || this.variants.length === 0) return;
    const now = ctx.currentTime;
    // Turns closer than 30 ms blur together: one click is enough.
    if (now - this.lastAt < 0.03) return;
    const rushed = opts.fast || now - this.lastAt < 0.15;
    this.lastAt = now;

    let i = Math.floor(Math.random() * this.variants.length);
    if (i === this.last && this.variants.length > 1) i = (i + 1) % this.variants.length;
    this.last = i;
    const v = this.variants[i]!;

    const source = ctx.createBufferSource();
    source.buffer = v.buffer;
    source.playbackRate.value = 0.93 + Math.random() * 0.14;
    const gain = ctx.createGain();
    gain.gain.value = v.gain * VOLUME * (rushed ? 0.55 : 1);
    source.connect(gain).connect(ctx.destination);
    source.start(now, v.offset);
  }
}

export const turnSounds = new TurnSounds();
