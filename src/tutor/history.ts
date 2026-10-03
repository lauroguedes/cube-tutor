import { invertMove, type Move } from '../engine/moves';
import type { CubeView } from '../render/CubeView';

/**
 * Undo/redo for the learner's own turns. Listens to the view's `move` events
 * and records the ones made by the learner; undo animates the inverse turn.
 *
 * A turn is recorded when it finishes, so undo first waits for the cube to be
 * idle: otherwise a turn still animating would be skipped and the wrong move
 * undone.
 */
export class CubeHistory {
  private done: Move[] = [];
  private undone: Move[] = [];
  /** Undo/redo turns still to come back as `move` events (not learner turns). */
  private replaying = 0;
  private readonly off: () => void;

  constructor(private readonly view: CubeView, private readonly onChange: () => void = () => {}) {
    this.off = view.on('move', ({ move, source }) => {
      if (source !== 'user') return;
      if (this.replaying > 0) {
        this.replaying--;
        return;
      }
      this.done.push(move);
      this.undone = [];
      this.onChange();
    });
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }

  get canRedo(): boolean {
    return this.undone.length > 0;
  }

  get moves(): readonly Move[] {
    return this.done;
  }

  async undo(): Promise<void> {
    await this.view.whenIdle();
    const m = this.done.pop();
    if (!m) return;
    this.undone.push(m);
    this.onChange();
    await this.replay(invertMove(m));
  }

  async redo(): Promise<void> {
    await this.view.whenIdle();
    const m = this.undone.pop();
    if (!m) return;
    this.done.push(m);
    this.onChange();
    await this.replay(m);
  }

  clear(): void {
    this.replaying = 0;
    this.done = [];
    this.undone = [];
    this.onChange();
  }

  dispose(): void {
    this.off();
  }

  private async replay(m: Move): Promise<void> {
    // Source 'user' keeps exercise checks running on undo/redo too; the counter
    // makes the history skip exactly this turn when its `move` event arrives.
    this.replaying++;
    await this.view.turn(m, { source: 'user', duration: 0.22 });
  }
}
