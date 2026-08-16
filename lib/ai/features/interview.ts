import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const interviewInputSchema = z.object({
  jobId: z.string().min(1),
  applicationId: z.string().min(1).optional(),
});
export type InterviewInput = z.infer<typeof interviewInputSchema>;

const interviewOutputSchema = z.object({
  questions: z
    .array(z.string())
    .min(8)
    .max(12)
    .describe("8-12 interview questions, ordered from warm-up to role-specific"),
});
export type InterviewOutput = z.infer<typeof interviewOutputSchema>;

export async function generateInterviewKit(companyId: string, input: InterviewInput) {
  const job = await prisma.job.findFirst({
    where: { id: input.jobId, companyId },
    select: { title: true, description: true, requirements: true, category: true },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  let candidateContext = "";
  if (input.applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: input.applicationId, job: { companyId, id: input.jobId } },
      include: {
        seeker: {
          select: {
            fullName: true,
            headline: true,
            skills: true,
            yearsExperience: true,
            workExperience: true,
          },
        },
      },
    });

    if (application) {
      candidateContext = `
Candidate: ${application.seeker.fullName}
Headline: ${application.seeker.headline ?? "N/A"}
Skills: ${application.seeker.skills.join(", ") || "N/A"}
Years of experience: ${application.seeker.yearsExperience ?? "N/A"}
Work experience: ${application.seeker.workExperience.join("; ") || "N/A"}
Cover note: ${application.coverNote ?? "None provided"}
`.trim();
    }
  }

  const prompt = `
Job title: ${job.title}
Job category: ${job.category}
Job description: ${job.description}
Job requirements: ${job.requirements ?? "Not specified"}
${candidateContext ? `\n${candidateContext}` : ""}
`.trim();

  return generateAiObject({
    companyId,
    feature: "interview",
    schema: interviewOutputSchema,
    system:
      "You write practical interview question sets for hiring Virtual Assistants. Cover communication, reliability, relevant tools/skills, and role-specific scenarios. Keep questions open-ended and fair — no leading or discriminatory questions.",
    prompt,
    metadata: { jobId: input.jobId, hasCandidate: !!candidateContext },
  });
}
