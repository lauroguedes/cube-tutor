import { defaultLocale, ui, type Locale, type UiKey } from './ui';

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

/** Locale-aware path, e.g. localePath('pt-br', '/learn') → '/pt-br/learn'. */
export function localePath(locale: Locale, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}
