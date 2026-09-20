/**
 * Single source of truth for everything the user can configure.
 * Add a field here, then add its label to `src/locales/en.yml` — nowhere else.
 */

export type ToneId = 'neutral' | 'formal' | 'friendly' | 'concise';

export interface ModelRouting {
  /** Fast + cheap: inline rewriting, short translations. */
  quick: string;
  /** Balanced: page translation, summaries. */
  standard: string;
  /** Strongest available: side-panel chat, long reasoning. */
  deep: string;
}

export interface Settings {
  schemaVersion: number;
  /** Target language for translation. `auto` follows the browser UI language. */
  targetLanguage: string | 'auto';
  /** UI language. `auto` follows the browser UI language. */
  uiLanguage: string | 'auto';
  models: ModelRouting;
  defaultTone: ToneId;
  /** Show the floating writing-assistant handle in editable fields. */
  writingAssistantEnabled: boolean;
  /** Hosts on which the extension never injects anything. */
  blockedHosts: string[];
  /** Keep a local history of side-panel conversations. */
  keepHistory: boolean;
  theme: 'system' | 'light' | 'dark';
}

export const SETTINGS_SCHEMA_VERSION = 1;

/**
 * Model ids are NOT hardcoded as a canonical list: the real list comes from
 * `GET /2/ai/{product_id}/openai/v1/models` at runtime and is cached. These
 * defaults are only a first guess for a fresh install and are replaced as soon
 * as the first model listing succeeds.
 */
export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  targetLanguage: 'auto',
  uiLanguage: 'auto',
  models: { quick: '', standard: '', deep: '' },
  defaultTone: 'neutral',
  writingAssistantEnabled: true,
  blockedHosts: [],
  keepHistory: true,
  theme: 'system',
};

/** Runs on every extension update. Keep every past version reachable. */
export function migrate(raw: Partial<Settings> | undefined): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  merged.schemaVersion = SETTINGS_SCHEMA_VERSION;
  return merged;
}
