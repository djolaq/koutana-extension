# Shipping to the stores

## What CI already does

`pnpm zip:all` produces:

```
.output/kounata-<version>-chrome.zip
.output/kounata-<version>-firefox.zip
.output/kounata-<version>-sources.zip   ← AMO requires this for bundled extensions
```

Tagging `v*` runs `.github/workflows/release.yml`: it packages both targets,
attaches the zips to a GitHub release, and — after a manual approval on the
`store-release` GitHub Environment — uploads to both stores via `wxt submit`.

## One-time setup

### Chrome Web Store

1. Register as a developer (one-off fee) at the Developer Dashboard.
2. Upload the first zip **by hand**. The API can only update an existing item.
3. Create a Google Cloud project, enable the _Chrome Web Store API_, create an
   OAuth client (Desktop app), and generate a refresh token.
4. Repository secrets: `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`,
   `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`.

### Firefox Add-ons (AMO)

1. Create an addons.mozilla.org account.
2. Generate API credentials (JWT issuer + secret) in the developer hub.
3. Repository secrets: `FIREFOX_EXTENSION_ID` (= `kounata@laqua.fr`, the gecko id),
   `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`.
4. AMO reviews source for bundled extensions — the sources zip and a build note in
   the listing (Node version + `pnpm install && pnpm zip:firefox`) are required.

### Edge / Opera / Brave

Brave and Opera accept the Chrome zip as-is. Edge has its own Partner Center and
its own API; the same zip works. Add them once the Chrome listing is approved.

## Review notes that apply to this extension

Both stores ask _why_ each permission exists. Answer with the same wording in both
listings:

| Permission                              | Justification                                                          |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `storage`                               | Stores the user's own settings and their Infomaniak API token locally. |
| `contextMenus`                          | Right-click entries for translate / summarise / ask.                   |
| `activeTab`, `scripting`                | Read the page the user explicitly acted on.                            |
| `sidePanel` (Chrome)                    | The conversation panel.                                                |
| `host_permissions: api.infomaniak.com`  | The only server contacted: the user's own AI product.                  |
| `optional_host_permissions: <all_urls>` | Requested only when the user first translates a full page.             |

Expect to be asked about data handling. The honest answers:

- No data is collected by us; there is no backend.
- Page text and selections are sent to `api.infomaniak.com` **on the user's own
  account**, only when the user triggers an action.
- No analytics, no remote code, no third-party scripts.

## Checklist per release

- [ ] `pnpm format:check && pnpm lint && pnpm compile && pnpm test && pnpm i18n:check`
- [ ] Manual pass of `docs/testing.md` in Chrome **and** Firefox
- [ ] `npx web-ext lint --source-dir .output/firefox-mv3`
- [ ] Version bumped in `package.json`, `CHANGELOG.md` updated
- [ ] Screenshots regenerated if any UI changed (1280×800, one per locale for the
      listing's primary languages)
- [ ] Tag `vX.Y.Z`, approve the `store-release` environment
