import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const rankInputSchema = z.object({
  applicationId: z.string().min(1),
});
export type RankInput = z.infer<typeof rankInputSchema>;

const rankOutputSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall fit score, 0-100"),
  reasons: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 short, specific reasons behind the score (mix of strengths and gaps)"),
  summary: z.string().describe("One sentence summary of overall fit"),
});
export type RankOutput = z.infer<typeof rankOutputSchema>;

/**
 * Scores one applicant against a job. This is advisory only — it NEVER
 * changes `Application.status`. Rejection/shortlist decisions always
 * require a human action via the existing applications API.
 */
export async function rankApplication(companyId: string, input: RankInput) {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, job: { companyId } },
    include: {
      job: { select: { title: true, description: true, requirements: true, category: true } },
      seeker: {
        select: {
          fullName: true,
          headline: true,
          bio: true,
          skills: true,
          yearsExperience: true,
          availability: true,
          certifications: true,
          workExperience: true,
          education: true,
        },
      },
      answers: {
        include: { question: { select: { prompt: true } } },
      },
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  const answers = application.answers
    .map((a) => `Q: ${a.question.prompt}\nA: ${a.answerText}`)
    .join("\n\n");

  const prompt = `
Job title: ${application.job.title}
Job category: ${application.job.category}
Job description: ${application.job.description}
Job requirements: ${application.job.requirements ?? "Not specified"}

Candidate: ${application.seeker.fullName}
Headline: ${application.seeker.headline ?? "N/A"}
Bio: ${application.seeker.bio ?? "N/A"}
Skills: ${application.seeker.skills.join(", ") || "N/A"}
Years of experience: ${application.seeker.yearsExperience ?? "N/A"}
Availability: ${application.seeker.availability ?? "N/A"}
Certifications: ${application.seeker.certifications.join(", ") || "N/A"}
Work experience: ${application.seeker.workExperience.join("; ") || "N/A"}
Education: ${application.seeker.education.join("; ") || "N/A"}
Cover note: ${application.coverNote ?? "None provided"}
${answers ? `Screening answers:\n${answers}` : ""}
`.trim();

  return generateAiObject({
    companyId,
    feature: "rank",
    schema: rankOutputSchema,
    system:
      "You are a hiring assistant that scores candidate fit for a role based only on the information given. Be balanced and specific. Never suggest rejecting or hiring — scoring is advisory input for a human recruiter, who always makes the final call.",
    prompt,
    metadata: { applicationId: application.id, jobId: application.jobId },
  });
}
