// Publishes the social cards and generates PNG app icons.
//
// npm run og
//
// Social cards are authored assets in tools/og/cards (1200×630 PNG). They are
// published as compressed JPEGs: WhatsApp skips link previews whose image is
// over about 300 KB, and the PNGs are several times that.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');
const CARDS = ['og-image', 'og-image-pt-br'] as const;
const MAX_BYTES = 300 * 1024;

for (const name of CARDS) {
  const source = sharp(join(ROOT, 'tools/og/cards', `${name}.png`));
  const { width, height } = await source.metadata();
  // Reject incorrectly sized cards before publishing them to public/.
  if (width !== 1200 || height !== 630) throw new Error(`${name}.png must be 1200×630 (it is ${width}×${height}).`);
  const jpeg = await source.flatten({ background: '#e4e7ec' }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  if (jpeg.length > MAX_BYTES) throw new Error(`${name}.jpg is ${Math.round(jpeg.length / 1024)} KB; keep it under 300 KB.`);
  writeFileSync(join(PUBLIC, `${name}.jpg`), jpeg);
}

const favicon = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');
for (const [file, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  writeFileSync(join(PUBLIC, file), new Resvg(favicon, { fitTo: { mode: 'width', value: size } }).render().asPng());
}

console.log(`Wrote ${CARDS.map((c) => `${c}.jpg`).join(', ')}, apple-touch-icon.png, icon-192.png and icon-512.png`);
