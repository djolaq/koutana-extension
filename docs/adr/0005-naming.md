# ADR 0005 — The product is called PageLingua

Date: 2026-09-14 · Status: accepted · Supersedes the working name "Sova"

## Context

The name has to do four things at once:

1. **Say what the extension does** on sight, in a store listing full of competitors.
2. **Carry no Infomaniak trademark.** The extension runs on the user's Infomaniak
   account, but it is an independent project. Putting "Infomaniak" in the product
   name is trademark use, and both stores reject names that imply an affiliation
   that does not exist. Nominative use in the description is fine and is what we do.
3. **Work in every locale we ship.** The UI follows the browser language across
   English, French, German, Spanish and Italian.
4. **Have a domain that is actually free**, so the listing, the docs and the
   support address can share one name.

## Decision

**PageLingua.** *Page* is the object the extension acts on; *lingua* reads as
language in English, French, Italian, Spanish and Portuguese without translation,
and is transparent enough in German. Together they say "languages, on pages"
before the reader gets to the tagline.

Tagline: *Translate, rewrite and ask questions about any page — on your own AI account.*

It is suggestive rather than generic, so it is registrable as a mark, unlike
"Page Translator".

## Verification, 2026-09-14

Availability was checked against the **registries' own RDAP services** — the
protocol that replaced port-43 whois, and the authoritative source for each TLD:

| Domain | RDAP server | Result |
| --- | --- | --- |
| `pagelingua.com` | `rdap.verisign.com` (.com registry) | HTTP 404 — **free** |
| `pagelingua.app` | `www.registry.google` (.app registry) | HTTP 404 — **free** |
| `pagelingua.fr` | `rdap.nic.fr` (AFNIC) | HTTP 404 — **free** |

Under RFC 7480 a 404 from a registry's RDAP service means the registry holds no
object for that name, which is the same answer a whois "No match" gives.

Web search found no product, company or browser extension using the name.

Rejected along the way, all registered at the time of checking: `pagelingo.com`,
`lingopage.com`, `lingoside.com`, `pagefluent.com`, `fluentpage.com`,
`lingualens.com`, `lingoscope.com`, `translateanywhere.com`, `sidepage.com`,
`linguapage.com`, `openlingua.com`, `askthispage.com`.

Also free but rejected on merit: `pagelinguist.com` and `browserlinguist.com`
(clear but stiff, and long in a store title); `pagepolyglot.com` (the Chrome Web
Store already carries several extensions named *Polyglot* — a crowded field is a
discoverability problem before it is a legal one); `readwriteask.com`
(uncomfortably close to Texthelp's **Read&Write**, itself a browser extension).

## What is NOT verified

**Trademark registers were not searched.** Domain availability and an absence of
search results are not a trademark clearance. Before any paid branding, before the
first store listing, search EUIPO (EU), INPI (France) and USPTO (US) for
*PageLingua* and for *Lingua* in class 9 / class 42, or have a professional do it.
Tracked as an issue.

## Consequences

- Package `pagelingua-extension`, Firefox gecko id `pagelingua@laqua.fr`, design
  token prefix `--pl-`, stream port `pagelingua/stream`, Shadow DOM host
  `pagelingua-overlay`.
- **The gecko id is frozen at the first AMO submission** — changing it afterwards
  orphans every existing install. Rename now or never.
- The icon changed with the name: the owl belonged to "Sova". The mark is now two
  offset pages — the same page in another language — which stays legible at 16 px.
- Register the three domains before announcing anything anywhere.
