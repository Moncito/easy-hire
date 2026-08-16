import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const bulkShortlistInputSchema = z.object({
  jobId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type BulkShortlistInput = z.infer<typeof bulkShortlistInputSchema>;

const MAX_CANDIDATES_CONSIDERED = 30;

const bulkShortlistOutputSchema = z.object({
  shortlist: z
    .array(
      z.object({
        applicationId: z.string(),
        score: z.number().min(0).max(100),
        reasons: z.array(z.string()).length(3),
      })
    )
    .describe("Ranked candidates, best fit first"),
});

export type BulkShortlistItem = {
  applicationId: string;
  seekerName: string;
  score: number;
  reasons: string[];
};

/**
 * Ranks every APPLIED candidate for a job in one AI call and returns a
 * "top N" suggestion. This is 100% advisory: it never updates any
 * `Application.status`. The employer must review and confirm before the
 * existing applications API is used to actually shortlist anyone.
 */
export async function generateBulkShortlist(companyId: string, input: BulkShortlistInput) {
  const job = await prisma.job.findFirst({
    where: { id: input.jobId, companyId },
    select: { title: true, description: true, requirements: true },
  });
  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  const candidates = await prisma.application.findMany({
    where: { jobId: input.jobId, status: "APPLIED" },
    take: MAX_CANDIDATES_CONSIDERED,
    orderBy: { appliedAt: "desc" },
    include: {
      seeker: {
        select: { fullName: true, headline: true, skills: true, yearsExperience: true, bio: true },
      },
    },
  });

  if (candidates.length === 0) {
    return { configured: true, data: { shortlist: [] as BulkShortlistItem[] } };
  }

  const candidateBlock = candidates
    .map(
      (c, i) => `
Candidate ${i + 1} (applicationId: ${c.id}):
Name: ${c.seeker.fullName}
Headline: ${c.seeker.headline ?? "N/A"}
Skills: ${c.seeker.skills.join(", ") || "N/A"}
Years of experience: ${c.seeker.yearsExperience ?? "N/A"}
Bio: ${c.seeker.bio ?? "N/A"}
Cover note: ${c.coverNote ?? "None"}
`.trim()
    )
    .join("\n\n");

  const prompt = `
Job title: ${job.title}
Job description: ${job.description}
Requirements: ${job.requirements ?? "Not specified"}

Rank ALL of the following candidates by fit for this role. Use the exact "applicationId" value given for each candidate.

${candidateBlock}
`.trim();

  const result = await generateAiObject({
    companyId,
    feature: "bulk-shortlist",
    schema: bulkShortlistOutputSchema,
    system:
      "You rank job candidates by fit for a role, using only the information given. Output is advisory input for a human recruiter — never state or imply anyone should be rejected.",
    prompt,
    metadata: { jobId: input.jobId, candidateCount: candidates.length },
  });

  if (!result.configured || !result.data) {
    return { configured: result.configured, data: null, message: result.message };
  }

  const validIds = new Set(candidates.map((c) => c.id));
  const nameById = new Map(candidates.map((c) => [c.id, c.seeker.fullName]));

  const shortlist: BulkShortlistItem[] = result.data.shortlist
    .filter((entry) => validIds.has(entry.applicationId))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit)
    .map((entry) => ({
      applicationId: entry.applicationId,
      seekerName: nameById.get(entry.applicationId) ?? "Candidate",
      score: entry.score,
      reasons: entry.reasons,
    }));

  return { configured: true, data: { shortlist } };
}
