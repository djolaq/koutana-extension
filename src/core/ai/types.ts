/**
 * Wire types for the Infomaniak AI Tools API.
 *
 * The service exposes an OpenAI-compatible surface under
 *   https://api.infomaniak.com/2/ai/{product_id}/openai/v1
 * so these mirror the OpenAI shapes. Only the fields we actually use are typed;
 * unknown fields are tolerated on purpose (the upstream API may add more).
 */

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatChoiceDelta {
  index: number;
  delta: { role?: Role; content?: string };
  finish_reason: string | null;
}

export interface ChatChunk {
  id: string;
  model: string;
  choices: ChatChoiceDelta[];
  usage?: Usage;
}

export interface ChatCompletion {
  id: string;
  model: string;
  choices: Array<{ index: number; message: ChatMessage; finish_reason: string | null }>;
  usage?: Usage;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ModelInfo {
  id: string;
  object?: string;
  owned_by?: string;
}

export interface ModelListResponse {
  object?: string;
  data: ModelInfo[];
}

/** Normalised error surfaced to the UI. `code` drives the i18n message key. */
export type AiErrorCode =
  | 'no_credentials'
  | 'unauthorized' // 401 — bad or revoked token
  | 'forbidden' // 403 — token lacks the ai-tools scope, or wrong product
  | 'not_found' // 404 — wrong product_id or model
  | 'rate_limited' // 429
  | 'insufficient_credits'
  | 'server_error' // 5xx
  | 'network'
  | 'aborted'
  | 'unknown';

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: AiErrorCode, message: string, opts: { status?: number; detail?: string } = {}) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = opts.status;
    this.detail = opts.detail;
  }
}
