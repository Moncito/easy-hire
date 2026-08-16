import type { LanguageModel } from "ai";

/**
 * Resolves the Easy AI language model from whichever provider key is
 * configured. OpenAI is preferred when both are set. When neither key is
 * present, `getAiModel()` returns null and every feature module falls back
 * to a structured "AI not configured" response instead of throwing —
 * Easy AI should degrade gracefully, never break the employer workspace.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const OPENAI_MODEL = process.env.EASY_AI_OPENAI_MODEL ?? "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.EASY_AI_ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";

export type AiProviderName = "openai" | "anthropic" | null;

export function getAiProviderName(): AiProviderName {
  if (OPENAI_API_KEY) return "openai";
  if (ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function isAiConfigured(): boolean {
  return getAiProviderName() !== null;
}

let cachedModel: LanguageModel | null | undefined;

/** Lazily constructs and caches the provider SDK client — avoids the cost when AI is unused. */
export async function getAiModel(): Promise<LanguageModel | null> {
  if (cachedModel !== undefined) return cachedModel;

  const provider = getAiProviderName();

  if (provider === "openai") {
    const { openai } = await import("@ai-sdk/openai");
    cachedModel = openai(OPENAI_MODEL);
  } else if (provider === "anthropic") {
    const { anthropic } = await import("@ai-sdk/anthropic");
    cachedModel = anthropic(ANTHROPIC_MODEL);
  } else {
    cachedModel = null;
  }

  return cachedModel;
}

export const AI_NOT_CONFIGURED_MESSAGE =
  "Easy AI isn't configured yet. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to enable it.";
