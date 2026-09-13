# ADR 0001 — WXT as the build system, one manifest source

Date: 2026-09-13 · Status: accepted

## Context

The extension must ship to the Chrome Web Store and to AMO from one codebase.
The two platforms differ in manifest version history, background model (service
worker vs event page), side panel API (`sidePanel` vs `sidebar_action`), and the
`chrome.*` / `browser.*` namespace. Hand-maintaining two manifests and a polyfill
layer is the classic way these projects rot.

## Options considered

- **Plain Vite + hand-written manifests.** Maximum control, but every cross-browser
  difference becomes our code, and HMR for content scripts has to be built.
- **CRXJS.** Good Vite integration, Chrome-centric; Firefox support is not its
  focus.
- **Plasmo.** Batteries included, but opinionated file conventions and a heavier
  runtime than we want in a content script that loads on every page.
- **WXT.** Vite-based, generates per-target manifests from one config, handles the
  MV2/MV3 and Chrome/Firefox differences, ships `wxt zip` and `wxt submit` for
  store delivery, and provides `createShadowRootUi` — which we need anyway.

## Decision

WXT, with `manifestVersion: 3` for both targets and all browser-specific logic
expressed as a function of `browser` inside `wxt.config.ts`.

## Consequences

- No `manifest.json` in the repository. Reviewers read `wxt.config.ts`.
- We inherit WXT's release cadence; it is pinned and updated through Dependabot.
- `wxt submit` gives us store uploads without writing an uploader.
- If WXT were ever abandoned, the escape hatch is real but not free: the generated
  manifests in `.output/` are plain files, so a migration means adopting them and
  replacing `defineBackground`/`defineContentScript`/`createShadowRootUi`.
