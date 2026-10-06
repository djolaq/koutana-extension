import { storage } from '#imports';
import { DEFAULT_SETTINGS, migrate, type Settings } from './schema';

/**
 * Settings live in `storage.sync` so they follow the user between machines.
 * Credentials never do — see `secrets.ts`.
 */
const item = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
  version: 1,
});

export const settingsStore = {
  async get(): Promise<Settings> {
    return migrate(await item.getValue());
  },
  async patch(patch: Partial<Settings>): Promise<Settings> {
    const next = migrate({ ...(await item.getValue()), ...patch });
    await item.setValue(next);
    return next;
  },
  async reset(): Promise<void> {
    await item.setValue(DEFAULT_SETTINGS);
  },
  watch(cb: (settings: Settings) => void): () => void {
    return item.watch((value) => cb(migrate(value)));
  },
};
