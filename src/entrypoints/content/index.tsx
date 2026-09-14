import { browser, createShadowRootUi, defineContentScript } from '#imports';
import { createRoot, type Root } from 'react-dom/client';
import { stream } from '../../core/messaging/client';
import { t, tDynamic } from '../../core/i18n/t';
import { extractPage } from '../../core/page/extract';
import {
  applyTranslation,
  batchSegments,
  collectSegments,
  decodeBatch,
  encodeBatch,
  restore,
  type Segment,
} from '../../core/page/segments';
import { settingsStore } from '../../core/settings/store';
import { Overlay, type OverlayState } from './Overlay';
import '../../ui/theme.css';

/**
 * The content script owns the page DOM and nothing else. It never holds a
 * credential and never calls the network: every generation goes through a port
 * to the background script.
 *
 * All of our own UI lives in a Shadow DOM (`createShadowRootUi`) so the host
 * page's CSS cannot break us and our Tailwind reset cannot break the host page.
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    const settings = await settingsStore.get();
    if (isBlocked(location.hostname, settings.blockedHosts)) return;

    let render: ((state: OverlayState) => void) | null = null;
    let root: Root | null = null;
    let pageSegments: Segment[] = [];

    const ui = await createShadowRootUi(ctx, {
      name: 'pagelingua-overlay',
      position: 'overlay',
      anchor: 'body',
      onMount(container) {
        container.setAttribute('data-pagelingua-ui', '');
        root = createRoot(container);
        const update = (state: OverlayState) =>
          root?.render(<Overlay state={state} onClose={() => update({ kind: 'idle' })} />);
        render = update;
        update({ kind: 'idle' });
      },
      onRemove() {
        root?.unmount();
        root = null;
        render = null;
      },
    });
    ui.mount();

    browser.runtime.onMessage.addListener((message: { type: string; text?: string }) => {
      switch (message.type) {
        case 'overlay/translateSelection':
          void translateSelection(window.getSelection()?.toString() ?? '');
          return;
        case 'overlay/translate':
          void translateSelection(message.text ?? '');
          return;
        case 'overlay/translatePage':
          void translatePage();
          return;
        case 'page/extract':
          return Promise.resolve(extractPage());
      }
    });

    function translateSelection(text: string) {
      if (!text.trim()) {
        render?.({ kind: 'error', message: t('errorNoSelection') });
        return;
      }
      let output = '';
      render?.({ kind: 'result', title: t('translating'), body: '', busy: true });
      const handle = stream({ kind: 'translate', text }, (event) => {
        if (event.kind === 'delta') {
          output += event.text;
          render?.({ kind: 'result', title: t('translation'), body: output, busy: true });
        }
        if (event.kind === 'done') {
          render?.({ kind: 'result', title: t('translation'), body: output, busy: false });
        }
        if (event.kind === 'error') {
          render?.({ kind: 'error', message: tDynamic(`error_${event.code}`, 'error_unknown') });
        }
      });
      ctx.onInvalidated(() => handle.cancel());
    }

    async function translatePage() {
      if (pageSegments.length > 0) {
        restore(pageSegments);
        pageSegments = [];
        render?.({ kind: 'idle' });
        return;
      }
      pageSegments = collectSegments();
      const batches = batchSegments(pageSegments);
      let done = 0;

      for (const batch of batches) {
        render?.({
          kind: 'progress',
          title: t('translatingPage'),
          done,
          total: batches.length,
        });
        const reply = await once({ kind: 'translate', text: encodeBatch(batch) });
        if (reply === null) break;
        applyTranslation(batch, decodeBatch(reply, batch));
        done += 1;
      }
      render?.({ kind: 'toast', message: t('pageTranslated') });
    }

    /** Collects a whole stream into a single string. Returns null on error. */
    function once(request: Parameters<typeof stream>[0]): Promise<string | null> {
      return new Promise((resolve) => {
        let buffer = '';
        const handle = stream(request, (event) => {
          if (event.kind === 'delta') buffer += event.text;
          if (event.kind === 'done') resolve(buffer);
          if (event.kind === 'error') {
            render?.({ kind: 'error', message: tDynamic(`error_${event.code}`, 'error_unknown') });
            resolve(null);
          }
        });
        ctx.onInvalidated(() => {
          handle.cancel();
          resolve(null);
        });
      });
    }
  },
});

function isBlocked(hostname: string, blocked: string[]): boolean {
  return blocked.some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));
}
