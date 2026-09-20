import type { AuthProvider } from '../auth/provider';
import { chatCompletionsUrl, modelsUrl } from './endpoints';
import { parseSseStream } from './sse';
import {
  AiError,
  type ChatChunk,
  type ChatCompletion,
  type ChatRequest,
  type ModelInfo,
  type ModelListResponse,
  type Usage,
} from './types';

/**
 * The only thing in the codebase that performs network I/O.
 *
 * It MUST be constructed and used from the background script:
 *   - extension pages and content scripts do not get the host_permissions
 *     CORS bypass that the background context does;
 *   - the credential never has to travel to a content script.
 */
export class InfomaniakAiClient {
  constructor(private readonly auth: AuthProvider) {}

  async listModels(signal?: AbortSignal): Promise<ModelInfo[]> {
    const { productId, headers } = await this.prepare();
    const res = await this.fetch(modelsUrl(productId), { method: 'GET', headers, signal });
    const body = (await res.json()) as ModelListResponse;
    return Array.isArray(body?.data) ? body.data : [];
  }

  /** Non-streaming completion. Used for short, one-shot tasks. */
  async chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatCompletion> {
    const { productId, headers } = await this.prepare();
    const res = await this.fetch(chatCompletionsUrl(productId), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: false }),
      signal,
    });
    return (await res.json()) as ChatCompletion;
  }

  /**
   * Streaming completion. Yields text deltas as they arrive so the UI can paint
   * progressively; the final `usage` (when the API returns one) is reported via
   * `onUsage` rather than being yielded as text.
   */
  async *chatStream(
    request: ChatRequest,
    opts: { signal?: AbortSignal; onUsage?: (usage: Usage) => void } = {},
  ): AsyncGenerator<string, void, void> {
    const { productId, headers } = await this.prepare();
    const res = await this.fetch(chatCompletionsUrl(productId), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ ...request, stream: true }),
      signal: opts.signal,
    });

    if (!res.body) throw new AiError('server_error', 'Empty response body');

    for await (const event of parseSseStream(res.body)) {
      if (event === '[DONE]') return;
      let chunk: ChatChunk;
      try {
        chunk = JSON.parse(event) as ChatChunk;
      } catch {
        continue; // keep-alive or malformed frame — ignore rather than fail the stream
      }
      if (chunk.usage && opts.onUsage) opts.onUsage(chunk.usage);
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  private async prepare(): Promise<{ productId: string; headers: Record<string, string> }> {
    const credentials = await this.auth.getCredentials();
    if (!credentials) {
      throw new AiError('no_credentials', 'No Infomaniak credentials configured');
    }
    return {
      productId: credentials.productId,
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    };
  }

  private async fetch(url: string, init: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (cause) {
      if ((cause as Error)?.name === 'AbortError') {
        throw new AiError('aborted', 'Request cancelled');
      }
      throw new AiError('network', 'Could not reach api.infomaniak.com', {
        detail: (cause as Error)?.message,
      });
    }
    if (!res.ok) throw await toAiError(res);
    return res;
  }
}

async function toAiError(res: Response): Promise<AiError> {
  const detail = await safeText(res);
  switch (res.status) {
    case 401:
      return new AiError('unauthorized', 'Token rejected', { status: 401, detail });
    case 403:
      return new AiError('forbidden', 'Token lacks access to this AI product', {
        status: 403,
        detail,
      });
    case 404:
      return new AiError('not_found', 'Unknown product or model', { status: 404, detail });
    case 402:
      return new AiError('insufficient_credits', 'Out of AI credits', { status: 402, detail });
    case 429:
      return new AiError('rate_limited', 'Rate limited', { status: 429, detail });
    default:
      if (res.status >= 500) {
        return new AiError('server_error', 'Infomaniak AI returned an error', {
          status: res.status,
          detail,
        });
      }
      return new AiError('unknown', `Unexpected status ${res.status}`, {
        status: res.status,
        detail,
      });
  }
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return undefined;
  }
}
