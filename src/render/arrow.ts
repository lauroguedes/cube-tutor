import * as THREE from 'three';
import { MOVE_SPECS, moveQuarters, type Move } from '../engine/moves';

const AXES: Record<'x' | 'y' | 'z', [THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
  // [axis, u, v] with u × v = axis, so increasing angle = positive rotation.
  x: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)],
  y: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)],
  z: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)],
};

/**
 * A curved arrow showing which way a move turns. Face turns get an arc drawn
 * on the face; slices and rotations get a wider ring around the cube.
 */
export function buildMoveArrow(move: Move): THREE.Group {
  const spec = MOVE_SPECS[move.name];
  const [axis, u, v] = AXES[spec.axis];
  const q = moveQuarters(move);
  const outer = spec.layers.length === 1 && spec.layers[0] !== 0;
  const layer = outer ? spec.layers[0]! : spec.layers.length === 3 ? 0 : spec.layers.reduce((a, b) => a + b, 0) / 2;

  const radius = outer ? 1.05 : 2.05;
  const planeOffset = outer ? layer * 1.56 : layer;
  const center = axis.clone().multiplyScalar(planeOffset);
  const sweep = (Math.PI / 2) * Math.abs(q) * 0.85;
  const sign = Math.sign(q);
  // Start on the side of the arc that faces the default camera (front/right/top).
  const start = spec.axis === 'y' ? Math.PI * 0.05 : Math.PI * 0.15;

  const point = (t: number) =>
    center
      .clone()
      .addScaledVector(u, Math.cos(t) * radius)
      .addScaledVector(v, Math.sin(t) * radius);

  const points: THREE.Vector3[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) points.push(point(start + sign * sweep * (i / steps)));
  const curve = new THREE.CatmullRomCurve3(points);

  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.95 });
  const group = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.045, 10, false), material);
  tube.renderOrder = 20;
  group.add(tube);

  const end = points[points.length - 1]!;
  const tangent = curve.getTangent(1).normalize();
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 20), material);
  head.position.copy(end).addScaledVector(tangent, 0.08);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  head.renderOrder = 20;
  group.add(head);

  return group;
}
