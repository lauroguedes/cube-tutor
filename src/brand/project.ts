import type { Locale } from '../i18n/ui';

// Who made this and where the code lives. Shown in the settings menu.

export const PROJECT = {
  author: 'Lauro Guedes',
  authorUrl: 'https://lauroguedes.dev',
  coffeeUrl: 'https://buymeacoffee.com/lauroguedes',
  repo: 'lauroguedes/cube-tutor',
  repoUrl: 'https://github.com/lauroguedes/cube-tutor',
} as const;

/**
 * Affiliate links to buy a real cube, per language. The "buy a cube" link
 * only appears in languages listed here.
 */
export const SHOP_URLS: Partial<Record<Locale, string>> = {
  'pt-br': 'https://meli.la/1eY97kT', // Mercado Livre Afiliados
};
