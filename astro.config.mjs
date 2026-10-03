// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Public address: canonical URLs, social cards and the sitemap use it.
  // Override with SITE_URL for preview deployments.
  site: process.env.SITE_URL ?? 'https://cubetutor.lauroguedes.dev',
  // Pages live at /learn/ etc.; links and canonical URLs always use the slash.
  trailingSlash: 'always',
  integrations: [vue(), sitemap({ filter: (page) => !page.includes('/404') })],
  i18n: {
    // Add 'pt-br' (and more) here when the translated content and narration exist.
    locales: ['en'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});