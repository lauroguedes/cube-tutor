// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

import sitemap from '@astrojs/sitemap';
import { existsSync, renameSync, rmdirSync } from 'node:fs';

/**
 * Cloudflare serves the nearest 404.html for unknown URLs, so /pt-br/xyz
 * should get dist/pt-br/404.html. Astro writes only the root 404 that way;
 * move the other locales' 404 pages next to it.
 * @param {string[]} locales
 * @returns {import('astro').AstroIntegration}
 */
function localized404(locales) {
  return {
    name: 'localized-404',
    hooks: {
      'astro:build:done': ({ dir }) => {
        for (const locale of locales) {
          const page = new URL(`${locale}/404/index.html`, dir);
          if (!existsSync(page)) continue;
          renameSync(page, new URL(`${locale}/404.html`, dir));
          rmdirSync(new URL(`${locale}/404/`, dir));
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Public address: canonical URLs, social cards and the sitemap use it.
  // Override with SITE_URL for preview deployments.
  site: process.env.SITE_URL ?? 'https://cubetutor.lauroguedes.dev',
  // Pages live at /learn/ etc.; links and canonical URLs always use the slash.
  trailingSlash: 'always',
  integrations: [
    vue(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      // Each URL lists its translations (hreflang) in the sitemap too.
      i18n: { defaultLocale: 'en', locales: { en: 'en', 'pt-br': 'pt-BR' } },
    }),
    localized404(['pt-br']),
  ],
  i18n: {
    // A new locale also needs UI strings (src/i18n/ui.ts), course text
    // (src/course/text), pages under src/pages/<locale>/ and narration.
    locales: ['en', 'pt-br'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});