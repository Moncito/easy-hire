import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const spamFlagInputSchema = z.object({
  jobId: z.string().min(1),
});
export type SpamFlagInput = z.infer<typeof spamFlagInputSchema>;

const spamFlagOutputSchema = z.object({
  flagged: z.boolean().describe("True only if the posting reads like spam, a scam, or a near-duplicate pattern"),
  reasons: z.array(z.string()).max(4).describe("Specific reasons for the flag; empty if not flagged"),
});
export type SpamFlagOutput = z.infer<typeof spamFlagOutputSchema>;

/**
 * Self-service check an employer can run before submitting a job for admin
 * review. Flag-only — this never blocks publishing, hides the job, or
 * replaces the human admin review step required for Free jobs.
 */
export async function generateSpamFlag(companyId: string, input: SpamFlagInput) {
  const job = await prisma.job.findFirst({
    where: { id: input.jobId, companyId },
    select: { title: true, description: true, requirements: true, benefits: true, salaryMin: true, salaryMax: true },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  const prompt = `
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements ?? "N/A"}
Benefits: ${job.benefits ?? "N/A"}
Salary range: ${job.salaryMin ?? "n/a"}-${job.salaryMax ?? "n/a"}
`.trim();

  return generateAiObject({
    companyId,
    feature: "spam-flag",
    schema: spamFlagOutputSchema,
    system:
      "You check job postings for spam/scam patterns before an admin reviews them: unrealistic pay promises, pay-to-work / pyramid-scheme language, excessive urgency or ALL CAPS, or vague 'work from home, no experience, huge pay' phrasing. Only flag when there's a real pattern — most legitimate postings should NOT be flagged. This is advisory only.",
    prompt,
    metadata: { jobId: input.jobId },
  });
}
