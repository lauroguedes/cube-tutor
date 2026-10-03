// Writes the static logo files from src/brand/logo.ts:
//   public/logo.svg        symbol
//   public/logo-full.svg   symbol + "Cube Tutor" wordmark
//   public/favicon.svg     symbol on a dark tile (readable in light and dark tabs)
//   docs/images/logo-light.svg, logo-dark.svg   README logo for GitHub's light and dark themes
//
//   npm run brand

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logoSymbolSvg } from '../../src/brand/logo';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');
const DOCS = join(ROOT, 'docs', 'images');
const inner = (svg: string) => svg.replace(/^<svg[^>]*>\n?/, '').replace(/\n?<\/svg>$/, '');

writeFileSync(join(PUBLIC, 'logo.svg'), logoSymbolSvg());

writeFileSync(
  join(PUBLIC, 'logo-full.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" width="280" height="64">
${inner(logoSymbolSvg())}
<text x="70" y="43" font-family="'Bricolage Grotesque Variable','Bricolage Grotesque','Avenir Next',system-ui,sans-serif" font-size="31" font-weight="650" letter-spacing="-0.6" fill="#15161A">Cube Tutor</text>
</svg>
`,
);

writeFileSync(
  join(PUBLIC, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#15161A"/>
<g transform="translate(5 4) scale(0.84)">${inner(logoSymbolSvg({ face: '#F2F2EE', accent: '#FFD23A' }))}</g>
</svg>
`,
);

writeFileSync(join(DOCS, 'logo-light.svg'), logoSymbolSvg(undefined, 96));
writeFileSync(join(DOCS, 'logo-dark.svg'), logoSymbolSvg({ face: '#F2F2EE', accent: '#FFD23A' }, 96));

console.log('Wrote logo.svg, logo-full.svg, favicon.svg and the README logos');
