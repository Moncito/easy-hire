import { generateObject, generateText } from "ai";
import type { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { getAiModel, isAiConfigured, AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/provider";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { logAiUsage, type AiFeature } from "@/lib/ai/usage";

export type AiObjectResult<T> = {
  configured: boolean;
  data: T | null;
  message?: string;
};

export type AiTextResult = {
  configured: boolean;
  text: string | null;
  message?: string;
};

async function assertNotRateLimited(companyId: string, feature: AiFeature) {
  const result = await checkAiRateLimit(companyId, feature);
  if (!result.allowed) {
    throw new ApiError(
      `Easy AI rate limit reached for this feature (max ${result.limit}/hour). Try again soon.`,
      429
    );
  }
}

/**
 * Shared structured-generation helper for every Easy AI feature: enforces
 * the per-company rate limit, falls back to a friendly "not configured"
 * result when no provider key is set (never throws for that case), and logs
 * usage on success. Callers still need their own Pro gate — see
 * `lib/ai/gates.ts` — this only handles generation plumbing.
 */
export async function generateAiObject<T>(input: {
  companyId: string;
  feature: AiFeature;
  schema: z.ZodType<T>;
  system?: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}): Promise<AiObjectResult<T>> {
  await assertNotRateLimited(input.companyId, input.feature);

  if (!isAiConfigured()) {
    return { configured: false, data: null, message: AI_NOT_CONFIGURED_MESSAGE };
  }

  const model = await getAiModel();
  if (!model) {
    return { configured: false, data: null, message: AI_NOT_CONFIGURED_MESSAGE };
  }

  try {
    const result = await generateObject({
      model,
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
    });

    await logAiUsage({
      companyId: input.companyId,
      feature: input.feature,
      tokens: result.usage?.totalTokens ?? null,
      metadata: input.metadata ?? null,
    });

    return { configured: true, data: result.object as T };
  } catch (error) {
    console.error(`[ai:${input.feature}] generateObject failed:`, error);
    throw new ApiError("Easy AI couldn't generate a result right now. Please try again.", 502);
  }
}

export async function generateAiText(input: {
  companyId: string;
  feature: AiFeature;
  system?: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}): Promise<AiTextResult> {
  await assertNotRateLimited(input.companyId, input.feature);

  if (!isAiConfigured()) {
    return { configured: false, text: null, message: AI_NOT_CONFIGURED_MESSAGE };
  }

  const model = await getAiModel();
  if (!model) {
    return { configured: false, text: null, message: AI_NOT_CONFIGURED_MESSAGE };
  }

  try {
    const result = await generateText({
      model,
      system: input.system,
      prompt: input.prompt,
    });

    await logAiUsage({
      companyId: input.companyId,
      feature: input.feature,
      tokens: result.usage?.totalTokens ?? null,
      metadata: input.metadata ?? null,
    });

    return { configured: true, text: result.text };
  } catch (error) {
    console.error(`[ai:${input.feature}] generateText failed:`, error);
    throw new ApiError("Easy AI couldn't generate a result right now. Please try again.", 502);
  }
}
