// The Cube Tutor mark: the cube seen from the front as its three layers,
// with the top one caught mid-turn in the tutor's highlighter yellow (the
// layer you're learning).
// One source for the header mark, the static SVG files, the favicon and the
// logo printed on the cube's white center.

export const LOGO = {
  viewBox: '0 0 64 64',
  /** The two resting layers (middle, bottom). */
  rows: [
    { x: 13, y: 28, width: 38, height: 11, rx: 3.5 },
    { x: 13, y: 42, width: 38, height: 11, rx: 3.5 },
  ],
  layer: { x: 13, y: 12, width: 38, height: 11, rx: 3.5 },
  /** The top layer's turn, in degrees, around its own center. */
  turn: -9,
  layerCenter: { x: 32, y: 17.5 },
} as const;

export interface LogoColors {
  body: string;
  layer: string;
}

export const LOGO_ON_LIGHT: LogoColors = { body: '#15161A', layer: '#FFD23A' };

/** The symbol as a standalone SVG document. */
export function logoSymbolSvg(c: LogoColors = LOGO_ON_LIGHT, size = 64): string {
  const { rows, layer: l, turn, layerCenter: lc } = LOGO;
  const row = (r: (typeof rows)[number]) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" fill="${c.body}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO.viewBox}" width="${size}" height="${size}">
${rows.map(row).join('\n')}
<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" rx="${l.rx}" fill="${c.layer}" transform="rotate(${turn} ${lc.x} ${lc.y})"/>
</svg>`;
}
