import { browser } from '#imports';

/**
 * The content script is not declared in the manifest: a static `<all_urls>`
 * content script silently turns `<all_urls>` into a required install-time
 * permission. Instead it is injected into a tab only when the user acts on it
 * (popup click, context menu, shortcut), which `activeTab` covers, or on a tab
 * the user has granted through the optional `<all_urls>` permission.
 */

/** Messages the content script answers. */
export type TabMessage =
  | { type: 'content/ping' }
  | { type: 'overlay/translate'; text: string }
  | { type: 'overlay/translateSelection' }
  | { type: 'overlay/translatePage' }
  | { type: 'page/extract' };

export const CONTENT_PONG = 'kounata/pong';

const CONTENT_SCRIPT = '/content-scripts/content.js';

/** Injects the content script if needed, then delivers `message` to it. */
export async function sendToTab<T = unknown>(tabId: number, message: TabMessage): Promise<T> {
  await ensureContentScript(tabId);
  return (await browser.tabs.sendMessage(tabId, message)) as T;
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    if ((await browser.tabs.sendMessage(tabId, { type: 'content/ping' })) === CONTENT_PONG) return;
  } catch {
    /* nothing listening yet */
  }
  // Throws when we have no access to the tab (no gesture, store page, about:…).
  await browser.scripting.executeScript({ target: { tabId }, files: [CONTENT_SCRIPT] });
}

export const ALL_URLS = { origins: ['<all_urls>'] };
