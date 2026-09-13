/**
 * Page → plain text, for summarisation and side-panel context.
 *
 * Deliberately simple and dependency-free: pick the densest plausible content
 * root, strip chrome, collapse whitespace, cap the length. If this proves too
 * naive on real sites, the replacement is Mozilla's Readability — that is a
 * contained swap because nothing outside this file knows how extraction works.
 */

const BLOCKED = 'script,style,noscript,iframe,svg,canvas,nav,header,footer,aside,form,button';
const CANDIDATES = ['article', 'main', '[role="main"]', '#content', '.post', '.article'];

export interface ExtractedPage {
  title: string;
  url: string;
  text: string;
  truncated: boolean;
}

export function extractPage(doc: Document = document, maxChars = 24_000): ExtractedPage {
  const root = pickRoot(doc);
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(BLOCKED).forEach((el) => el.remove());

  const raw = (clone.textContent ?? '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title: doc.title,
    url: doc.location?.href ?? '',
    text: raw.slice(0, maxChars),
    truncated: raw.length > maxChars,
  };
}

function pickRoot(doc: Document): HTMLElement {
  let best: HTMLElement = doc.body;
  let bestScore = score(doc.body);
  for (const selector of CANDIDATES) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const value = score(el);
      if (value > bestScore) {
        best = el;
        bestScore = value;
      }
    });
  }
  return best;
}

/** Text length weighted down by link density — nav-heavy blocks lose. */
function score(el: HTMLElement | null): number {
  if (!el) return 0;
  const text = el.textContent?.length ?? 0;
  const linkText = Array.from(el.querySelectorAll('a')).reduce(
    (sum, a) => sum + (a.textContent?.length ?? 0),
    0,
  );
  return text - linkText * 2;
}
