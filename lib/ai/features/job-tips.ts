import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const jobTipsInputSchema = z.object({
  jobId: z.string().min(1),
});
export type JobTipsInput = z.infer<typeof jobTipsInputSchema>;

const jobTipsOutputSchema = z.object({
  tips: z.array(z.string()).min(1).max(4).describe("Concrete, actionable tips to improve this job's performance"),
});
export type JobTipsOutput = z.infer<typeof jobTipsOutputSchema>;

/** Compares views vs. applies for one job and suggests concrete improvements. */
export async function generateJobTips(companyId: string, input: JobTipsInput) {
  const job = await prisma.job.findFirst({
    where: { id: input.jobId, companyId },
    select: {
      title: true,
      description: true,
      salaryMin: true,
      salaryMax: true,
      remoteType: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { applications: true, views: true } },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  const daysLive = Math.max(
    1,
    Math.round((Date.now() - (job.publishedAt ?? job.createdAt).getTime()) / (24 * 60 * 60 * 1000))
  );
  const conversion = job._count.views > 0 ? Math.round((job._count.applications / job._count.views) * 100) : null;

  const prompt = `
Job title: ${job.title}
Days live: ${daysLive}
Views: ${job._count.views}
Applications: ${job._count.applications}
View-to-apply conversion: ${conversion !== null ? `${conversion}%` : "not enough views yet"}
Salary range: ${job.salaryMin ?? "n/a"}-${job.salaryMax ?? "n/a"}
Work arrangement: ${job.remoteType}
Description length: ${job.description.length} characters
`.trim();

  return generateAiObject({
    companyId,
    feature: "job-tips",
    schema: jobTipsOutputSchema,
    system:
      "You give employers short, practical tips to improve a job posting's views and application rate, based only on the numbers and details given. No generic filler.",
    prompt,
    metadata: { jobId: input.jobId },
  });
}
