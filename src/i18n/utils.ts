import { defaultLocale, ui, type Locale, type UiKey } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && value in ui;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return isLocale(first) ? first : defaultLocale;
}

export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key] ?? ui[defaultLocale][key];
}
