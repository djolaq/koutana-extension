/**
 * Authentication seam.
 *
 * v1 ships `TokenAuthProvider` (the user pastes a personal API token created in
 * the Infomaniak Manager with the `ai-tools` scope). `OAuthAuthProvider` is the
 * planned second implementation — see docs/adr/0002-authentication.md. Nothing
 * outside this folder is allowed to know which one is in use: the AI client only
 * ever sees `Credentials`.
 */

export interface Credentials {
  /** Sent as `Authorization: Bearer <accessToken>`. */
  accessToken: string;
  /** The AI Tools product this account owns; part of the API path. */
  productId: string;
}

export type AuthKind = 'token' | 'oauth';

export interface AuthStatus {
  kind: AuthKind;
  connected: boolean;
  /** Set when the provider knows who is connected (OAuth only, for now). */
  accountLabel?: string;
}

export interface AuthProvider {
  readonly kind: AuthKind;
  /** Returns null when the user has not connected an account yet. */
  getCredentials(): Promise<Credentials | null>;
  getStatus(): Promise<AuthStatus>;
  /** Drops any stored credential. Must be safe to call when not connected. */
  disconnect(): Promise<void>;
}
