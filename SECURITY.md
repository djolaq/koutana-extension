# Security

## Reporting

Please report vulnerabilities privately through GitHub's _Report a vulnerability_
button on the Security tab, or by email to the address in the repository profile.
Do not open a public issue. Expect an acknowledgement within a week.

## Threat model

Kounata stores a credential that can spend money on the user's Infomaniak account, and
runs code on every page the user visits. The design follows from those two facts.

| Threat                                          | Mitigation                                                                                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A hostile page reads the API token              | The token lives only in the background context. Content scripts never receive it, and ESLint blocks the import path.                                                                                                   |
| A hostile page drives the extension             | Every action requires an explicit user gesture (menu, shortcut, button). Nothing is automatic.                                                                                                                         |
| Model output injected into the page             | Page translation writes to `Text.nodeValue`, which is never parsed as markup. No `innerHTML` anywhere on a model result. See ADR 0004.                                                                                 |
| Page CSS or JS breaking our UI (or the reverse) | All content-script UI is inside a Shadow DOM.                                                                                                                                                                          |
| Credential exfiltration by a dependency         | Single host permission (`api.infomaniak.com`), no remote code, no analytics SDK, and a dependency set small enough to read.                                                                                            |
| Token theft from disk                           | **Not mitigated.** Extension storage is not encrypted at rest; any process with access to the browser profile can read it. The options page states this. Users should scope the token to `ai-tools` and set an expiry. |
| Runaway credit spend                            | Per-task `max_tokens` caps, cancellable streams, and guidance to set a spending cap in the Manager.                                                                                                                    |

## Scope

In scope: this extension's code and its build/release pipeline.
Out of scope: the Infomaniak API itself (report those to Infomaniak), and the
behaviour of the language models.
