# ADR 0004 — Translate text nodes, never HTML

Date: 2026-09-13 · Status: accepted

## Context

To translate a page you can either (a) send the HTML and swap in what comes back,
or (b) send the bare strings and put them back where they came from.

(a) is tempting: it preserves inline markup for free and takes one request. It is
also how page translators break. A model asked to return HTML will sometimes drop
an attribute, close a tag in the wrong place, or return prose around the markup —
and whatever it returns is injected into a live document. That is both a layout
bug and an injection surface: page content is untrusted input, and model output
derived from it is untrusted too.

## Decision

Walk text nodes with a `TreeWalker`, skipping `script`, `style`, `code`, `pre`,
editable regions and our own UI. Batch ~3 kB of text per request as a numbered
list; parse the reply back by index; assign to `node.nodeValue`.

Consequences of assigning `nodeValue`: the value is text, never parsed as markup,
so no output of the model can create an element. Missing or empty lines keep the
original. The original strings are retained in memory, so `restore()` is instant.

## Consequences

- Inline markup inside a sentence (`<em>`, links) splits the sentence into several
  nodes, which costs some translation quality. Accepted: correctness and safety
  beat the last few percent of fluency. A future improvement is to reassemble
  inline runs with placeholder markers — and that can be done without changing the
  safety property.
- Dynamic pages need a `MutationObserver` to catch content added after the pass.
  Tracked in M5.
