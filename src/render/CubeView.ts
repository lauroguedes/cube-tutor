import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FACE_NORMAL, type Face } from '../engine/faces';
import { AXIS_INDEX, mulVec, type Axis, type Mat3 } from '../engine/geometry';
import { MOVE_SPECS, moveQuarters, type Alg, type Amount, type Move, type MoveName } from '../engine/moves';
import { CUBIES, SOLVED, applyMove, type CubeState } from '../engine/state';
import { buildMoveArrow } from './arrow';
import { buildContactShadow, buildCore, buildCubies, buildFaceLabel, disposeCubies, onLogoReady, type CubieMesh, type FaceLabel } from './meshes';
import { DIM_HEX, type CubeStyle } from './palette';

// The interactive 3D cube. Framework-free: a Vue island owns one instance.
//
// Every cubie's transform is derived from the engine state (rotation matrix ×
// home position), so the picture can never drift from the logic. A turn in
// progress is drawn as an extra rotation on the affected cubies; when it ends
// the engine state advances and the transforms are rebuilt from it.

export type MoveSource = 'user' | 'script';

export interface CubeViewEvents {
  /** A turn finished; `state` is the new state. */
  move: { move: Move; source: MoveSource; state: CubeState };
  /** The learner tapped a piece without dragging. */
  pick: { cubieId: number };
  /** The learner started dragging a layer. */
  turnstart: Record<string, never>;
}

export interface Interaction {
  turns: boolean;
  orbit: boolean;
  pick: boolean;
}

export type ViewName = 'default' | 'front' | 'top' | 'bottom' | 'back' | 'right' | 'left';

const VIEWS: Record<ViewName, { theta: number; phi: number }> = {
  default: { theta: Math.PI * 0.19, phi: Math.PI * 0.32 },
  front: { theta: 0, phi: Math.PI * 0.42 },
  top: { theta: Math.PI * 0.19, phi: Math.PI * 0.12 },
  bottom: { theta: Math.PI * 0.19, phi: Math.PI * 0.82 },
  back: { theta: Math.PI * 1.19, phi: Math.PI * 0.32 },
  right: { theta: Math.PI * 0.5, phi: Math.PI * 0.4 },
  left: { theta: -Math.PI * 0.5, phi: Math.PI * 0.4 },
};

const QUARTER = Math.PI / 2;
const AXIS_VECTORS: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

interface ActiveTurn {
  axis: Axis;
  ids: number[];
  from: number;
  to: number;
  elapsed: number;
  duration: number;
  ease: (t: number) => number;
  /** Move to commit when done (null = spring back, nothing changes). */
  move: Move | null;
  source: MoveSource;
  resolve: (completed: boolean) => void;
}

interface QueuedTurn {
  move: Move;
  duration: number;
  source: MoveSource;
  resolve: (completed: boolean) => void;
}

type PointerMode =
  | { kind: 'idle' }
  | { kind: 'pending'; id: number; start: THREE.Vector2; cubieId: number | null; hitPoint: THREE.Vector3 | null }
  | {
      kind: 'turning';
      id: number;
      start: THREE.Vector2;
      axis: Axis;
      axisSign: number;
      layer: number;
      ids: number[];
      screenDir: THREE.Vector2;
      pxPerUnit: number;
      angle: number;
    }
  | { kind: 'orbit'; id: number; last: THREE.Vector2 };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class CubeView {
  readonly interaction: Interaction = { turns: true, orbit: true, pick: false };
  private readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Multiplier for animation speed (2 = twice as fast). */
  speed = 1;
  autoRotate = false;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private readonly root = new THREE.Group();
  private cubies: CubieMesh[];
  private style: CubeStyle;
  private readonly core: THREE.Group;
  private readonly shadow: ReturnType<typeof buildContactShadow>;
  private readonly labels = new THREE.Group();
  private readonly faceLabels: { label: FaceLabel; opacity: number }[] = [];
  private readonly labelRay = new THREE.Ray();
  private readonly labelBox = new THREE.Box3();
  private readonly labelHit = new THREE.Vector3();
  private readonly labelPos = new THREE.Vector3();
  private readonly tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.32);
  private arrow: THREE.Group | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly resizeObserver: ResizeObserver;
  private readonly offLogo: () => void;
  private readonly listeners: { [K in keyof CubeViewEvents]: Set<(e: CubeViewEvents[K]) => void> } = {
    move: new Set(),
    pick: new Set(),
    turnstart: new Set(),
  };

  private _state: CubeState = SOLVED;
  private queue: QueuedTurn[] = [];
  private active: ActiveTurn | null = null;
  private pointer: PointerMode = { kind: 'idle' };
  private highlighted: Set<number> | null = null;
  private pulseUntil = 0;
  private idleWaiters: (() => void)[] = [];
  private explode = { value: 0, target: 0 };
  private orbit = { theta: VIEWS.default.theta, phi: VIEWS.default.phi, vTheta: 0, vPhi: 0 };
  private viewTween: { from: { theta: number; phi: number }; to: { theta: number; phi: number }; t: number } | null =
    null;
  private distance = 12;
  private width = 1;
  private height = 1;
  /** Where the cube sits in the frame: x/y in fractions of the view (+x right, +y down), zoom > 1 = smaller. */
  private framing = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tzoom: 1 };
  private lastTime = performance.now();
  private frame = 0;
  private dirty = true;
  private disposed = false;

  constructor(private readonly container: HTMLElement, initial: CubeState = SOLVED, style: CubeStyle = 'classic') {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.5;

    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(4, 7, 5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xbcd2ff, 0.5);
    rim.position.set(-5, 2, -4);
    this.scene.add(rim);

    this.style = style;
    this.cubies = buildCubies(style);
    for (const c of this.cubies) this.root.add(c.group);
    this.core = buildCore();
    this.root.add(this.core);
    this.scene.add(this.root);
    this.shadow = buildContactShadow();
    this.scene.add(this.shadow);
    this.buildLabels();
    this.labels.visible = false;
    this.scene.add(this.labels);

    this._state = initial;
    this.syncTransforms();

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);

    this.offLogo = onLogoReady(() => (this.dirty = true));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.loop();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  get state(): CubeState {
    return this._state;
  }

  get busy(): boolean {
    return this.active !== null || this.queue.length > 0;
  }

  on<K extends keyof CubeViewEvents>(event: K, cb: (e: CubeViewEvents[K]) => void): () => void {
    this.listeners[event].add(cb);
    return () => this.listeners[event].delete(cb);
  }

  /** Jump to a state instantly, cancelling any queued or running turns. */
  setState(state: CubeState): void {
    this.cancelTurns();
    this._state = state;
    this.syncTransforms();
  }

  /** Animate one move. Resolves true when it has finished, false if it was cancelled. */
  turn(move: Move, opts: { duration?: number; source?: MoveSource } = {}): Promise<boolean> {
    const half = Math.abs(move.amount) === 2;
    const duration = opts.duration ?? (half ? 0.5 : 0.34);
    return new Promise((resolve) => {
      this.queue.push({ move, duration, source: opts.source ?? 'script', resolve });
      this.dirty = true;
    });
  }

  /** Animate a sequence of moves. */
  async play(alg: Alg, opts: { duration?: number; source?: MoveSource } = {}): Promise<void> {
    await Promise.all(alg.map((m) => this.turn(m, opts)));
  }

  /** Resolves once no turn is running or queued and no layer is being dragged. */
  whenIdle(): Promise<void> {
    if (!this.busy && this.pointer.kind !== 'turning') return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  /** Stop all animation; queued turns are dropped (their promises still resolve). */
  cancelTurns(): void {
    for (const q of this.queue) q.resolve(false);
    this.queue = [];
    if (this.active) {
      this.active.resolve(false);
      this.active = null;
    }
    if (this.pointer.kind === 'turning') this.pointer = { kind: 'idle' };
    this.syncTransforms();
  }

  /** Switch to another cube look, keeping the position, turns in progress and highlights. */
  setStyle(style: CubeStyle): void {
    if (style === this.style) return;
    this.style = style;
    for (const c of this.cubies) this.root.remove(c.group);
    disposeCubies(this.cubies);
    this.cubies = buildCubies(style);
    for (const c of this.cubies) this.root.add(c.group);
    this.syncTransforms();
    this.paintHighlight();
    // Re-apply the steady highlight glow on the new materials.
    if (this.highlighted && this.pulseUntil === 0) this.pulseUntil = performance.now();
    if (this.pointer.kind === 'turning') this.applyTurnAngle(this.pointer.axis, this.pointer.ids, this.pointer.angle);
  }

  /** Light up these pieces and dim the rest (null clears). `pulse: false` skips the attention pulse. */
  highlight(ids: readonly number[] | null, opts: { pulse?: boolean } = {}): void {
    this.highlighted = ids && ids.length ? new Set(ids) : null;
    this.pulseUntil = this.highlighted ? performance.now() + (opts.pulse === false ? 0 : 3200) : 0;
    this.paintHighlight();
  }

  private paintHighlight(): void {
    this.cubies.forEach((c) => {
      const lit = !this.highlighted || this.highlighted.has(c.id);
      c.stickers.forEach((s, i) => {
        s.material.color.copy(c.baseColors[i]!);
        if (!lit) s.material.color.lerp(new THREE.Color(DIM_HEX), 0.78);
        s.material.emissiveIntensity = 0;
      });
    });
    this.dirty = true;
  }

  showArrow(move: Move | null): void {
    if (this.arrow) {
      this.scene.remove(this.arrow);
      this.arrow.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      this.arrow = null;
    }
    if (move) {
      this.arrow = buildMoveArrow(move);
      this.scene.add(this.arrow);
    }
    this.dirty = true;
  }

  setLabels(visible: boolean): void {
    this.labels.visible = visible;
    this.dirty = true;
  }

  /** 0 = assembled, 1 = pieces pulled apart to reveal the core. */
  setExplode(amount: number): void {
    this.explode.target = Math.max(0, Math.min(1, amount));
    this.dirty = true;
  }

  /** Move the cube within the frame (to make room for panels), animated. */
  setFraming(f: { x?: number; y?: number; zoom?: number }): void {
    this.framing.tx = f.x ?? 0;
    this.framing.ty = f.y ?? 0;
    this.framing.tzoom = f.zoom ?? 1;
    this.dirty = true;
  }

  setView(name: ViewName): void {
    const to = VIEWS[name];
    // Take the short way round.
    let dTheta = to.theta - this.orbit.theta;
    dTheta = ((((dTheta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
    this.viewTween = {
      from: { theta: this.orbit.theta, phi: this.orbit.phi },
      to: { theta: this.orbit.theta + dTheta, phi: to.phi },
      t: 0,
    };
    this.orbit.vTheta = this.orbit.vPhi = 0;
    this.dirty = true;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.offLogo();
    this.resizeObserver.disconnect();
    this.cancelTurns();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Sprite)) return;
      o.geometry.dispose();
      const materials = (Array.isArray(o.material) ? o.material : [o.material]) as (THREE.Material & {
        map?: THREE.Texture;
      })[];
      for (const m of materials) {
        // The logo texture is shared by every cube on the page: keep it.
        if (m.map && !m.map.userData.shared) m.map.dispose();
        m.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    canvas.remove();
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  };

  private update(dt: number): void {
    // Explode first, so a turn in progress is drawn on top of the new positions.
    if (Math.abs(this.explode.value - this.explode.target) > 0.001) {
      this.explode.value += (this.explode.target - this.explode.value) * Math.min(1, dt * 5);
      if (Math.abs(this.explode.value - this.explode.target) <= 0.001) this.explode.value = this.explode.target;
      this.core.visible = this.explode.value > 0.02;
      this.syncTransforms();
      if (this.pointer.kind === 'turning') this.applyTurnAngle(this.pointer.axis, this.pointer.ids, this.pointer.angle);
      this.dirty = true;
    }

    // Turns
    if (!this.active && this.queue.length && this.pointer.kind !== 'turning') this.startQueued();
    if (this.active) {
      const a = this.active;
      a.elapsed += dt * this.speed;
      const t = Math.min(1, a.elapsed / a.duration);
      this.applyTurnAngle(a.axis, a.ids, a.from + (a.to - a.from) * a.ease(t));
      if (t >= 1) this.finishActive();
      this.dirty = true;
    }
    if (!this.busy && this.pointer.kind !== 'turning' && this.idleWaiters.length) {
      const waiters = this.idleWaiters;
      this.idleWaiters = [];
      for (const w of waiters) w();
    }

    // Framing
    const fr = this.framing;
    if (Math.abs(fr.x - fr.tx) + Math.abs(fr.y - fr.ty) + Math.abs(fr.zoom - fr.tzoom) > 1e-4) {
      const k = this.reducedMotion ? 1 : Math.min(1, dt * 6);
      fr.x += (fr.tx - fr.x) * k;
      fr.y += (fr.ty - fr.y) * k;
      fr.zoom += (fr.tzoom - fr.zoom) * k;
      this.applyFraming();
      this.dirty = true;
    }

    // Camera
    if (this.viewTween) {
      const v = this.viewTween;
      v.t = Math.min(1, v.t + dt / (this.reducedMotion ? 0.2 : 0.7));
      const e = easeInOut(v.t);
      this.orbit.theta = v.from.theta + (v.to.theta - v.from.theta) * e;
      this.orbit.phi = v.from.phi + (v.to.phi - v.from.phi) * e;
      if (v.t >= 1) this.viewTween = null;
      this.dirty = true;
    } else if (this.pointer.kind !== 'orbit') {
      if (Math.abs(this.orbit.vTheta) > 1e-4 || Math.abs(this.orbit.vPhi) > 1e-4) {
        this.orbit.theta += this.orbit.vTheta;
        this.orbit.phi = clampPhi(this.orbit.phi + this.orbit.vPhi);
        const decay = Math.pow(0.0025, dt);
        this.orbit.vTheta *= decay;
        this.orbit.vPhi *= decay;
        this.dirty = true;
      }
      if (this.autoRotate && !this.reducedMotion) {
        this.orbit.theta += dt * 0.25;
        this.dirty = true;
      }
    }
    this.placeCamera();
    this.updateLabels(dt);

    // Highlight: pulse briefly to draw the eye, then settle on a steady glow so
    // the scene can stop re-rendering while nothing moves.
    if (this.highlighted && this.pulseUntil > 0) {
      const now = performance.now();
      const settled = now >= this.pulseUntil;
      const glow = settled ? 0.12 : 0.12 + 0.1 * Math.sin(now / 260);
      for (const id of this.highlighted) for (const s of this.cubies[id]!.stickers) s.material.emissiveIntensity = glow;
      if (settled) this.pulseUntil = 0;
      this.dirty = true;
    }
  }

  private placeCamera(): void {
    const { theta, phi } = this.orbit;
    const d = this.distance * this.framing.zoom * (1 + this.explode.value * 0.8);
    this.camera.position.set(d * Math.sin(phi) * Math.sin(theta), d * Math.cos(phi), d * Math.sin(phi) * Math.cos(theta));
    this.labels.scale.setScalar(1 + this.explode.value * 1.05);
    this.core.scale.setScalar(1 + this.explode.value * 1.05);
    this.camera.lookAt(0, 0, 0);
    // Fade the floor shadow when looking from below.
    this.shadow.material.opacity = Math.max(0, Math.min(1, (Math.PI * 0.62 - phi) * 3));
    this.shadow.visible = this.shadow.material.opacity > 0.01;
  }

  private resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Fit a sphere around the cube (plus room for arrows) in both directions.
    const radius = 3.1;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    this.distance = radius / Math.sin(Math.min(vFov, hFov) / 2);
    this.applyFraming();
    this.dirty = true;
  }

  private applyFraming(): void {
    const { x, y } = this.framing;
    if (Math.abs(x) < 1e-4 && Math.abs(y) < 1e-4) this.camera.clearViewOffset();
    else this.camera.setViewOffset(this.width, this.height, -x * this.width, -y * this.height, this.width, this.height);
    this.camera.updateProjectionMatrix();
  }

  // ─── Transforms ───────────────────────────────────────────────────────────

  private readonly tmpMatrix = new THREE.Matrix4();
  private readonly turnMatrix = new THREE.Matrix4();

  /** Base transform of a cubie from engine state: rotation, placed at rot × home (pushed out when exploded). */
  private baseMatrix(id: number, out: THREE.Matrix4): THREE.Matrix4 {
    const r: Mat3 = this._state.rots[id]!;
    const p = mulVec(r, CUBIES[id]!.home);
    const s = 1 + this.explode.value * 1.05;
    return out.set(r[0], r[1], r[2], p[0] * s, r[3], r[4], r[5], p[1] * s, r[6], r[7], r[8], p[2] * s, 0, 0, 0, 1);
  }

  private syncTransforms(): void {
    for (const c of this.cubies) {
      this.baseMatrix(c.id, c.group.matrix);
      c.group.matrixWorldNeedsUpdate = true;
    }
    this.dirty = true;
  }

  private applyTurnAngle(axis: Axis, ids: number[], angle: number): void {
    this.turnMatrix.makeRotationAxis(AXIS_VECTORS[axis], angle);
    for (const id of ids) {
      const g = this.cubies[id]!.group;
      g.matrix.multiplyMatrices(this.turnMatrix, this.baseMatrix(id, this.tmpMatrix));
      g.matrixWorldNeedsUpdate = true;
    }
  }

  private idsInLayers(axis: Axis, layers: readonly number[]): number[] {
    const ai = AXIS_INDEX[axis];
    return CUBIES.filter((c) => layers.includes(mulVec(this._state.rots[c.id]!, c.home)[ai])).map((c) => c.id);
  }

  private startQueued(): void {
    const q = this.queue.shift()!;
    const spec = MOVE_SPECS[q.move.name];
    this.active = {
      axis: spec.axis,
      ids: this.idsInLayers(spec.axis, spec.layers),
      from: 0,
      to: moveQuarters(q.move) * QUARTER,
      elapsed: 0,
      duration: q.duration,
      ease: easeInOut,
      move: q.move,
      source: q.source,
      resolve: q.resolve,
    };
  }

  private finishActive(): void {
    const a = this.active!;
    this.active = null;
    if (a.move) this._state = applyMove(this._state, a.move);
    this.syncTransforms();
    if (a.move) this.emit('move', { move: a.move, source: a.source, state: this._state });
    a.resolve(true);
  }

  private emit<K extends keyof CubeViewEvents>(event: K, payload: CubeViewEvents[K]): void {
    for (const cb of this.listeners[event]) cb(payload);
  }

  // ─── Pointer input ────────────────────────────────────────────────────────

  private pointerPosition(e: PointerEvent): THREE.Vector2 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);
  }

  private toScreen(p: THREE.Vector3): THREE.Vector2 {
    const v = p.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((v.x + 1) / 2) * rect.width, ((1 - v.y) / 2) * rect.height);
  }

  private hitTest(pos: THREE.Vector2): { cubieId: number; point: THREE.Vector3 } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2((pos.x / rect.width) * 2 - 1, -(pos.y / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(
      this.cubies.map((c) => c.group),
      true,
    )[0];
    if (!hit) return null;
    return { cubieId: hit.object.userData.cubieId as number, point: hit.point.clone() };
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.pointer.kind !== 'idle' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const pos = this.pointerPosition(e);
    const hit = this.explode.value > 0.01 ? null : this.hitTest(pos);
    if (hit && (this.interaction.turns || this.interaction.pick)) {
      this.pointer = { kind: 'pending', id: e.pointerId, start: pos, cubieId: hit.cubieId, hitPoint: hit.point };
    } else if (this.interaction.orbit) {
      this.pointer = { kind: 'orbit', id: e.pointerId, last: pos };
      this.viewTween = null;
      this.orbit.vTheta = this.orbit.vPhi = 0;
    } else {
      return;
    }
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.pointer;
    if (p.kind === 'idle' || e.pointerId !== p.id) return;
    const pos = this.pointerPosition(e);

    if (p.kind === 'orbit') {
      const dx = pos.x - p.last.x;
      const dy = pos.y - p.last.y;
      this.orbit.vTheta = -dx * 0.009;
      this.orbit.vPhi = -dy * 0.009;
      this.orbit.theta += this.orbit.vTheta;
      this.orbit.phi = clampPhi(this.orbit.phi + this.orbit.vPhi);
      p.last = pos;
      this.dirty = true;
      return;
    }

    if (p.kind === 'pending') {
      if (pos.distanceTo(p.start) < 7) return;
      if (!this.interaction.turns || this.busy || p.hitPoint === null || p.cubieId === null) {
        // Not allowed to turn now: treat the drag as an orbit instead.
        if (this.interaction.orbit) this.pointer = { kind: 'orbit', id: p.id, last: pos };
        else this.pointer = { kind: 'idle' };
        return;
      }
      const started = this.beginDragTurn(p.id, p.start, p.hitPoint, p.cubieId, pos.clone().sub(p.start));
      if (started) {
        this.pointer = started;
        this.emit('turnstart', {});
      }
      return;
    }

    // Turning: follow the finger.
    const drag = pos.clone().sub(p.start);
    p.angle = (drag.dot(p.screenDir) / (p.pxPerUnit * 1.6)) * QUARTER * p.axisSign;
    this.applyTurnAngle(p.axis, p.ids, p.angle);
    this.dirty = true;
  };

  private onPointerUp = (e: PointerEvent) => {
    const p = this.pointer;
    if (p.kind === 'idle' || e.pointerId !== p.id) return;
    this.pointer = { kind: 'idle' };
    if (this.renderer.domElement.hasPointerCapture(e.pointerId))
      this.renderer.domElement.releasePointerCapture(e.pointerId);

    if (p.kind === 'pending' && p.cubieId !== null && this.interaction.pick) {
      this.emit('pick', { cubieId: p.cubieId });
    } else if (p.kind === 'turning') {
      this.releaseDragTurn(p);
    }
  };

  /** Work out which layer and direction a drag on the cube means. */
  private beginDragTurn(
    id: number,
    start: THREE.Vector2,
    hitPoint: THREE.Vector3,
    cubieId: number,
    drag: THREE.Vector2,
  ): Extract<PointerMode, { kind: 'turning' }> | null {
    // The face that was touched: the axis where the hit point is furthest out.
    const abs = [Math.abs(hitPoint.x), Math.abs(hitPoint.y), Math.abs(hitPoint.z)];
    const k = abs.indexOf(Math.max(...abs));
    const normal = new THREE.Vector3().setComponent(k, Math.sign(hitPoint.getComponent(k)));

    // Candidate drag directions: the two axes lying in that face.
    const origin = this.toScreen(hitPoint);
    let best: { dir: THREE.Vector3; screen: THREE.Vector2; px: number; score: number } | null = null;
    for (let i = 0; i < 3; i++) {
      if (i === k) continue;
      const dir = new THREE.Vector3().setComponent(i, 1);
      const screen = this.toScreen(hitPoint.clone().add(dir)).sub(origin);
      const px = screen.length();
      if (px < 1) continue;
      screen.divideScalar(px);
      const score = drag.clone().normalize().dot(screen);
      if (!best || Math.abs(score) > Math.abs(best.score)) best = { dir, screen, px, score };
    }
    if (!best) return null;

    // Rotating about (normal × dragDir) moves the touched face along dragDir.
    const axisVec = new THREE.Vector3().crossVectors(normal, best.dir);
    const ai = [Math.abs(axisVec.x), Math.abs(axisVec.y), Math.abs(axisVec.z)].indexOf(1);
    const axis = (['x', 'y', 'z'] as const)[ai]!;
    const axisSign = Math.sign(axisVec.getComponent(ai));
    const layer = mulVec(this._state.rots[cubieId]!, CUBIES[cubieId]!.home)[ai]!;

    return {
      kind: 'turning',
      id,
      start,
      axis,
      axisSign,
      layer,
      ids: this.idsInLayers(axis, [layer]),
      screenDir: best.screen,
      pxPerUnit: best.px,
      angle: 0,
    };
  }

  private releaseDragTurn(p: Extract<PointerMode, { kind: 'turning' }>): void {
    const quarters = Math.max(-2, Math.min(2, Math.round(p.angle / QUARTER)));
    const move = quarters === 0 ? null : layerMove(p.axis, p.layer, quarters);
    this.active = {
      axis: p.axis,
      ids: p.ids,
      from: p.angle,
      to: quarters * QUARTER,
      elapsed: 0,
      duration: 0.16 + Math.abs(quarters * QUARTER - p.angle) * 0.12,
      ease: easeOut,
      move,
      source: 'user',
      resolve: () => {},
    };
  }

  // ─── Labels ───────────────────────────────────────────────────────────────

  private buildLabels(): void {
    for (const face of ['U', 'D', 'F', 'B', 'R', 'L'] as Face[]) {
      const n = FACE_NORMAL[face];
      const label = buildFaceLabel(face, new THREE.Vector3(n[0], n[1], n[2]));
      this.labels.add(label.group);
      this.faceLabels.push({ label, opacity: 1 });
    }
  }

  /**
   * Keep each letter coin turned toward the viewer (tilted so its rim shows),
   * and fade the ones the cube is in front of, so they read as behind it.
   */
  private updateLabels(dt: number): void {
    if (!this.labels.visible) return;
    const scale = this.labels.scale.x;
    const reach = 1.5 * (1 + this.explode.value * 1.05);
    this.labelBox.min.setScalar(-reach);
    this.labelBox.max.setScalar(reach);
    for (const entry of this.faceLabels) {
      const { coin, materials } = entry.label;
      coin.quaternion.copy(this.camera.quaternion).multiply(this.tilt);
      this.labelPos.copy(coin.position).multiplyScalar(scale);
      const toLabel = this.labelPos.clone().sub(this.camera.position);
      const distance = toLabel.length();
      this.labelRay.set(this.camera.position, toLabel.normalize());
      const hit = this.labelRay.intersectBox(this.labelBox, this.labelHit);
      const behind = hit !== null && this.camera.position.distanceTo(hit) < distance - 0.05;
      const target = behind ? 0.2 : 1;
      if (Math.abs(entry.opacity - target) > 0.005) {
        entry.opacity += (target - entry.opacity) * Math.min(1, dt * 10);
        for (const m of materials) m.opacity = entry.opacity;
        this.dirty = true;
      }
    }
  }
}

function clampPhi(phi: number): number {
  return Math.max(0.08, Math.min(Math.PI - 0.08, phi));
}

/** The notation move that turns one layer by a number of right-hand-rule quarters. */
export function layerMove(axis: Axis, layer: number, quarters: number): Move {
  const name = (Object.keys(MOVE_SPECS) as MoveName[]).find((n) => {
    const s = MOVE_SPECS[n];
    return s.axis === axis && s.layers.length === 1 && s.layers[0] === layer;
  })!;
  return { name, amount: (quarters / MOVE_SPECS[name].dir) as Amount };
}
