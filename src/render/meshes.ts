import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Vec3 } from '../engine/geometry';
import { CUBIES } from '../engine/state';
import { logoSymbolSvg } from '../brand/logo';
import { STYLES, type CubeStyle } from './palette';

export const CUBIE_SIZE = 0.97;
const HALF = CUBIE_SIZE / 2;

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

/**
 * Build the 26 cubie meshes in a given style. Each group is built at the
 * origin; its transform places it. Stickerless styles use near-full-size
 * colored tiles, so the dark body only shows as thin seams.
 */
export function buildCubies(style: CubeStyle = 'classic'): CubieMesh[] {
  const spec = STYLES[style];
  const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, 0.085);
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: spec.body,
    roughness: spec.bodyRoughness,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
  });
  const stickerGeometry = new THREE.ExtrudeGeometry(roundedSquare(spec.stickerSize, spec.stickerRadius), {
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
      const color = new THREE.Color(spec.stickers[s.color]);
      const material = new THREE.MeshPhysicalMaterial({
        color: color.clone(),
        roughness: spec.roughness,
        metalness: 0,
        clearcoat: spec.clearcoat,
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
    // The white center carries the logo.
    if (def.kind === 'center' && def.stickers[0]!.color === 'white') {
      const decal = buildLogoDecal(spec.stickerSize);
      decal.userData.cubieId = def.id;
      group.add(decal);
    }
    return { id: def.id, group, stickers, baseColors };
  });
}

/**
 * The brand logo, printed on the white center like a maker's mark. Drawn from
 * the SVG into a canvas texture (shared by every cube on the page).
 */
let logoTexture: THREE.CanvasTexture | null = null;
let logoReady = false;
const logoWaiters = new Set<() => void>();

/** Run `cb` once the logo has been drawn (immediately if it already has). Returns an unsubscribe. */
export function onLogoReady(cb: () => void): () => void {
  if (logoReady) {
    cb();
    return () => {};
  }
  logoWaiters.add(cb);
  return () => logoWaiters.delete(cb);
}

function getLogoTexture(): THREE.CanvasTexture {
  if (logoTexture) return logoTexture;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.userData.shared = true;
  const img = new Image();
  img.onload = () => {
    canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
    texture.needsUpdate = true;
    logoReady = true;
    for (const cb of logoWaiters) cb();
    logoWaiters.clear();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSymbolSvg(undefined, size))}`;
  logoTexture = texture;
  return texture;
}

function buildLogoDecal(stickerSize: number): THREE.Mesh {
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(stickerSize * 0.86, stickerSize * 0.86),
    new THREE.MeshPhysicalMaterial({
      map: getLogoTexture(),
      transparent: true,
      roughness: 0.35,
      clearcoat: 0.4,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  // Lie on the top sticker, upright when seen from the front.
  decal.rotation.x = -Math.PI / 2;
  decal.position.y = HALF + 0.0125;
  decal.renderOrder = 1;
  return decal;
}

/** Free the GPU resources of a set of cubies (geometries and materials are shared per set). */
export function disposeCubies(cubies: readonly CubieMesh[]): void {
  const seen = new Set<THREE.BufferGeometry | THREE.Material>();
  for (const c of cubies)
    c.group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      for (const r of [o.geometry, o.material as THREE.Material])
        if (!seen.has(r)) {
          // The logo texture is shared across cubes and styles: keep it.
          seen.add(r);
          r.dispose();
        }
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

/** A face letter (U, R, F…) for the notation lessons: a lit 3D coin on a leader line. */
export interface FaceLabel {
  readonly group: THREE.Group;
  readonly coin: THREE.Group;
  readonly line: THREE.Line;
  readonly materials: (THREE.Material & { opacity: number })[];
}

export function buildFaceLabel(text: string, normal: THREE.Vector3): FaceLabel {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#15161a';
  ctx.font = '700 150px "Bricolage Grotesque Variable", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Labels draw on top of the cube (depthTest off); their opacity shows depth.
  const shared = { transparent: true, depthTest: false, depthWrite: false };
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xfafaf7, roughness: 0.35, metalness: 0, ...shared });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffd23a, roughness: 0.4, metalness: 0, ...shared });
  const letterMat = new THREE.MeshBasicMaterial({ map: texture, ...shared });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffd23a, ...shared });

  const coin = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 48), [rimMat, faceMat, faceMat]);
  disc.rotation.x = Math.PI / 2; // axis toward the viewer
  disc.renderOrder = 10;
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), letterMat);
  letter.position.z = 0.042;
  letter.renderOrder = 11;
  coin.add(disc, letter);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([normal.clone().multiplyScalar(1.56), normal.clone().multiplyScalar(2.08)]),
    lineMat,
  );
  line.renderOrder = 9;

  const group = new THREE.Group();
  coin.position.copy(normal).multiplyScalar(2.3);
  group.add(line, coin);
  return { group, coin, line, materials: [faceMat, rimMat, letterMat, lineMat] };
}
