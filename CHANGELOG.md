# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Project foundation: WXT build for Chrome MV3 and Firefox MV3 from one config.
- Design system: tokens, light/dark, `Button` / `Field` / `Callout` / `Card`.
- Infomaniak AI client with SSE streaming, typed errors and cancellation.
- Token authentication behind an `AuthProvider` seam, with connection verification.
- Selection and full-page translation, side-panel chat with page context.
- Five locales (en, fr, de, es, it) with a CI gate on completeness.
- CI: lint, types, tests, locale check, both builds, `web-ext lint`; release
  workflow with gated store uploads.
