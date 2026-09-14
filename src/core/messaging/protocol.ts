import type { AuthStatus } from '../auth/provider';
import type { AiErrorCode, ModelInfo } from '../ai/types';
import type { Settings } from '../settings/schema';
import type { RewriteAction } from '../tasks/registry';

/**
 * The contract between contexts (content script / popup / side panel → background).
 *
 * Two channels, on purpose:
 *   - `Request`/`Response`: one-shot, `browser.runtime.sendMessage`.
 *   - `StreamRequest` + `StreamEvent`: long-lived, `browser.runtime.connect`,
 *     because MV3 message passing cannot stream and a long generation must be
 *     cancellable and must not be lost when a service worker naps.
 *
 * Adding a case here is a breaking change: update `background.ts` handlers and
 * `tests/protocol.test.ts` in the same commit.
 */

export type Request =
  | { type: 'auth/status' }
  | { type: 'auth/connectToken'; apiToken: string; productId: string }
  | { type: 'auth/disconnect' }
  | { type: 'models/list'; refresh?: boolean }
  | { type: 'settings/get' }
  | { type: 'settings/patch'; patch: Partial<Settings> }
  | { type: 'page/extract'; tabId: number }
  | { type: 'sidepanel/open'; tabId: number };

export type Response =
  | { ok: true; type: 'auth/status'; status: AuthStatus }
  | { ok: true; type: 'models/list'; models: ModelInfo[] }
  | { ok: true; type: 'settings'; settings: Settings }
  | { ok: true; type: 'page/extract'; title: string; url: string; text: string }
  | { ok: true; type: 'void' }
  | { ok: false; code: AiErrorCode; message: string };

export const STREAM_PORT = 'pagelingua/stream';

export type StreamRequest =
  | { kind: 'translate'; text: string }
  | { kind: 'rewrite'; text: string; action: RewriteAction }
  | { kind: 'summarize'; text: string; title?: string; url?: string }
  | {
      kind: 'chat';
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
      pageText?: string;
      title?: string;
      url?: string;
    };

export type StreamEvent =
  | { kind: 'delta'; text: string }
  | { kind: 'usage'; totalTokens?: number }
  | { kind: 'done' }
  | { kind: 'error'; code: AiErrorCode; message: string };
