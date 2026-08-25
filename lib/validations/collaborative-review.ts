import { z } from "zod";

export const collaborativeScorecardSchema = z.object({
  scores: z.array(z.object({ criterionId: z.string().min(1), score: z.number().int().min(1).max(5) })).max(10),
  summary: z.string().trim().max(3000).nullable().optional(),
  recommendation: z.enum(["STRONG_NO", "NO", "YES", "STRONG_YES"]).nullable().optional(),
  submit: z.boolean().default(false),
});

export const collaborativePipelineSchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"]),
  rejectionReason: z.string().trim().max(1000).nullable().optional(),
});
