import { browser } from '#imports';

/**
 * Typed wrapper around `browser.i18n.getMessage`.
 *
 * Why the vanilla API rather than a runtime i18n library: it is synchronous (no
 * flash of untranslated UI), it is what localises the manifest itself, and the
 * browser already performs locale negotiation and fallback — which is exactly
 * the "follows the browser language" behaviour we want.
 *
 * WXT types `getMessage` from `public/_locales/en/messages.json`, so a typo or a
 * key that exists in only one locale is a compile error, not a blank label.
 */
export type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];

export function t(key: MessageKey, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions) || String(key);
}

/**
 * For keys assembled at runtime — error codes, task ids. Falls back to a real,
 * type-checked key so the user never sees a raw identifier.
 */
export function tDynamic(key: string, fallbackKey: MessageKey): string {
  return browser.i18n.getMessage(key as MessageKey) || t(fallbackKey);
}
