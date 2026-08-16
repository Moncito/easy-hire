import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const resumeHighlightsInputSchema = z.object({
  seekerId: z.string().min(1),
});
export type ResumeHighlightsInput = z.infer<typeof resumeHighlightsInputSchema>;

const resumeHighlightsOutputSchema = z.object({
  summary: z.string().describe("1-2 sentence summary of the candidate's profile"),
  highlights: z.array(z.string()).min(3).max(6).describe("Standout skills/experience worth noting"),
});
export type ResumeHighlightsOutput = z.infer<typeof resumeHighlightsOutputSchema>;

/**
 * Extracts skimmable highlights from a seeker's profile for the talent
 * detail view. Only reads fields the seeker has made visible to employers
 * (talent search already filters by visibility before this is called).
 */
export async function generateResumeHighlights(companyId: string, input: ResumeHighlightsInput) {
  const seeker = await prisma.seekerProfile.findFirst({
    where: { id: input.seekerId, visibility: { in: ["STANDARD", "PUBLIC"] } },
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
      languages: true,
    },
  });

  if (!seeker) {
    throw new ApiError("Seeker profile not found", 404);
  }

  const prompt = `
Name: ${seeker.fullName}
Headline: ${seeker.headline ?? "N/A"}
Bio: ${seeker.bio ?? "N/A"}
Skills: ${seeker.skills.join(", ") || "N/A"}
Years of experience: ${seeker.yearsExperience ?? "N/A"}
Availability: ${seeker.availability ?? "N/A"}
Certifications: ${seeker.certifications.join(", ") || "N/A"}
Work experience: ${seeker.workExperience.join("; ") || "N/A"}
Education: ${seeker.education.join("; ") || "N/A"}
Languages: ${seeker.languages.join(", ") || "N/A"}
`.trim();

  return generateAiObject({
    companyId,
    feature: "resume-highlights",
    schema: resumeHighlightsOutputSchema,
    system:
      "You extract the most relevant, standout facts from a candidate's profile for a busy employer skimming a talent list. Use only the facts given.",
    prompt,
    metadata: { seekerId: input.seekerId },
  });
}
