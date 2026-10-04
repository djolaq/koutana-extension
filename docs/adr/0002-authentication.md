# ADR 0002 — Personal API token first, OAuth behind the same seam

Date: 2026-09-13 · Status: accepted

## Context

The product rule is that the extension spends the **user's** Infomaniak credits.
Two ways to get there:

1. **Personal API token.** The user creates a token in the Manager with the
   `ai-tools` scope and pastes it. Fully documented, works today.
2. **OAuth 2.0.** Infomaniak runs an authorisation server at
   `login.infomaniak.com` and lets you register applications. Its own mobile apps
   use a public client with a custom-scheme redirect. But nothing public confirms
   PKCE support for third-party public clients, that an extension redirect URI is
   accepted, or that an OAuth token can carry `ai-tools`.

Building on (2) before testing it risks discovering at integration time that the
whole auth story has to change.

## Decision

Ship (1). Put both behind `AuthProvider` (`getCredentials` → `{ accessToken,
productId }`) so the AI client never knows which is in use. `OAuthAuthProvider`
exists as a documented stub listing exactly what must be verified first.

## Consequences

- Onboarding is three steps instead of one button. The options page walks through
  them with direct Manager links, and "Connect and verify" calls `GET /models`
  immediately so a wrong value fails loudly instead of silently.
- The token is stored in `storage.local`. Extension storage is not encrypted at
  rest; we say so in the UI rather than implying security we do not have. The
  mitigations are real but modest: local-only (never `sync`), background-only
  access, and guidance to scope the token to `ai-tools` and give it an expiry.
- Adding OAuth later is additive: a new provider class, a toggle in settings, no
  change to `InfomaniakAiClient` or to any task.
