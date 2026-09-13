/**
 * Every URL the extension is allowed to build lives here.
 *
 * Verified against Infomaniak's developer portal routes:
 *   POST /2/ai/{product_id}/openai/v1/chat/completions
 *   GET  /2/ai/{product_id}/openai/v1/models
 * The v1 equivalents (/1/ai/{product_id}/openai/...) are marked deprecated
 * upstream and are intentionally not used here.
 */

export const API_ORIGIN = 'https://api.infomaniak.com';

/** OpenAI-compatible base for a given AI Tools product. */
export function openAiBase(productId: string): string {
  return `${API_ORIGIN}/2/ai/${encodeURIComponent(productId)}/openai/v1`;
}

export function chatCompletionsUrl(productId: string): string {
  return `${openAiBase(productId)}/chat/completions`;
}

export function modelsUrl(productId: string): string {
  return `${openAiBase(productId)}/models`;
}

/** Manager deep links used in onboarding copy. */
export const MANAGER_LINKS = {
  aiTools: 'https://manager.infomaniak.com/v3/ng/products/cloud/ai-tools',
  apiTokens: 'https://manager.infomaniak.com/v3/ng/profile/user/token/list',
  oauthApps: 'https://manager.infomaniak.com/v3/ng/profile/user/applications/list',
} as const;
