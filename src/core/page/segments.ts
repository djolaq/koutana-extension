/**
 * In-place page translation.
 *
 * Strategy: translate text NODES, not innerHTML. Sending markup to a model and
 * trusting it to give valid markup back is how page translators break layouts
 * and open injection holes. Here the DOM structure never leaves the browser —
 * only bare strings do — and restoring the original is a one-liner.
 */

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
  'TEXTAREA',
  'SVG',
  'MATH',
]);

export interface Segment {
  node: Text;
  original: string;
}

/** Collects visible, translatable text nodes in document order. */
export function collectSegments(root: Node = document.body, minLength = 2): Segment[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue?.trim() ?? '';
      if (text.length < minLength) return NodeFilter.FILTER_REJECT;
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-kounata-ui]')) return NodeFilter.FILTER_REJECT;
      if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const segments: Segment[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    segments.push({ node: current as Text, original: current.nodeValue ?? '' });
  }
  return segments;
}

/**
 * Groups segments into request-sized batches. Each batch is sent as a numbered
 * list and comes back as a numbered list, which is far cheaper than one request
 * per node and keeps the mapping explicit.
 */
export function batchSegments(segments: Segment[], maxChars = 3000): Segment[][] {
  const batches: Segment[][] = [];
  let batch: Segment[] = [];
  let size = 0;
  for (const segment of segments) {
    const length = segment.original.length;
    if (batch.length > 0 && size + length > maxChars) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(segment);
    size += length;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

export function encodeBatch(batch: Segment[]): string {
  return batch.map((s, i) => `${i + 1}. ${s.original.trim()}`).join('\n');
}

/** Parses the numbered list back. Missing lines leave the original in place. */
export function decodeBatch(reply: string, batch: Segment[]): string[] {
  const out = batch.map((s) => s.original);
  for (const line of reply.split('\n')) {
    const match = /^\s*(\d+)\.\s?(.*)$/.exec(line);
    if (!match) continue;
    const index = Number(match[1]) - 1;
    if (index >= 0 && index < out.length && match[2].trim()) out[index] = match[2];
  }
  return out;
}

export function applyTranslation(batch: Segment[], translations: string[]): void {
  batch.forEach((segment, i) => {
    const value = translations[i];
    if (value && value !== segment.original) segment.node.nodeValue = value;
  });
}

export function restore(segments: Segment[]): void {
  for (const segment of segments) segment.node.nodeValue = segment.original;
}
