// Restores the approved social cards and generates PNG app icons.
//
// npm run og
//
// Social cards are authored assets in tools/og/cards, at 1200×630.
// Keep those sources updated when replacing their public counterparts.

import { Resvg } from '@resvg/resvg-js';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');
const CARDS = ['og-image.png', 'og-image-pt-br.png'] as const;

for (const file of CARDS) {
  const source = join(ROOT, 'tools/og/cards', file);
  const png = readFileSync(source);
  // Reject incorrectly sized cards before publishing them to public/.
  if (
    png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    png.readUInt32BE(16) !== 1200 ||
    png.readUInt32BE(20) !== 630
  ) {
    throw new Error(`${file} must be a 1200×630 PNG.`);
  }
  copyFileSync(source, join(PUBLIC, file));
}

const favicon = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');
for (const [file, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  writeFileSync(join(PUBLIC, file), new Resvg(favicon, { fitTo: { mode: 'width', value: size } }).render().asPng());
}

console.log(`Wrote ${CARDS.join(', ')}, apple-touch-icon.png, icon-192.png and icon-512.png`);
