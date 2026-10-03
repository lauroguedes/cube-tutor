// Generates the social sharing image and PNG app icons.
//
//   npm run og
//
// public/og-image.png        1200×630 Open Graph / Twitter card
// public/apple-touch-icon.png 180×180
// public/icon-192.png, icon-512.png  web app manifest icons
//
// Text is laid out with Satori (fonts embedded, so the image looks the same
// everywhere) and rasterised with resvg.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { logoSymbolSvg } from '../../src/brand/logo';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');
const font = (p: string) => readFileSync(join(ROOT, p));

const INK = '#15161A';
const INK_SOFT = '#5D6270';
const HIGHLIGHT = '#FFD23A';

// ─── An isometric cube in the app's sticker colors ─────────────────────────

type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const poly = (pts: P[], fill: string) =>
  `<polygon points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${fill}"/>`;

function cubeSvg(size: number): string {
  const s = size * 0.42;
  const dx = s * Math.cos(Math.PI / 6);
  const c: P = [size / 2, size / 2];
  const T: P = [c[0], c[1] - s];
  const R: P = [c[0] + dx, c[1] - s / 2];
  const L: P = [c[0] - dx, c[1] - s / 2];
  const down: P = [0, s];

  const faces: { origin: P; e1: P; e2: P; colors: string[] }[] = [
    // top: white with one sticker highlighted by the tutor
    { origin: T, e1: sub(R, T), e2: sub(L, T), colors: ['#F2F2EE', '#F2F2EE', '#F2F2EE', '#F2F2EE', '#F2F2EE', '#F2F2EE', '#F2F2EE', '#F2F2EE', HIGHLIGHT] },
    // left: green, right: red
    { origin: L, e1: sub(c, L), e2: down, colors: Array(9).fill('#16A34A') },
    { origin: c, e1: sub(R, c), e2: down, colors: Array(9).fill('#C81E32') },
  ];

  const pad = 0.05;
  let stickers = '';
  for (const f of faces) {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const at = (u: number, v: number) => add(f.origin, add(mul(f.e1, u), mul(f.e2, v)));
        const u0 = i / 3 + pad;
        const u1 = (i + 1) / 3 - pad;
        const v0 = j / 3 + pad;
        const v1 = (j + 1) / 3 - pad;
        stickers += poly([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], f.colors[j * 3 + i]!);
      }
  }
  const body = poly([T, R, add(R, down), add(c, down), add(L, down), L], INK);
  // Soft floor shadow
  const shadow = `<defs><radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${c[0]}" cy="${c[1] + s * 1.12}" rx="${s * 1.05}" ry="${s * 0.2}" fill="url(#sh)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${shadow}${body}${stickers}</svg>`;
}

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// ─── Open Graph image ──────────────────────────────────────────────────────

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

async function ogImage(): Promise<void> {
  const width = 1200;
  const height = 630;
  const tree = h(
    'div',
    {
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '72px 64px 72px 84px',
      backgroundImage: 'radial-gradient(circle at 70% 45%, #F4F5F7 0%, #E4E7EC 55%, #CFD4DC 100%)',
      fontFamily: 'Atkinson',
      color: INK,
    },
    [
      h('div', { display: 'flex', flexDirection: 'column', width: 640, height: '100%', justifyContent: 'space-between' }, [
        h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
          h('img', { width: 60, height: 60 }, undefined, { src: dataUri(logoSymbolSvg(undefined, 60)), width: 60, height: 60 }),
          h('span', { fontFamily: 'Bricolage', fontSize: 38, letterSpacing: -1 }, 'Cube Tutor'),
        ]),
        h('div', { display: 'flex', flexDirection: 'column', gap: 26 }, [
          h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Bricolage', fontSize: 96, lineHeight: 0.95, letterSpacing: -4 }, [
            h('span', {}, 'Learn to'),
            h('span', { display: 'flex' }, [
              h('span', { backgroundImage: `linear-gradient(transparent 62%, ${HIGHLIGHT} 62%, ${HIGHLIGHT} 92%, transparent 92%)` }, 'solve'),
              h('span', { marginLeft: 20 }, 'the cube.'),
            ]),
          ]),
          h('span', { fontSize: 31, lineHeight: 1.35, color: INK_SOFT, maxWidth: 600 }, 'A patient narrated tutor and an interactive 3D cube. Free, no account.'),
        ]),
        h('span', { fontFamily: 'Plex', fontSize: 24, color: INK_SOFT, letterSpacing: 0.5 }, new URL(SITE).host),
      ]),
      h('img', { width: 470, height: 470 }, undefined, { src: dataUri(cubeSvg(470)), width: 470, height: 470 }),
    ],
  );

  const svg = await satori(tree as never, {
    width,
    height,
    fonts: [
      { name: 'Bricolage', data: font('tools/og/fonts/BricolageGrotesque-Bold.ttf'), weight: 700, style: 'normal' },
      { name: 'Atkinson', data: font('node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff'), weight: 400, style: 'normal' },
      { name: 'Plex', data: font('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
    ],
  });
  writeFileSync(join(PUBLIC, 'og-image.png'), new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}

// ─── App icons from the favicon ────────────────────────────────────────────

function icons(): void {
  const favicon = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');
  for (const [file, size] of [
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ] as const) {
    writeFileSync(join(PUBLIC, file), new Resvg(favicon, { fitTo: { mode: 'width', value: size } }).render().asPng());
  }
}

const SITE = process.env.SITE_URL ?? 'https://cubetutor.lauroguedes.dev';

await ogImage();
icons();
console.log('Wrote og-image.png, apple-touch-icon.png, icon-192.png and icon-512.png');
