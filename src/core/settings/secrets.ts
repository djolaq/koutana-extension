import { storage } from '#imports';

/**
 * Credentials, isolated from ordinary settings.
 *
 * Rules enforced by review (and by `tests/secrets.test.ts`):
 *   - `local:` only. Never `sync:` — we do not push a user's API token to their
 *     browser vendor's cloud.
 *   - Only the background script may read these. If you find yourself importing
 *     this file from a content script, the design is wrong.
 */
type SecretKey = 'apiToken' | 'productId' | 'oauthRefreshToken';

export const secrets = {
  async get(key: SecretKey): Promise<string | null> {
    return storage.getItem<string>(`local:secret.${key}`);
  },
  async set(key: SecretKey, value: string): Promise<void> {
    await storage.setItem(`local:secret.${key}`, value);
  },
  async remove(key: SecretKey): Promise<void> {
    await storage.removeItem(`local:secret.${key}`);
  },
};
