"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import type { AiFeatureKey } from "@/lib/ai/features";

/** Mirrors `AiObjectResult<T>` from `lib/ai/run.ts` — kept local since that
 * module also pulls in server-only AI SDK code we don't want in the client bundle. */
export type EasyAiResult<T> = {
  configured: boolean;
  data: T | null;
  message?: string;
};

type RunOptions = {
  /** Suppress toasts entirely — for background/on-mount calls where a
   * failure should just fall back to static copy instead of interrupting. */
  silent?: boolean;
};

/**
 * POSTs one Easy AI feature and normalizes the result. Every Easy AI route
 * lives at `/api/employer/ai/[feature]` and is Employer Pro gated server
 * side — callers are still expected to check `useEmployerShell().isPro`
 * before rendering the trigger, this only handles the request itself.
 */
export async function callEasyAi<T = unknown>(
  feature: AiFeatureKey | string,
  body: unknown,
  options: RunOptions = {}
): Promise<EasyAiResult<T> | null> {
  const result = await fetchJsonSafe<EasyAiResult<T>>(`/api/employer/ai/${feature}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!result.ok) {
    if (!options.silent) {
      toast.error(result.error || "Easy AI couldn't complete that request.");
    } else {
      console.error(`[easy-ai:${feature}]`, result.error);
    }
    return null;
  }

  if (result.data.configured === false && !options.silent) {
    toast.error(result.data.message || "Easy AI isn't configured yet.");
  }

  return result.data;
}

/**
 * Hook form of `callEasyAi` with per-feature loading state, so a page can
 * have several Easy AI triggers (e.g. rank + draft on one candidate) without
 * a shared boolean disabling every button at once.
 */
export function useEasyAi() {
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);

  const run = useCallback(
    async <T = unknown,>(
      feature: AiFeatureKey | string,
      body: unknown,
      options?: RunOptions
    ): Promise<EasyAiResult<T> | null> => {
      setLoadingFeature(feature);
      try {
        return await callEasyAi<T>(feature, body, options);
      } finally {
        setLoadingFeature((current) => (current === feature ? null : current));
      }
    },
    []
  );

  const isLoading = useCallback((feature: string) => loadingFeature === feature, [loadingFeature]);

  return { run, loadingFeature, isLoading };
}
