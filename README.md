<div align="center">

# PageLingua

**Translate, rewrite and ask questions about any page — on your own Infomaniak AI account.**

Chrome · Edge · Brave · Opera · Firefox

</div>

---

PageLingua puts [Infomaniak AI Tools](https://www.infomaniak.com/en/hosting/ai-services)
into the browser. It uses **your** Infomaniak account and **your** AI credits:
there is no backend, no shared API key, and no account to create with us. Page
content goes to your own AI product in Switzerland, and nowhere else.

## What it does

|                            |                                                                                |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Translate a selection**  | Right-click or `Alt+Shift+T`. The result streams into a small overlay.         |
| **Translate a whole page** | In place, structure preserved, reversible with one click.                      |
| **Rewrite as you type**    | Fix, shorten, expand or change the tone of text in any field.                  |
| **Ask about the page**     | A side panel that has the page as context — summarise, extract, question.      |
| **Choose your models**     | Map "quick", "standard" and "deep" to whichever models your AI product offers. |

The interface follows your browser's language (English, French, German, Spanish,
Italian today) and your light/dark preference.

## Getting started

1. In the [Infomaniak Manager](https://manager.infomaniak.com/v3/ng/products/cloud/ai-tools),
   open **AI Tools** and note your product ID.
2. In your profile, create an **API token** with the `ai-tools` scope.
3. Install PageLingua, open its settings, paste both, and press **Connect and verify**.

New Infomaniak accounts include a million free credits, and you can set a spending
cap in the Manager.

## Development

```bash
pnpm install
pnpm dev            # Chrome, with hot reload
pnpm dev:firefox    # Firefox
```

```bash
pnpm lint && pnpm compile && pnpm test && pnpm i18n:check   # what CI runs
pnpm build && pnpm build:firefox                            # production builds
pnpm zip:all                                                # store-ready packages
```

Requires Node 22+ and pnpm 10+.

## Documentation

|                                                        |                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                               | **Start here.** Architecture contract, boundaries, how to add things. |
| [`docs/architecture.md`](docs/architecture.md)         | Contexts, request lifecycle, page translation.                        |
| [`docs/infomaniak-api.md`](docs/infomaniak-api.md)     | What is verified about the API, and what is not.                      |
| [`docs/design-system.md`](docs/design-system.md)       | Tokens, primitives, accessibility baseline.                           |
| [`docs/roadmap.md`](docs/roadmap.md)                   | Milestones and the use-case backlog.                                  |
| [`docs/store-submission.md`](docs/store-submission.md) | Publishing to Chrome Web Store and AMO.                               |
| [`docs/adr/`](docs/adr/)                               | Why it is built this way.                                             |

## Privacy

- No telemetry, no analytics, no error reporting.
- One host in `host_permissions`: `api.infomaniak.com`.
- Your token is stored locally in your browser and never synchronised.
- Page content is sent only when you ask for something, and only to your own
  Infomaniak AI product.

See [`SECURITY.md`](SECURITY.md).

## Name

PageLingua is an independent project and is **not affiliated with or endorsed by
Infomaniak** — it simply lets you use the Infomaniak AI account you already pay
for. See [`docs/adr/0005-naming.md`](docs/adr/0005-naming.md) for how the name was
chosen and checked.

## Licence

MIT.
