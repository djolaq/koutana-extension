# Testing

## Automated

`pnpm test` covers `src/core/**` — the layer written to be browser-free:

- `sse.test.ts` — frames split across chunks, CRLF, keep-alives, `[DONE]`.
- `segments.test.ts` — batching budgets, numbered-list round trip, and the
  fallbacks when the model misbehaves (missing line, empty line, stray prose).
- `tasks.test.ts` — prompt shape, one instruction per rewrite action, token caps,
  and the assertion that user text never lands in a system prompt.

If a module cannot be tested here, it has logic in the wrong layer.

## Manual pass (before every release, in Chrome **and** Firefox)

Load the unpacked build from `.output/<target>-mv3`.

**Onboarding**

- [ ] Fresh profile: popup shows "no account connected" and the actions are disabled.
- [ ] Wrong token → `error_unauthorized`, in the browser's language.
- [ ] Wrong product id → `error_not_found`.
- [ ] Correct pair → connected, models listed, tiers pre-filled.
- [ ] Disconnect clears everything; the popup returns to the disabled state.

**Translation**

- [ ] Select text → context menu → overlay streams, copy works.
- [ ] `Alt+Shift+T` with no selection → "select some text first".
- [ ] Translate a full page; progress bar advances; layout is intact; links still work.
- [ ] Run it again → original text restored.
- [ ] Try a page with code blocks: `pre`/`code` untouched.

**Side panel**

- [ ] Opens from the popup, the context menu and `Alt+Shift+S`.
- [ ] Streams; Stop actually stops; closing the panel cancels the request.
- [ ] "Use this page" off → answer no longer references the page.
- [ ] On a page with no content script (store page, PDF) it degrades instead of failing.

**Cross-cutting**

- [ ] Dark theme and light theme, plus the explicit switch overriding the system.
- [ ] Browser set to French, German, Spanish, Italian → UI and context menus follow.
- [ ] Keyboard only: every control reachable, focus always visible.
- [ ] A heavy site (a web app with aggressive CSS) → the overlay is not deformed and
      the page is not deformed by us.
- [ ] Offline → `error_network`, not a silent failure.

## What we do not test automatically yet

End-to-end browser runs are milestone M5 (Playwright against a real profile, both
browsers). Until then this checklist is the gate.
