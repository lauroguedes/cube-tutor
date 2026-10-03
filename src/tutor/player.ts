import type { Alg } from '../engine/moves';
import { applyAlg, type CubeState } from '../engine/state';
import type { CubeView } from '../render/CubeView';
import type { Cue, ParsedScript, ScriptTiming } from './script';
import { resolveSelector } from './selectors';

// Plays one narration clip and fires its cues in sync.
//
// The audio element is the master clock: cues fire when playback reaches
// them, so pausing, slowing down or a stalled network never desyncs the cube.
// With no audio (missing clip, muted, autoplay blocked) a reading-speed clock
// drives the same timeline, so captions and moves still work.

export interface PlayerEvents {
  word: number;
  keys: { alg: string | null; active: number };
  playing: boolean;
  ended: void;
}

export interface PlayerOptions {
  view: CubeView;
  script: ParsedScript;
  timing: ScriptTiming;
  audioUrl: string | null;
  /** Resolve a {{state}} cue to a cube state. */
  stateFor: (base: 'home' | 'grip' | 'daisy', alg: Alg) => CubeState;
  rate?: number;
  muted?: boolean;
}

type Listener<T> = (payload: T) => void;

export class NarrationPlayer {
  private readonly audio: HTMLAudioElement | null;
  private clockTime = 0;
  private lastFrame = 0;
  private frame = 0;
  private fired = 0;
  private word = -1;
  private _playing = false;
  private _ended = false;
  private disposed = false;
  private useAudio: boolean;
  private keysAlg: string | null = null;
  private keysActive = -1;
  private readonly offMove: () => void;
  private readonly listeners: { [K in keyof PlayerEvents]: Set<Listener<PlayerEvents[K]>> } = {
    word: new Set(),
    keys: new Set(),
    playing: new Set(),
    ended: new Set(),
  };
  private rate: number;

  constructor(private readonly opts: PlayerOptions) {
    this.rate = opts.rate ?? 1;
    this.audio = opts.audioUrl ? new Audio(opts.audioUrl) : null;
    this.useAudio = !!this.audio && !opts.muted;
    if (this.audio) {
      this.audio.preload = 'auto';
      this.audio.playbackRate = this.rate;
      this.audio.preservesPitch = true;
      this.audio.addEventListener('error', () => this.fallbackToClock());
    }
    // Keycap karaoke: each scripted turn lights the next key.
    this.offMove = opts.view.on('move', ({ source }) => {
      if (source !== 'script' || !this.keysAlg) return;
      const n = this.keysAlg.trim().split(/\s+/).length;
      this.keysActive = (this.keysActive + 1) % n;
      this.emit('keys', { alg: this.keysAlg, active: this.keysActive });
    });
  }

  get playing(): boolean {
    return this._playing;
  }

  get ended(): boolean {
    return this._ended;
  }

  get duration(): number {
    return this.opts.timing.duration;
  }

  get currentTime(): number {
    return this.useAudio && this.audio ? this.audio.currentTime : this.clockTime;
  }

  on<K extends keyof PlayerEvents>(event: K, cb: Listener<PlayerEvents[K]>): () => void {
    this.listeners[event].add(cb);
    return () => this.listeners[event].delete(cb);
  }

  async play(): Promise<void> {
    if (this._ended || this.disposed) return;
    this._playing = true;
    this.emit('playing', true);
    if (this.useAudio && this.audio) {
      try {
        await this.audio.play();
      } catch {
        // Autoplay blocked or decoding failed: keep going on the reading clock.
        this.fallbackToClock();
      }
      // Disposed or paused while waiting for the audio to start: stay silent.
      if (this.disposed || !this._playing) {
        this.audio.pause();
        return;
      }
    }
    this.lastFrame = performance.now();
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this._playing) return;
    this._playing = false;
    this.audio?.pause();
    cancelAnimationFrame(this.frame);
    this.emit('playing', false);
  }

  setRate(rate: number): void {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
  }

  setMuted(muted: boolean): void {
    if (!this.audio) return;
    const t = this.currentTime;
    this.useAudio = !muted;
    if (muted) {
      this.audio.pause();
      this.clockTime = t;
    } else {
      this.audio.currentTime = t;
      if (this._playing) void this.audio.play().catch(() => this.fallbackToClock());
    }
  }

  /**
   * Jump straight to the end: apply every remaining cue instantly.
   * Used when skipping narration, so the cube ends up where the tutor left it.
   */
  finish(): void {
    this.pause();
    const cues = this.opts.script.cues;
    for (; this.fired < cues.length; this.fired++) this.applyCue(cues[this.fired]!.cue, true);
    this.complete();
  }

  dispose(): void {
    this.disposed = true;
    this._playing = false;
    cancelAnimationFrame(this.frame);
    this.offMove();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    for (const set of Object.values(this.listeners)) set.clear();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private tick = (now: number) => {
    if (!this._playing || this.disposed) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.1);
    this.lastFrame = now;
    if (!this.useAudio) this.clockTime += dt * this.rate;
    const t = this.currentTime;

    const { cues } = this.opts.script;
    const times = this.opts.timing.cues;
    while (this.fired < cues.length && times[this.fired]! <= t) {
      this.applyCue(cues[this.fired]!.cue, false);
      this.fired++;
    }

    const words = this.opts.timing.words;
    let w = this.word;
    while (w + 1 < words.length && words[w + 1]![0] <= t) w++;
    if (w !== this.word) {
      this.word = w;
      this.emit('word', w);
    }

    const audioDone = this.useAudio && this.audio ? this.audio.ended : t >= this.opts.timing.duration;
    if (audioDone && this.fired >= cues.length) {
      this.complete();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private complete(): void {
    if (this._ended) return;
    this._playing = false;
    this._ended = true;
    if (this.word !== this.opts.script.words.length - 1) {
      this.word = this.opts.script.words.length - 1;
      this.emit('word', this.word);
    }
    this.emit('playing', false);
    this.emit('ended', undefined);
  }

  private fallbackToClock(): void {
    if (!this.useAudio) return;
    this.clockTime = this.audio?.currentTime ?? this.clockTime;
    this.useAudio = false;
  }

  private applyCue(cue: Cue, instant: boolean): void {
    const view = this.opts.view;
    switch (cue.type) {
      case 'move':
        if (instant) {
          view.cancelTurns();
          view.setState(applyAlg(view.state, cue.alg));
        } else void view.play(cue.alg);
        break;
      case 'state':
        view.setState(this.opts.stateFor(cue.base, cue.alg));
        break;
      case 'highlight':
        view.highlight(cue.target ? resolveSelector(cue.target, view.state) : null);
        break;
      case 'arrow':
        view.showArrow(cue.move);
        break;
      case 'view':
        view.setView(cue.view);
        break;
      case 'labels':
        view.setLabels(cue.on);
        break;
      case 'explode':
        view.setExplode(cue.on ? 1 : 0);
        break;
      case 'autorotate':
        view.autoRotate = cue.on;
        break;
      case 'keys':
        this.keysAlg = cue.alg;
        this.keysActive = -1;
        this.emit('keys', { alg: cue.alg, active: -1 });
        break;
    }
  }

  private emit<K extends keyof PlayerEvents>(event: K, payload: PlayerEvents[K]): void {
    for (const cb of this.listeners[event]) cb(payload);
  }
}
