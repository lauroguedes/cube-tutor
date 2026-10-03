// Calm background music for free play.
//
// Two audio elements take turns so the track loops without a gap: a few
// seconds before one ends, the other starts from the top and they crossfade.
// Starting and stopping always fade, and the music pauses while the tab is
// hidden.

const SRC = '/audio/music/focus.mp3';
const VOLUME = 0.32;
const CROSSFADE = 4;
const FADE = 1.2;

class FocusMusic {
  private players: HTMLAudioElement[] = [];
  private current = 0;
  private wanted = false;
  private fades = new Map<HTMLAudioElement, number>();
  private readonly onVisibility = () => {
    if (!this.wanted) return;
    if (document.hidden) for (const p of this.players) p.pause();
    else void this.players[this.current]?.play().catch(() => {});
  };

  private ensure(): void {
    if (this.players.length) return;
    this.players = [0, 1].map(() => {
      const a = new Audio(SRC);
      a.preload = 'auto';
      a.volume = 0;
      a.addEventListener('timeupdate', () => this.maybeLoop(a));
      return a;
    });
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  get playing(): boolean {
    return this.wanted;
  }

  /** Fade in. Resolves false if the browser blocked playback (no gesture yet). */
  async start(): Promise<boolean> {
    this.ensure();
    this.wanted = true;
    const p = this.players[this.current]!;
    try {
      await p.play();
    } catch {
      this.wanted = false;
      return false;
    }
    this.fadeTo(p, VOLUME, FADE);
    return true;
  }

  stop(): void {
    this.wanted = false;
    for (const p of this.players) this.fadeTo(p, 0, FADE, () => p.pause());
  }

  private maybeLoop(a: HTMLAudioElement): void {
    if (!this.wanted || a !== this.players[this.current] || !a.duration) return;
    if (a.duration - a.currentTime > CROSSFADE) return;
    const next = this.players[1 - this.current]!;
    this.current = 1 - this.current;
    next.currentTime = 0;
    void next.play().catch(() => {});
    this.fadeTo(next, VOLUME, CROSSFADE);
    this.fadeTo(a, 0, CROSSFADE, () => a.pause());
  }

  private fadeTo(a: HTMLAudioElement, target: number, seconds: number, done?: () => void): void {
    cancelAnimationFrame(this.fades.get(a) ?? 0);
    const from = a.volume;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / (seconds * 1000));
      a.volume = from + (target - from) * k;
      if (k < 1) this.fades.set(a, requestAnimationFrame(step));
      else {
        this.fades.delete(a);
        done?.();
      }
    };
    this.fades.set(a, requestAnimationFrame(step));
  }
}

export const focusMusic = new FocusMusic();
