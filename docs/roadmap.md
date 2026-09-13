# Roadmap

Milestones are sequential; use cases inside a milestone are not. Anything marked
**⚠ unverified** depends on an open question in `docs/infomaniak-api.md` — answer
the question before estimating the work.

---

## M1 — Foundation ✅ (this scaffold)

Cross-browser build, design system, typed messaging, streaming client, token auth,
five locales, CI, store pipeline.

## M2 — v1 features

| #   | Use case                                                                                                                                                                         | Where it lives         | Notes                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **Translate a selection** — right-click or `Alt+Shift+T`, result in the overlay, one-click copy                                                                                  | content + overlay      | done in scaffold, needs polish: anchor near the selection instead of bottom-right                                                                                 |
| 2.2 | **Translate the whole page in place** — toggle on/off, progress bar, original restorable                                                                                         | `core/page/segments`   | done; needs a `MutationObserver` for infinite-scroll pages                                                                                                        |
| 2.3 | **Writing assistant in any field** — floating handle on `input`/`textarea`/`contenteditable`: fix, improve, shorten, expand, change tone, translate; replaces the text with undo | new `content/writing/` | `rewriteTask` already exists; the work is the field adapter (`execCommand('insertText')` for undo support, plus per-editor quirks for Gmail/Notion-style editors) |
| 2.4 | **Ask about this page** — side panel, page or selection as context, streaming                                                                                                    | sidepanel              | done; add conversation persistence                                                                                                                                |
| 2.5 | **Summarise this page** — one-click, bullet points + a "so what" line                                                                                                            | sidepanel              | `summarizeTask` exists, needs its button                                                                                                                          |
| 2.6 | **Explain this** — selection → plain-language explanation at a chosen level                                                                                                      | tasks + overlay        | small                                                                                                                                                             |

## M3 — Make it feel finished

| #   | Use case                                                                                                                                        | Notes                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 3.1 | **Prompt library** — user-defined prompts with `{{selection}}` / `{{page}}` placeholders, shown in the context menu and the overlay             | the single highest-leverage feature: every use case we did not think of becomes a user-built one |
| 3.2 | **Credit awareness** — running token counter per session, warning when a page translation will be expensive, link to the Manager's spending cap | uses `usage` from the stream, already plumbed                                                    |
| 3.3 | **History** — past conversations and translations, searchable, local only                                                                       |                                                                                                  |
| 3.4 | **Per-site rules** — auto-translate this domain, never inject on that one                                                                       | `blockedHosts` exists                                                                            |
| 3.5 | **Keyboard-first palette** — `Alt+Shift+K` opens a command palette over the page                                                                |                                                                                                  |

## M4 — OAuth ⚠ unverified

Replace (or complement) token entry with "Sign in with Infomaniak" via
`identity.launchWebAuthFlow` + PKCE, behind the existing `AuthProvider`. Blocked on
questions 2–5 in `docs/infomaniak-api.md`. Keep token auth as a fallback for users
who prefer a scoped credential.

## M5 — Quality

End-to-end tests with Playwright against a real profile (Chrome and Firefox),
screenshot generation for store listings, `MutationObserver`-based translation for
dynamic pages, accessibility audit against the baseline in `docs/design-system.md`.

## M6 — Documents ⚠ partly unverified

| #   | Use case                                                                            | Notes                                                                  |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 6.1 | **Translate a PDF open in the browser**                                             | needs text extraction in the extension; the viewer is not a normal DOM |
| 6.2 | **Translate an uploaded file** from the side panel (`.txt`, `.md`, `.srt`, `.docx`) | chunking + reassembly; `.srt` is a nice, self-contained first target   |
| 6.3 | **Summarise a long page by sections** with a table of contents                      | pure client work                                                       |

## M7 — Beyond text ⚠ unverified

Depends on whether transcription and image endpoints are exposed on the same
OpenAI-compatible base (question 6).

| #   | Use case                                                                                            | Notes                                                          |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 7.1 | **Transcribe a video or audio on the page** → transcript, then summary, then translation            | Whisper is advertised on the product page                      |
| 7.2 | **Subtitle translation** for a `<track>` or an `.srt` the user drops in                             |                                                                |
| 7.3 | **Describe an image** — right-click an image, get alt text; genuinely useful for accessibility work | needs a multimodal model on the product                        |
| 7.4 | **Generate an image** from the side panel                                                           | image generation was "being rolled out" at the time of writing |

## M8 — Professional use cases

These are where an extension on _your own_ sovereign AI account beats a consumer
tool, because the page content never reaches a US-hosted service.

| #   | Use case                                                                                                           | Notes                                             |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 8.1 | **Reply drafting in webmail** — draft a reply in the thread's language and register, from inside the compose field | builds on 2.3                                     |
| 8.2 | **Form filling assistance** — expand terse notes into the prose a form expects (ticketing, CRM, incident reports)  |                                                   |
| 8.3 | **Extract structured data from a page** — table, contacts, dates → CSV/JSON in the panel                           | needs a strict JSON task + validation             |
| 8.4 | **Compare two tabs** — diff two versions of a document or a policy                                                 |                                                   |
| 8.5 | **Glossary / house style** — a user-supplied term list injected into every translation prompt                      | small, and the thing translators actually ask for |

---

## Deliberately out of scope

- Any backend of ours, any shared API key, any account system.
- Telemetry or analytics of any kind.
- Auto-acting on the page without an explicit user gesture.
- Bundling a model locally.
