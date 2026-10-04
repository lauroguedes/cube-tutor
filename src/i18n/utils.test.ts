import { describe, expect, it } from 'vitest';
import { getLocaleFromUrl, localePath, translatePath } from './utils';

describe('locale paths', () => {
  it('reads the locale from the first path segment', () => {
    expect(getLocaleFromUrl(new URL('https://x.dev/pt-br/learn/'))).toBe('pt-br');
    expect(getLocaleFromUrl(new URL('https://x.dev/learn/'))).toBe('en');
  });

  it('prefixes every locale but the default', () => {
    expect(localePath('en', '/learn')).toBe('/learn/');
    expect(localePath('pt-br', '/')).toBe('/pt-br/');
  });

  it('translates a path in both directions', () => {
    expect(translatePath('/learn/cross/', 'pt-br')).toBe('/pt-br/learn/cross/');
    expect(translatePath('/pt-br/learn/cross/', 'en')).toBe('/learn/cross/');
    expect(translatePath('/pt-br/', 'en')).toBe('/');
    expect(translatePath('/', 'pt-br')).toBe('/pt-br/');
    expect(translatePath('/play', 'pt-br')).toBe('/pt-br/play/');
  });
});
