import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Vec3 } from '../engine/geometry';
import { CUBIES } from '../engine/state';
import { BODY_HEX, STICKER_HEX } from './palette';

export const CUBIE_SIZE = 0.97;
const HALF = CUBIE_SIZE / 2;
const STICKER_SIZE = 0.82;
const STICKER_RADIUS = 0.11;

function roundedSquare(size: number, radius: number): THREE.Shape {
  const h = size / 2;
  const s = new THREE.Shape();
  s.moveTo(-h + radius, -h);
  s.lineTo(h - radius, -h);
  s.quadraticCurveTo(h, -h, h, -h + radius);
  s.lineTo(h, h - radius);
  s.quadraticCurveTo(h, h, h - radius, h);
  s.lineTo(-h + radius, h);
  s.quadraticCurveTo(-h, h, -h, h - radius);
  s.lineTo(-h, -h + radius);
  s.quadraticCurveTo(-h, -h, -h + radius, -h);
  return s;
}

export interface CubieMesh {
  readonly id: number;
  readonly group: THREE.Group;
  readonly stickers: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>[];
  readonly baseColors: THREE.Color[];
}

/** Build the 26 cubie meshes. Each group is built at the origin; its transform places it. */
export function buildCubies(): CubieMesh[] {
  const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, 0.085);
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: BODY_HEX,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
  });
  const stickerGeometry = new THREE.ExtrudeGeometry(roundedSquare(STICKER_SIZE, STICKER_RADIUS), {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.008,
    bevelSegments: 3,
    curveSegments: 8,
  });

  const zAxis = new THREE.Vector3(0, 0, 1);
  return CUBIES.map((def) => {
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    group.userData.cubieId = def.id;

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.userData.cubieId = def.id;
    group.add(body);

    const stickers: CubieMesh['stickers'] = [];
    const baseColors: THREE.Color[] = [];
    for (const s of def.stickers) {
      const color = new THREE.Color(STICKER_HEX[s.color]);
      const material = new THREE.MeshPhysicalMaterial({
        color: color.clone(),
        roughness: 0.3,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(stickerGeometry, material);
      const n = new THREE.Vector3(...(s.homeNormal as Vec3));
      mesh.quaternion.setFromUnitVectors(zAxis, n);
      mesh.position.copy(n.multiplyScalar(HALF - 0.002));
      mesh.userData.cubieId = def.id;
      group.add(mesh);
      stickers.push(mesh);
      baseColors.push(color);
    }
    return { id: def.id, group, stickers, baseColors };
  });
}

/** The internal mechanism (core + axles), shown only in the exploded view. */
export function buildCore(): THREE.Group {
  const core = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({ color: 0x3a3a40, roughness: 0.5, clearcoat: 0.2 });
  core.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), material));
  const axle = new THREE.CylinderGeometry(0.09, 0.09, 2.1, 20);
  for (const rot of [
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, 0, Math.PI / 2],
  ] as const) {
    const m = new THREE.Mesh(axle, material);
    m.rotation.set(rot[0], rot[1], rot[2]);
    core.add(m);
  }
  core.visible = false;
  return core;
}

/** A soft round shadow texture for under the cube (cheaper and softer than real shadows). */
export function buildContactShadow(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2.15;
  mesh.renderOrder = -1;
  return mesh;
}

/** A letter floating off a face (U, R, F…) for the notation lessons. */
export function buildLabel(text: string): THREE.Sprite {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = '600 72px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.setScalar(0.42);
  sprite.renderOrder = 10;
  return sprite;
}
