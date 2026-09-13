# AGENTS.md

Instructions for any AI agent (or new human contributor) working in this repository.
Read this file first. It is the contract; everything else is detail.

---

## 1. What this project is

**Sova** is a browser extension for Chrome/Chromium and Firefox that brings
**Infomaniak AI Tools** into the browser: translate a selection or a whole page,
rewrite text in place, and ask questions about the page in a side panel.

The one non-negotiable product rule:

> **The extension runs on the end user's own Infomaniak account and credits.**
> There is no shared key, no proxy server, no backend of ours. The user's
> credential goes from their browser straight to `api.infomaniak.com`.

This is a client-only project. If a change requires a server, it is out of scope —
open an issue instead of building one.

## 2. Commands

| Command                             | What it does                                       |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm dev`                          | Chrome dev build with HMR                          |
| `pnpm dev:firefox`                  | Firefox dev build                                  |
| `pnpm build` / `pnpm build:firefox` | Production build into `.output/<target>-mv3`       |
| `pnpm zip:all`                      | Store-ready zips (Firefox also gets a sources zip) |
| `pnpm compile`                      | `tsc --noEmit`                                     |
| `pnpm lint`                         | ESLint, zero warnings tolerated                    |
| `pnpm test`                         | Vitest over `src/core/**`                          |
| `pnpm i18n:check`                   | Fails if any locale is missing a key               |

**Before opening a PR, all five must pass:** `pnpm format:check && pnpm lint && pnpm compile && pnpm test && pnpm i18n:check`.
CI runs exactly these plus both builds and `web-ext lint`.

## 3. Architecture in one picture

```
                       ┌─────────────────────────────────────────┐
   user gesture ─────► │ entrypoints/  (thin adapters, no logic)  │
                       │  popup · sidepanel · options · content   │
                       └──────────────┬──────────────────────────┘
                                      │ typed messages only
                                      │ core/messaging/protocol.ts
                       ┌──────────────▼──────────────────────────┐
                       │ entrypoints/background.ts               │
                       │  the ONLY privileged context            │
                       │  holds credentials · owns menus         │
                       └──────────────┬──────────────────────────┘
                                      │
     ┌────────────────────────────────┼─────────────────────────────┐
     │                                │                             │
┌────▼──────────┐          ┌──────────▼─────────┐        ┌──────────▼────────┐
│ core/auth     │          │ core/tasks         │        │ core/ai/client.ts │
│ AuthProvider  │          │ prompts, per task  │        │ the only fetch()  │
│ token | oauth │          │ tiered quick/…/deep│        └──────────┬────────┘
└───────────────┘          └────────────────────┘                   │
                                                                    ▼
                                                      https://api.infomaniak.com
                                                      /2/ai/{product_id}/openai/v1
```

### Layers

| Folder               | Rule                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/entrypoints/**` | Browser wiring and rendering. **No prompts, no `fetch`, no business rules.**                                            |
| `src/core/**`        | Pure TypeScript. No `browser.*` except in `settings/`, `i18n/` and `messaging/`. Everything here must be unit-testable. |
| `src/ui/**`          | Design system: tokens, primitives, `useTheme`. **No feature logic, no messaging.**                                      |
| `public/_locales/**` | Every user-visible string.                                                                                              |

### Hard boundaries (enforced by ESLint, see `eslint.config.js`)

1. **`fetch` is forbidden** outside `src/core/ai/client.ts`.
2. **`core/auth/*` and `core/settings/secrets.ts` are background-only.** A content
   script or an extension page that imports them is a bug, not a shortcut.
3. **Prompts live only in `src/core/tasks/registry.ts`.** If you are writing an
   instruction sentence anywhere else, stop and put it there.
4. **Never send page HTML to the model.** Page translation sends text nodes;
   context sends extracted plain text. Markup round-trips are how page
   translators break layouts and open injection holes.
5. **User text never enters a system prompt.** It goes in a `user` message.
   `tests/tasks.test.ts` asserts this — keep that test green.

## 4. The Infomaniak API — what is verified and what is not

Everything here is sourced in `docs/infomaniak-api.md`. Short version:

**Verified**

- Base URL: `https://api.infomaniak.com/2/ai/{product_id}/openai/v1`
- `POST /chat/completions` and `GET /models`, OpenAI-compatible.
- Auth: `Authorization: Bearer <token>`, token created in the Infomaniak Manager
  with the **`ai-tools`** scope.
- Billing is per token against the user's AI Tools credits.

**Not verified — do not write code that assumes it**

- Which model ids exist. **Never hardcode a model list**; call `GET /models` and
  cache. Third-party posts mention Llama/Mistral/Qwen/Gemma/Apertus names, but
  that is hearsay and product-dependent.
- Whether OAuth 2.0 (`login.infomaniak.com/authorize`) supports PKCE for a public
  client and can grant `ai-tools`. See `src/core/auth/oauth-provider.ts`.
- Whether `product_id` can be discovered from the account. Today the user types it.
- Whether image generation / transcription endpoints are exposed on the same
  OpenAI-compatible surface. Check before building a feature that needs them.

If you need one of these answers, **test it against a real account and write the
result into `docs/infomaniak-api.md` with the date**. Do not guess in code.

## 5. Adding things

**A new AI feature**

1. Add a `TaskDefinition` to `src/core/tasks/registry.ts` (prompt + tier + caps).
2. Add its case to `StreamRequest` in `core/messaging/protocol.ts`.
3. Handle that case in `background.ts` → `buildRequest`.
4. Trigger it from an entrypoint.
5. Add strings to `public/_locales/en/messages.json`, then every other locale.
6. Add a test asserting the prompt shape.

**A new setting**: `core/settings/schema.ts` (field + default + migration), then
the options UI. Nothing else reads storage directly.

**A new locale**: create `public/_locales/<code>/messages.json`, add the code to
`UI_LOCALES` in `core/i18n/languages.ts`, run `pnpm i18n:check`.

**A new UI component**: `src/ui/primitives/` if it is generic, next to the feature
otherwise. Use design tokens — **a raw hex, px radius or ms duration in a
component is a review rejection.** Add the token to `src/ui/tokens/tokens.css` first.

## 6. Cross-browser rules

- One manifest source: `wxt.config.ts`. **Never hand-write a `manifest.json`.**
- Branch on `browser` inside that config, nowhere else.
- Chrome uses `sidePanel`, Firefox uses `sidebar_action`. WXT generates both from
  the single `sidepanel` entrypoint; the runtime difference is feature-detected in
  `background.ts` → `openSidePanel`.
- Firefox needs `browser_specific_settings.gecko.id` — changing it orphans every
  existing install. Don't.
- Test in both before claiming a feature works. `web-ext lint` runs in CI because
  AMO runs the same linter on submission.

## 7. Privacy and security posture

This is the part reviewers at both stores look at, and the part users care about.

- **One host.** `host_permissions` is `https://api.infomaniak.com/*` and nothing
  else. Adding a host is a product decision, not a refactor.
- **No telemetry.** No analytics, no error reporting service, no ping. If you want
  metrics, the answer is no.
- **`<all_urls>` is optional**, requested at first use of page translation.
- **Credentials in `storage.local` only**, never `storage.sync`. Extension storage
  is not encrypted; the options page tells the user so. Do not pretend otherwise
  in the UI copy.
- **No remote code.** Both stores reject it, and `cdn`-loaded scripts would break
  the CSP. Everything is bundled.
- Page content leaves the browser only when the user asks for it, and only to
  their own Infomaniak product.

## 8. Style

- TypeScript strict. No `any` outside the one annotated escape hatch in
  `background.ts` → `withTask`.
- Comments explain **why**, not what. A comment restating the line below it will
  be removed.
- Errors: throw `AiError` with a code from `AiErrorCode`; the UI maps the code to
  an `error_<code>` message key. Never surface a raw HTTP status to a user.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`). The
  changelog is generated from them.
- Branch names: `feat/…`, `fix/…`, `chore/…`.

## 9. Where to look

| Question                                 | File                       |
| ---------------------------------------- | -------------------------- |
| How does a request flow end to end?      | `docs/architecture.md`     |
| What exactly does the Infomaniak API do? | `docs/infomaniak-api.md`   |
| What do the colours/spacings mean?       | `docs/design-system.md`    |
| How do I ship to the stores?             | `docs/store-submission.md` |
| Why is it built this way?                | `docs/adr/`                |
| What is planned?                         | `docs/roadmap.md`          |
