import type { AuthProvider, AuthStatus, Credentials } from './provider';

/**
 * OAuth 2.0 provider — NOT WIRED UP YET. Do not import this from entrypoints.
 *
 * What is verified today (see docs/infomaniak-api.md):
 *   - Infomaniak runs an OAuth2/OIDC authorisation server at login.infomaniak.com
 *     (`/authorize`, `/token`, `/oauth2/userinfo`), and applications are
 *     registered at manager.infomaniak.com → profile → applications.
 *   - Infomaniak's own iOS/Android login libraries use a public client with a
 *     custom-scheme redirect and no client secret.
 *
 * What is NOT verified and MUST be tested against a real application before any
 * of this ships:
 *   1. that the authorisation server accepts PKCE (S256) for public clients;
 *   2. that an `https://<extension-id>.chromiumapp.org/` redirect URI is
 *      accepted (Chrome `identity.launchWebAuthFlow`) alongside the Firefox
 *      equivalent from `browser.identity.getRedirectURL()`;
 *   3. that a token obtained this way carries the `ai-tools` scope, i.e. that it
 *      can call /2/ai/{product_id}/openai/v1/*;
 *   4. whether the AI product id can be discovered from the account after login,
 *      or must still be entered by hand.
 *
 * Until (1)–(4) are answered, this file stays a documented stub. Filling it in
 * is tracked as milestone M4.
 */
export class OAuthAuthProvider implements AuthProvider {
  readonly kind = 'oauth' as const;

  static readonly AUTHORIZE_URL = 'https://login.infomaniak.com/authorize';
  static readonly TOKEN_URL = 'https://login.infomaniak.com/token';
  static readonly USERINFO_URL = 'https://login.infomaniak.com/oauth2/userinfo';

  async getCredentials(): Promise<Credentials | null> {
    throw new Error('OAuthAuthProvider is not implemented yet — see milestone M4');
  }

  async getStatus(): Promise<AuthStatus> {
    return { kind: this.kind, connected: false };
  }

  async disconnect(): Promise<void> {
    /* no-op until implemented */
  }
}
