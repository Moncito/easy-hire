import { z } from "zod";
import { generateAiObject } from "@/lib/ai/run";

export const jobCopyInputSchema = z.object({
  mode: z.enum(["draft", "improve"]).default("draft"),
  title: z.string().min(1).max(160),
  category: z.string().optional(),
  industry: z.string().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  remoteType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  location: z.string().optional(),
  existingDescription: z.string().max(8000).optional(),
  existingRequirements: z.string().max(4000).optional().nullable(),
  existingBenefits: z.string().max(4000).optional().nullable(),
  notes: z.string().max(1000).optional(),
});
export type JobCopyInput = z.infer<typeof jobCopyInputSchema>;

const jobCopyOutputSchema = z.object({
  title: z.string().describe("A clear, specific job title (keep the employer's title if it's already good)"),
  description: z.string().describe("2-4 paragraph job description in Markdown, welcoming to VA candidates"),
  requirements: z.string().describe("Bullet list (Markdown) of must-have skills/experience"),
  benefits: z.string().describe("Bullet list (Markdown) of perks/benefits; omit exaggerated claims"),
});
export type JobCopyOutput = z.infer<typeof jobCopyOutputSchema>;

export async function generateJobCopy(companyId: string, input: JobCopyInput) {
  const context = [
    `Job title: ${input.title}`,
    input.category ? `Category: ${input.category}` : null,
    input.industry ? `Industry: ${input.industry}` : null,
    input.employmentType ? `Employment type: ${input.employmentType}` : null,
    input.remoteType ? `Work arrangement: ${input.remoteType}` : null,
    input.location ? `Location: ${input.location}` : null,
    input.existingDescription ? `Current description:\n${input.existingDescription}` : null,
    input.existingRequirements ? `Current requirements:\n${input.existingRequirements}` : null,
    input.existingBenefits ? `Current benefits:\n${input.existingBenefits}` : null,
    input.notes ? `Employer notes: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const action =
    input.mode === "improve"
      ? "Rewrite and improve the job posting below. Keep the same role, but make it clearer, more specific, and more attractive to Virtual Assistant candidates."
      : "Draft a new job posting for a Virtual Assistant marketplace (EasyHire) from the details below.";

  return generateAiObject({
    companyId,
    feature: "job-copy",
    schema: jobCopyOutputSchema,
    system:
      "You write concise, honest, inclusive job postings for a Virtual Assistant staffing marketplace. Never invent salary figures, company facts, or benefits that weren't provided. Avoid discriminatory language.",
    prompt: `${action}\n\n${context}`,
    metadata: { mode: input.mode },
  });
}
