import { browser } from '#imports';

/**
 * Locales the UI ships in. Adding one means: create
 * `public/_locales/<code>/messages.json`, add the code here, and
 * `pnpm i18n:check` fails until every key is translated. English is the base —
 * every other file is checked against it.
 */
export const UI_LOCALES = ['en', 'fr', 'de', 'es', 'it'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const LOCALE_NAMES: Record<UiLocale, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
};

/**
 * Translation targets offered in the UI. Wider than UI_LOCALES on purpose: the
 * model can translate into far more languages than we localise the interface in.
 */
export const TRANSLATION_TARGETS = [
  'en',
  'fr',
  'de',
  'it',
  'es',
  'pt',
  'nl',
  'pl',
  'ro',
  'cs',
  'sv',
  'da',
  'fi',
  'no',
  'el',
  'tr',
  'ru',
  'uk',
  'ar',
  'he',
  'hi',
  'zh',
  'ja',
  'ko',
  'vi',
  'th',
  'id',
] as const;

/** Human name of a BCP-47 tag, in the reader's own language. */
export function languageName(tag: string, displayIn: string): string {
  try {
    return new Intl.DisplayNames([displayIn], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}

/** Resolves `'auto'` to the browser UI language, normalised to a base tag. */
export function resolveLanguage(value: string | 'auto'): string {
  if (value && value !== 'auto') return value;
  const uiLanguage = browser.i18n?.getUILanguage?.() ?? 'en';
  return uiLanguage.split('-')[0] || 'en';
}
