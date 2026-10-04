# ADR 0005 — The product is called Kounata

Date: 2026-09-14 · Status: accepted · Supersedes the working names "Sova" and "PageLingua"

## Context

The name had to clear four bars: carry no Infomaniak trademark (the extension runs
on the user's Infomaniak account but is an independent project, and both stores
reject names implying an affiliation that does not exist); work across the five
locales we ship; be distinctive enough to register as a mark; and come with a
domain that is genuinely available.

Two earlier directions were dropped. "Sova" said nothing about the product.
Descriptive compounds in the language/AI/tool space — `pagelingo`, `lingoside`,
`aidkit`, `toolbuddy`, `aitoolbelt`, `aidmate`, `handyaid` and some twenty others —
are a exhausted market in `.com`: nearly all were registered between 1997 and 2025
or now sit with resellers. What survived (`assistbench`, `aidbench`, `assistbelt`)
was available but flat.

## Decision

**Kounata**, on `kounata.com`. Chosen by the project owner.

It is a coined word with no meaning in any of our target languages. That is a
deliberate trade: maximum distinctiveness and availability, zero built-in
description.

## Verification, 2026-09-14

Checked against the registries' own RDAP services — the protocol that replaced
port-43 whois, and the authoritative source for each TLD. Under RFC 7480 a 404
from a registry's RDAP service means the registry holds no object for that name,
which is what a whois "No match" reports.

| Domain | RDAP server | Result |
| --- | --- | --- |
| `kounata.com` | `rdap.verisign.com` (.com registry) | HTTP 404 — **free** |
| `kounata.fr` | `rdap.nic.fr` (AFNIC) | HTTP 404 — **free** |

Web search found no company, product or extension named Kounata.

**One adjacency worth knowing:** *Kounta* — one letter shorter — is an Australian
point-of-sale product acquired by Lightspeed. Different sector, different goods and
services, so not a conflict in trademark terms, but expect search engines to
suggest "Kounta" for a while. Worth accounting for in the store listing copy and in
whatever landing page goes on `kounata.com`.

## What is NOT verified

**Trademark registers were not searched.** Domain availability and an empty search
result are not a clearance. Before paid branding and before the first store
listing, search EUIPO (EU), INPI (France) and USPTO (US) for *Kounata* and for
*Kounta* in class 9 and class 42, or have a professional do it. Tracked as an issue.

## Consequences

- Package `kounata-extension`, Firefox gecko id `kounata@laqua.fr`, design token
  prefix `--kn-`, stream port `kounata/stream`, Shadow DOM host `kounata-overlay`.
- **The gecko id freezes at the first AMO submission** — changing it afterwards
  orphans every existing Firefox install. This is the last free moment to rename.
- **A coined name explains nothing, so everything else has to.** The store title,
  the one-line description, the first screenshot and the icon now carry the whole
  burden of telling a stranger what this does. Treat the subtitle
  — *Translate, rewrite and ask questions about any page, on your own AI account* —
  as part of the product, not as marketing filler, and keep it in every locale.
  Store search also works on the description, so the feature words (translate,
  rewrite, summarise) must appear there; the name contributes nothing to
  discoverability.
- Register `kounata.com` and `kounata.fr` before the repository goes public.
