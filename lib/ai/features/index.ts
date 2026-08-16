import type { z } from "zod";
import { jobCopyInputSchema, generateJobCopy } from "@/lib/ai/features/job-copy";
import { rankInputSchema, rankApplication } from "@/lib/ai/features/rank";
import { interviewInputSchema, generateInterviewKit } from "@/lib/ai/features/interview";
import { messageDraftInputSchema, draftApplicationMessage } from "@/lib/ai/features/message-draft";
import { insightsInputSchema, generateHiringInsights } from "@/lib/ai/features/insights";
import {
  screeningQuestionsInputSchema,
  generateScreeningQuestions,
} from "@/lib/ai/features/screening-questions";
import { companyBrandInputSchema, generateCompanyBrandCopy } from "@/lib/ai/features/company-brand";
import { bulkShortlistInputSchema, generateBulkShortlist } from "@/lib/ai/features/bulk-shortlist";
import {
  resumeHighlightsInputSchema,
  generateResumeHighlights,
} from "@/lib/ai/features/resume-highlights";
import { jobTipsInputSchema, generateJobTips } from "@/lib/ai/features/job-tips";
import { spamFlagInputSchema, generateSpamFlag } from "@/lib/ai/features/spam-flag";

export type AiFeatureRoute = {
  inputSchema: z.ZodType<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (companyId: string, input: any) => Promise<unknown>;
};

/** One entry per Easy AI feature, keyed by the `[feature]` URL segment. */
export const AI_FEATURE_ROUTES: Record<string, AiFeatureRoute> = {
  "job-copy": { inputSchema: jobCopyInputSchema, run: generateJobCopy },
  rank: { inputSchema: rankInputSchema, run: rankApplication },
  interview: { inputSchema: interviewInputSchema, run: generateInterviewKit },
  "message-draft": { inputSchema: messageDraftInputSchema, run: draftApplicationMessage },
  insights: { inputSchema: insightsInputSchema, run: generateHiringInsights },
  "screening-questions": {
    inputSchema: screeningQuestionsInputSchema,
    run: generateScreeningQuestions,
  },
  "company-brand": { inputSchema: companyBrandInputSchema, run: generateCompanyBrandCopy },
  "bulk-shortlist": { inputSchema: bulkShortlistInputSchema, run: generateBulkShortlist },
  "resume-highlights": { inputSchema: resumeHighlightsInputSchema, run: generateResumeHighlights },
  "job-tips": { inputSchema: jobTipsInputSchema, run: generateJobTips },
  "spam-flag": { inputSchema: spamFlagInputSchema, run: generateSpamFlag },
};

export type AiFeatureKey = keyof typeof AI_FEATURE_ROUTES;
