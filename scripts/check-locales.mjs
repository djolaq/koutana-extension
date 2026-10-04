#!/usr/bin/env node
/**
 * Locale gate. English is the contract; every other locale must cover it.
 * Run by CI on every PR — a missing key fails the build, so a new string can
 * never ship untranslated.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/_locales', import.meta.url).pathname;
const BASE = 'en';

const read = (locale) => JSON.parse(readFileSync(join(ROOT, locale, 'messages.json'), 'utf8'));

const base = read(BASE);
const baseKeys = Object.keys(base);
const locales = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((locale) => locale !== BASE);

let failed = false;

for (const locale of locales) {
  const messages = read(locale);
  const missing = baseKeys.filter((key) => !messages[key]?.message);
  const extra = Object.keys(messages).filter((key) => !base[key]);
  const untranslated = baseKeys.filter(
    (key) =>
      messages[key]?.message && messages[key].message === base[key].message && key !== 'extName',
  );

  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${locale}`);
    if (missing.length) console.error(`  missing: ${missing.join(', ')}`);
    if (extra.length) console.error(`  unknown: ${extra.join(', ')}`);
  } else {
    const note = untranslated.length ? ` (${untranslated.length} identical to English)` : '';
    console.log(`✓ ${locale} — ${baseKeys.length} keys${note}`);
  }
}

if (failed) {
  console.error('\nLocale check failed. Add the missing keys, or run `pnpm i18n:translate`.');
  process.exit(1);
}
console.log(`\n${locales.length + 1} locales, ${baseKeys.length} keys, all complete.`);
