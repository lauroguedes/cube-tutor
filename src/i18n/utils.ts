import { defaultLocale, ui, type Locale, type UiKey } from './ui';

/** localStorage key for the language the visitor picked in the language menu. */
export const LOCALE_KEY = 'cube-tutor:locale';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && value in ui;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return isLocale(first) ? first : defaultLocale;
}

export function useTranslations(locale: Locale) {
  return (key: UiKey, vars?: Record<string, string | number>): string => {
    const s: string = ui[locale][key] ?? ui[defaultLocale][key];
    return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
  };
}

/**
 * Locale-aware page path with the trailing slash pages are served at,
 * e.g. localePath('pt-br', '/learn') → '/pt-br/learn/'. Matching the
 * canonical URLs avoids a redirect on every internal link.
 */
export function localePath(locale: Locale, path: string): string {
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  return locale === defaultLocale ? withSlash : `/${locale}${withSlash}`;
}

/** The same page in another language, e.g. '/learn/cross/' → '/pt-br/learn/cross/'. */
export function translatePath(pathname: string, to: Locale): string {
  const [, first, ...rest] = pathname.split('/');
  const path = isLocale(first) ? `/${rest.join('/')}` : pathname;
  return localePath(to, path);
}

/** Every language a page exists in, with its path (for hreflang links and the language menu). */
export function alternates(pathname: string): { locale: Locale; path: string }[] {
  return (Object.keys(ui) as Locale[]).map((locale) => ({ locale, path: translatePath(pathname, locale) }));
}
