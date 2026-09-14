# ADR 0003 — All network I/O in the background, streaming over a port

Date: 2026-09-13 · Status: accepted

## Context

Generations are long and must stream, be cancellable, and work on any site.

A content script cannot do this well: in MV3 its fetches are subject to the host
page's CORS policy, and giving it the API token would expose the credential to
every page the user visits. Meanwhile `runtime.sendMessage` is request/response —
it cannot deliver tokens as they arrive.

## Decision

- `InfomaniakAiClient` is constructed only in `src/entrypoints/background.ts`.
  ESLint forbids `fetch` elsewhere and forbids importing `core/auth/*` or
  `core/settings/secrets` outside the background.
- Streaming uses a long-lived port named `pagelingua/stream`. The UI posts a
  `StreamRequest`; the background posts `StreamEvent`s. Port disconnect aborts the
  upstream request through an `AbortController`.
- SSE parsing is its own dependency-free module (`core/ai/sse.ts`) with unit tests,
  because partial frames across chunk boundaries are the classic bug here.

## Consequences

- Content scripts stay small and unprivileged.
- Closing the side panel or navigating away stops the generation — and stops
  spending credits — without extra plumbing.
- The service worker can be evicted mid-stream. The port keeps it alive while a
  generation runs; a dropped port surfaces to the UI as `done`, which the UI must
  treat as "possibly truncated". Worth revisiting if it proves noticeable.
