// The Cube Tutor mark: a speech bubble whose body is a cube face. The voice
// of the tutor and the cube in one shape. The 3×3 stickers are cut out of
// the bubble, and one of them is highlighter yellow: the piece the tutor is
// pointing at right now.
// One source for the header mark, the static SVG files, the favicon and the
// logo printed on the cube's white center.

const BUBBLE =
  'M18 6H46C52.6 6 58 11.4 58 18V38C58 44.6 52.6 50 46 50H28L15.6 58.6Q13.4 60 14.1 57.6L17.4 50H18C11.4 50 6 44.6 6 38V18C6 11.4 11.4 6 18 6Z';

const TILE = 10;
const TILE_R = 2.6;
const COLS = [13.5, 27, 40.5];
const ROWS = [9.5, 23, 36.5];

function tile(x: number, y: number): string {
  const t = TILE;
  const r = TILE_R;
  return `M${x + r} ${y}H${x + t - r}Q${x + t} ${y} ${x + t} ${y + r}V${y + t - r}Q${x + t} ${y + t} ${x + t - r} ${y + t}H${x + r}Q${x} ${y + t} ${x} ${y + t - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

export const LOGO = {
  viewBox: '0 0 64 64',
  /** Bubble with the nine sticker holes (draw with fill-rule="evenodd"). */
  face: [BUBBLE, ...ROWS.flatMap((y) => COLS.map((x) => tile(x, y)))].join(' '),
  /** The highlighted sticker (top right), drawn into its hole. */
  accent: { x: COLS[2]!, y: ROWS[0]!, width: TILE, height: TILE, rx: TILE_R },
} as const;

export interface LogoColors {
  face: string;
  accent: string;
}

export const LOGO_ON_LIGHT: LogoColors = { face: '#15161A', accent: '#FFD23A' };

/** The symbol as a standalone SVG document. */
export function logoSymbolSvg(c: LogoColors = LOGO_ON_LIGHT, size = 64): string {
  const a = LOGO.accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO.viewBox}" width="${size}" height="${size}">
<path d="${LOGO.face}" fill="${c.face}" fill-rule="evenodd"/>
<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" rx="${a.rx}" fill="${c.accent}"/>
</svg>`;
}
