// The Cube Tutor mark: an isometric cube whose top face is the tutor's
// highlighter yellow (the "layer you're learning"), with the 3×3 grid on
// every face. One source for the header mark, the static SVG files, the
// favicon and the logo printed on the cube's white center.

export const LOGO_PATHS = {
  top: 'M32 12 L50.19 22.5 L32 33 L13.81 22.5 Z',
  left: 'M13.81 22.5 L32 33 L32 54 L13.81 43.5 Z',
  right: 'M32 33 L50.19 22.5 L50.19 43.5 L32 54 Z',
  gridTop: 'M38.06 15.5 L19.88 26 M25.94 15.5 L44.12 26 M44.12 19 L25.94 29.5 M19.88 19 L38.06 29.5',
  gridLeft: 'M19.88 26 L19.88 47 M13.81 29.5 L32 40 M25.94 29.5 L25.94 50.5 M13.81 36.5 L32 47',
  gridRight: 'M38.06 29.5 L38.06 50.5 M32 40 L50.19 29.5 M44.12 26 L44.12 47 M32 47 L50.19 36.5',
  outline: 'M32 12 L50.19 22.5 L50.19 43.5 L32 54 L13.81 43.5 L13.81 22.5 Z',
} as const;

export interface LogoColors {
  top: string;
  left: string;
  right: string;
  gridTop: string;
  gridSide: string;
}

export const LOGO_ON_LIGHT: LogoColors = {
  top: '#FFD23A',
  left: '#15161A',
  right: '#3A3D46',
  gridTop: 'rgba(21,22,26,0.55)',
  gridSide: 'rgba(255,255,255,0.3)',
};

/** The symbol as a standalone SVG document (64×64). */
export function logoSymbolSvg(c: LogoColors = LOGO_ON_LIGHT, size = 64): string {
  const p = LOGO_PATHS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
<g stroke-linecap="round" stroke-linejoin="round">
<path d="${p.left}" fill="${c.left}"/>
<path d="${p.right}" fill="${c.right}"/>
<path d="${p.top}" fill="${c.top}"/>
<path d="${p.gridLeft} ${p.gridRight}" fill="none" stroke="${c.gridSide}" stroke-width="1.3"/>
<path d="${p.gridTop}" fill="none" stroke="${c.gridTop}" stroke-width="1.3"/>
<path d="${p.outline} M32 33 L32 54 M13.81 22.5 L32 33 L50.19 22.5" fill="none" stroke="${c.left}" stroke-width="1.6"/>
</g>
</svg>`;
}
