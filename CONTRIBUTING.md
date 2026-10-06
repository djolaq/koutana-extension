# Contributing

Thanks for looking. Read [`AGENTS.md`](AGENTS.md) first — it is the architecture
contract and it applies to humans as much as to agents.

## Setup

```bash
pnpm install
pnpm dev          # or pnpm dev:firefox
```

Node 22+, pnpm 10+.

## Before you open a PR

```bash
pnpm format:check && pnpm lint && pnpm compile && pnpm test && pnpm i18n:check
```

If the change touches the UI, run the relevant part of
[`docs/testing.md`](docs/testing.md) in **both** Chrome and Firefox and say so in
the PR.

## Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Branches: `feat/…`, `fix/…`, `chore/…`.
- New user-visible strings go in `public/_locales/en/messages.json` **and** every
  other locale; `pnpm i18n:check` enforces it.
- Design tokens only — no raw colours, radii or durations in components.
- An architectural change (new dependency in the content script, new host
  permission, a raised bundle budget) needs an ADR in `docs/adr/`.

## Good first issues

`docs/roadmap.md` M2 and M3 are deliberately small and self-contained. 3.1 (prompt
library) is the highest-leverage item if you want to make a dent.
