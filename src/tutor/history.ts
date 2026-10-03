import { invertMove, type Move } from '../engine/moves';
import type { CubeView } from '../render/CubeView';

/**
 * Undo/redo for the learner's own turns. Listens to the view's `move` events
 * and records the ones made by the learner; undo animates the inverse turn.
 */
export class CubeHistory {
  private done: Move[] = [];
  private undone: Move[] = [];
  private replaying = false;
  private readonly off: () => void;

  constructor(private readonly view: CubeView, private readonly onChange: () => void = () => {}) {
    this.off = view.on('move', ({ move, source }) => {
      if (source !== 'user' || this.replaying) return;
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
    const m = this.done.pop();
    if (!m) return;
    this.undone.push(m);
    this.onChange();
    await this.replay(invertMove(m));
  }

  async redo(): Promise<void> {
    const m = this.undone.pop();
    if (!m) return;
    this.done.push(m);
    this.onChange();
    await this.replay(m);
  }

  clear(): void {
    this.done = [];
    this.undone = [];
    this.onChange();
  }

  dispose(): void {
    this.off();
  }

  private async replay(m: Move): Promise<void> {
    this.replaying = true;
    try {
      // Source 'user' keeps exercise checks running on undo/redo too.
      await this.view.turn(m, { source: 'user', duration: 0.22 });
    } finally {
      this.replaying = false;
    }
  }
}
