# Architecture

## Contexts and why each exists

| Context                                                              | Lives in                        | Responsibility                                                                                  | Never does                          |
| -------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Background** (MV3 service worker on Chrome, event page on Firefox) | `src/entrypoints/background.ts` | Holds credentials, performs every network call, owns context menus and commands, routes streams | Touch the DOM, contain prompt text  |
| **Content script**                                                   | `src/entrypoints/content/`      | Reads and mutates the page, draws the overlay in a Shadow DOM                                   | Hold a credential, call the network |
| **Popup**                                                            | `src/entrypoints/popup/`        | Launcher: connection status + three actions                                                     | Long-running work                   |
| **Side panel**                                                       | `src/entrypoints/sidepanel/`    | Conversation with page context                                                                  | Call the API directly               |
| **Options**                                                          | `src/entrypoints/options/`      | Onboarding and settings                                                                         | Anything else                       |

### Why the background does all the I/O

Two reasons, both load-bearing:

1. **CORS.** In MV3, a fetch from the background context to a host listed in
   `host_permissions` is not subject to the page's CORS policy. The same fetch from
   a content script _is_ — it inherits the page's origin. Putting the client in the
   background is what makes the extension work on arbitrary sites without a proxy.
2. **Blast radius.** A content script runs inside a hostile document. It must never
   be able to read the user's API token.

## Request lifecycle

### One-shot (`send`)

```
UI ──runtime.sendMessage(Request)──► background.handle()
                                        ├─ auth / settings / models
                                        └─ returns Response (never throws across the boundary)
```

Errors are values: `{ ok: false, code, message }`. The UI maps `code` to an
`error_<code>` locale key.

### Streaming (`stream`)

```
UI ──runtime.connect('pagelingua/stream')──► background.onConnect
UI ──postMessage(StreamRequest)─────►   run()
                                          ├─ settings + resolved target language
                                          ├─ TASKS[kind].build(input, ctx)  → messages
                                          ├─ pickModel(tier)               → model id
                                          └─ ai.chatStream() ──► SSE ──► { kind:'delta' } …
UI ◄──postMessage(StreamEvent)──────────┘
UI  port.disconnect()  ⇒ AbortController fires ⇒ request cancelled upstream
```

A port, not a message, because MV3 messaging cannot stream, and because a port's
disconnect is the cancellation signal — closing the panel stops burning credits.

## Model tiers

Tasks declare a tier, not a model: `quick`, `standard`, `deep`. The user maps each
tier to one of the models their AI product actually exposes. This means:

- new models appear in the picker without a code change;
- a cheap model can back inline rewriting while a strong one backs the panel;
- no model id is ever hardcoded (see AGENTS.md §4).

On the first successful `GET /models`, empty tiers are seeded automatically so the
extension is usable before the user visits settings.

## Page translation

`collectSegments` walks text nodes (skipping `code`, `pre`, editable fields and our
own UI), `batchSegments` groups ~3 kB of text per request, each batch is sent as a
numbered list and parsed back by index. Untranslated or dropped lines keep their
original text. `restore()` puts everything back — running the action twice toggles.

Markup never leaves the browser. That is deliberate; see AGENTS.md §3.

## Shadow DOM

The content-script UI mounts through WXT's `createShadowRootUi`. The host page's
CSS cannot reach in, and Tailwind's preflight cannot leak out. Design tokens are
declared on both `:root` and `:host` so the same CSS works in the popup and inside
the shadow root.

## What is deliberately absent

- No backend, no proxy, no shared API key.
- No state manager: React local state plus `storage` watchers is enough at this
  size, and it keeps the content-script bundle small.
- No UI component library: primitives in `src/ui` are a few hundred lines and cost
  nothing to maintain, where a component library would be the single largest
  dependency in a bundle that ships on every page load.
