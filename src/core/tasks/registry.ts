import type { ChatMessage } from '../ai/types';
import type { ModelRouting, ToneId } from '../settings/schema';

/**
 * A task is the only place a prompt is ever written.
 *
 * Entrypoints never build prompts: they pick a task id and pass an input. This
 * keeps prompt-tuning reviewable in one folder and makes every behaviour
 * testable without a browser (see tests/tasks.test.ts).
 */

export type TaskTier = keyof ModelRouting; // 'quick' | 'standard' | 'deep'

export interface TaskContext {
  /** BCP-47 tag, already resolved (never 'auto'). */
  targetLanguage: string;
  tone: ToneId;
  /** Page title / URL, when the caller has them and the task uses them. */
  pageTitle?: string;
  pageUrl?: string;
}

export interface TaskDefinition<Input> {
  id: string;
  tier: TaskTier;
  temperature: number;
  /** Hard cap so a runaway model cannot burn credits. */
  maxTokens: number;
  build(input: Input, ctx: TaskContext): ChatMessage[];
}

const OUTPUT_RULES = [
  'Return only the requested output.',
  'Do not add explanations, preambles, apologies or markdown code fences.',
  'Preserve the original formatting, line breaks, lists and inline markup.',
].join(' ');

export const translateTask: TaskDefinition<{ text: string }> = {
  id: 'translate',
  tier: 'standard',
  temperature: 0.2,
  maxTokens: 2048,
  build({ text }, ctx) {
    return [
      {
        role: 'system',
        content:
          `You are a professional translator. Translate the user's text into ${ctx.targetLanguage}. ` +
          `Keep names, code, URLs and numbers untouched. If the text is already in ${ctx.targetLanguage}, return it unchanged. ` +
          OUTPUT_RULES,
      },
      { role: 'user', content: text },
    ];
  },
};

export type RewriteAction = 'improve' | 'shorten' | 'expand' | 'fix' | 'tone';

export const rewriteTask: TaskDefinition<{ text: string; action: RewriteAction }> = {
  id: 'rewrite',
  tier: 'quick',
  temperature: 0.4,
  maxTokens: 1024,
  build({ text, action }, ctx) {
    const instruction: Record<RewriteAction, string> = {
      improve: 'Rewrite the text so it reads better, without changing its meaning or its language.',
      shorten: 'Make the text significantly shorter while keeping every essential point.',
      expand: 'Develop the text with useful detail, staying on topic.',
      fix: 'Correct spelling, grammar and punctuation. Change nothing else.',
      tone: `Rewrite the text in a ${ctx.tone} tone, keeping its language and meaning.`,
    };
    return [
      { role: 'system', content: `${instruction[action]} ${OUTPUT_RULES}` },
      { role: 'user', content: text },
    ];
  },
};

export const summarizeTask: TaskDefinition<{ text: string }> = {
  id: 'summarize',
  tier: 'standard',
  temperature: 0.3,
  maxTokens: 1024,
  build({ text }, ctx) {
    return [
      {
        role: 'system',
        content:
          `Summarise the page below in ${ctx.targetLanguage}: three to six bullet points, each one line, ` +
          `followed by a single "So what?" sentence. ` +
          OUTPUT_RULES,
      },
      {
        role: 'user',
        content: ctx.pageTitle ? `# ${ctx.pageTitle}\n\n${text}` : text,
      },
    ];
  },
};

export const chatTask: TaskDefinition<{ history: ChatMessage[]; pageText?: string }> = {
  id: 'chat',
  tier: 'deep',
  temperature: 0.7,
  maxTokens: 4096,
  build({ history, pageText }, ctx) {
    const system: ChatMessage = {
      role: 'system',
      content:
        `You are Kounata, a browsing assistant running on Infomaniak AI. Answer in ${ctx.targetLanguage} ` +
        `unless the user writes in another language, in which case match theirs. Be concise and concrete. ` +
        `If the answer is not supported by the page context, say so instead of guessing.`,
    };
    if (!pageText) return [system, ...history];
    return [
      system,
      {
        role: 'system',
        content: `Page context — ${ctx.pageTitle ?? 'untitled'} (${ctx.pageUrl ?? 'unknown URL'}):\n\n${pageText}`,
      },
      ...history,
    ];
  },
};

export const TASKS = {
  translate: translateTask,
  rewrite: rewriteTask,
  summarize: summarizeTask,
  chat: chatTask,
} as const;

export type TaskId = keyof typeof TASKS;
