import { secrets } from '../settings/secrets';
import type { AuthProvider, AuthStatus, Credentials } from './provider';

/**
 * "Bring your own token" provider.
 *
 * The token is created by the user at
 *   manager.infomaniak.com → profile → API tokens → scope `ai-tools`
 * and stored in `browser.storage.local`.
 *
 * Honest limitation, documented in the options UI: extension storage is not
 * encrypted at rest. Anyone with access to the browser profile on disk can read
 * it, exactly as for any other extension credential. We mitigate by (a) never
 * using `storage.sync`, (b) never exposing the token to content scripts, and
 * (c) telling the user to scope the token to `ai-tools` and set an expiry.
 */
export class TokenAuthProvider implements AuthProvider {
  readonly kind = 'token' as const;

  async getCredentials(): Promise<Credentials | null> {
    const [accessToken, productId] = await Promise.all([
      secrets.get('apiToken'),
      secrets.get('productId'),
    ]);
    if (!accessToken || !productId) return null;
    return { accessToken, productId };
  }

  async getStatus(): Promise<AuthStatus> {
    return { kind: this.kind, connected: (await this.getCredentials()) !== null };
  }

  async setCredentials(credentials: Credentials): Promise<void> {
    await secrets.set('apiToken', credentials.accessToken.trim());
    await secrets.set('productId', credentials.productId.trim());
  }

  async disconnect(): Promise<void> {
    await secrets.remove('apiToken');
    await secrets.remove('productId');
  }
}
