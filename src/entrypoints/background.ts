import { browser, defineBackground } from '#imports';
import { InfomaniakAiClient } from '../core/ai/client';
import { AiError, type ModelInfo } from '../core/ai/types';
import { TokenAuthProvider } from '../core/auth/token-provider';
import {
  STREAM_PORT,
  type Request,
  type Response,
  type StreamEvent,
  type StreamRequest,
} from '../core/messaging/protocol';
import { sendToTab } from '../core/messaging/tab';
import { resolveLanguage } from '../core/i18n/languages';
import { t } from '../core/i18n/t';
import { settingsStore } from '../core/settings/store';
import { TASKS, type TaskTier } from '../core/tasks/registry';

/**
 * The background script is the extension's only privileged context:
 *   - it holds the credential,
 *   - it is the only place that calls api.infomaniak.com,
 *   - it owns the context menus and commands.
 * It contains no prompt text and no DOM logic. Keep it that way.
 */
export default defineBackground(() => {
  const auth = new TokenAuthProvider();
  const ai = new InfomaniakAiClient(auth);

  let modelCache: { at: number; models: ModelInfo[] } | null = null;
  const MODEL_TTL = 6 * 60 * 60 * 1000; // 6 h

  // ---------------------------------------------------------------- menus ---
  browser.runtime.onInstalled.addListener(async () => {
    await browser.contextMenus.removeAll();
    browser.contextMenus.create({
      id: 'kounata.translateSelection',
      title: t('ctxTranslateSelection'),
      contexts: ['selection'],
    });
    browser.contextMenus.create({
      id: 'kounata.summarizePage',
      title: t('ctxSummarizePage'),
      contexts: ['page'],
    });
    browser.contextMenus.create({
      id: 'kounata.askAboutPage',
      title: t('ctxAskAboutPage'),
      contexts: ['page', 'selection'],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;
    switch (info.menuItemId) {
      case 'kounata.translateSelection':
        await sendToTab(tab.id, { type: 'overlay/translate', text: info.selectionText ?? '' });
        break;
      case 'kounata.summarizePage':
      case 'kounata.askAboutPage':
        await openSidePanel(tab.id);
        break;
    }
  });

  browser.commands?.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    if (command === 'open-side-panel') await openSidePanel(tab.id);
    if (command === 'translate-selection') {
      await sendToTab(tab.id, { type: 'overlay/translateSelection' });
    }
  });

  // ------------------------------------------------------------ one-shots ---
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handle(message as Request)
      .then(sendResponse)
      .catch((error: unknown) => sendResponse(toErrorResponse(error)));
    return true; // keep the channel open for the async reply
  });

  async function handle(request: Request): Promise<Response> {
    switch (request.type) {
      case 'auth/status':
        return { ok: true, type: 'auth/status', status: await auth.getStatus() };

      case 'auth/connectToken': {
        await auth.setCredentials({
          accessToken: request.apiToken,
          productId: request.productId,
        });
        // Validate immediately so the user gets a real answer, not a silent save.
        await ai.listModels();
        modelCache = null;
        return { ok: true, type: 'auth/status', status: await auth.getStatus() };
      }

      case 'auth/disconnect':
        await auth.disconnect();
        modelCache = null;
        return { ok: true, type: 'void' };

      case 'models/list': {
        const cached = modelCache;
        const fresh = cached !== null && Date.now() - cached.at < MODEL_TTL;
        if (fresh && !request.refresh) {
          return { ok: true, type: 'models/list', models: cached.models };
        }
        const models = await ai.listModels();
        modelCache = { at: Date.now(), models };
        await adoptDefaultModels(models);
        return { ok: true, type: 'models/list', models };
      }

      case 'settings/get':
        return { ok: true, type: 'settings', settings: await settingsStore.get() };

      case 'settings/patch':
        return { ok: true, type: 'settings', settings: await settingsStore.patch(request.patch) };

      case 'sidepanel/open':
        await openSidePanel(request.tabId);
        return { ok: true, type: 'void' };

      default:
        return { ok: false, code: 'unknown', message: 'Unsupported request' };
    }
  }

  // -------------------------------------------------------------- streams ---
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== STREAM_PORT) return;
    const controller = new AbortController();
    port.onDisconnect.addListener(() => controller.abort());

    port.onMessage.addListener(async (message) => {
      const post = (event: StreamEvent) => {
        try {
          port.postMessage(event);
        } catch {
          /* port closed by the other side */
        }
      };
      try {
        await run(message as StreamRequest, post, controller.signal);
        post({ kind: 'done' });
      } catch (error) {
        const { code, message: text } = describe(error);
        post({ kind: 'error', code, message: text });
      } finally {
        port.disconnect();
      }
    });
  });

  async function run(
    request: StreamRequest,
    post: (event: StreamEvent) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const settings = await settingsStore.get();
    const ctx = {
      targetLanguage: resolveLanguage(settings.targetLanguage),
      tone: settings.defaultTone,
      pageTitle: 'title' in request ? request.title : undefined,
      pageUrl: 'url' in request ? request.url : undefined,
    };

    const { messages, tier, temperature, maxTokens } = buildRequest(request, ctx);
    const model = await pickModel(tier);

    for await (const delta of ai.chatStream(
      { model, messages, temperature, max_tokens: maxTokens },
      { signal, onUsage: (usage) => post({ kind: 'usage', totalTokens: usage.total_tokens }) },
    )) {
      post({ kind: 'delta', text: delta });
    }
  }

  function buildRequest(request: StreamRequest, ctx: Parameters<typeof TASKS.translate.build>[1]) {
    switch (request.kind) {
      case 'translate':
        return withTask(TASKS.translate, { text: request.text }, ctx);
      case 'rewrite':
        return withTask(TASKS.rewrite, { text: request.text, action: request.action }, ctx);
      case 'summarize':
        return withTask(TASKS.summarize, { text: request.text }, ctx);
      case 'chat':
        return withTask(TASKS.chat, { history: request.history, pageText: request.pageText }, ctx);
    }
  }

  async function pickModel(tier: TaskTier): Promise<string> {
    const settings = await settingsStore.get();
    const chosen = settings.models[tier];
    if (chosen) return chosen;
    const models = modelCache?.models ?? (await ai.listModels());
    modelCache = { at: Date.now(), models };
    const first = models[0]?.id;
    if (!first) throw new AiError('not_found', 'No model available on this AI product');
    await adoptDefaultModels(models);
    return first;
  }

  /** First successful listing seeds the three tiers so nothing is ever empty. */
  async function adoptDefaultModels(models: ModelInfo[]): Promise<void> {
    if (models.length === 0) return;
    const settings = await settingsStore.get();
    if (settings.models.quick && settings.models.standard && settings.models.deep) return;
    const ids = models.map((m) => m.id);
    await settingsStore.patch({
      models: {
        quick: settings.models.quick || ids[0],
        standard: settings.models.standard || ids[Math.min(1, ids.length - 1)] || ids[0],
        deep: settings.models.deep || ids[ids.length - 1],
      },
    });
  }

  async function openSidePanel(tabId: number): Promise<void> {
    // Chrome: sidePanel. Firefox: sidebarAction. WXT exposes both; we feature-detect.
    const chromeSidePanel = (
      browser as unknown as { sidePanel?: { open(o: { tabId: number }): Promise<void> } }
    ).sidePanel;
    if (chromeSidePanel) {
      await chromeSidePanel.open({ tabId });
      return;
    }
    const firefoxSidebar = (browser as unknown as { sidebarAction?: { open(): Promise<void> } })
      .sidebarAction;
    await firefoxSidebar?.open();
  }
});

function describe(error: unknown): { code: StreamEventErrorCode; message: string } {
  if (error instanceof AiError) return { code: error.code, message: error.message };
  return { code: 'unknown', message: (error as Error)?.message ?? 'Unexpected error' };
}

type StreamEventErrorCode = Extract<StreamEvent, { kind: 'error' }>['code'];

function toErrorResponse(error: unknown): Response {
  const { code, message } = describe(error);
  return { ok: false, code, message };
}

function withTask<I>(
  task: (typeof TASKS)[keyof typeof TASKS],
  input: I,
  ctx: Parameters<typeof TASKS.translate.build>[1],
) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (task.build as any)(input, ctx),
    tier: task.tier,
    temperature: task.temperature,
    maxTokens: task.maxTokens,
  };
}
