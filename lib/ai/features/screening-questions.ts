import { z } from "zod";
import { generateAiObject } from "@/lib/ai/run";

export const screeningQuestionsInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(8000),
  requirements: z.string().max(4000).optional().nullable(),
});
export type ScreeningQuestionsInput = z.infer<typeof screeningQuestionsInputSchema>;

const screeningQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().max(300),
        required: z.boolean(),
      })
    )
    .min(1)
    .max(5)
    .describe("Up to 5 screening questions — collected only, never used to auto-reject"),
});
export type ScreeningQuestionsOutput = z.infer<typeof screeningQuestionsOutputSchema>;

/** Suggests screening questions for the job form — the employer still adds/edits/removes before saving. */
export async function generateScreeningQuestions(companyId: string, input: ScreeningQuestionsInput) {
  const prompt = `
Job title: ${input.title}
Job description: ${input.description}
Requirements: ${input.requirements ?? "Not specified"}
`.trim();

  return generateAiObject({
    companyId,
    feature: "screening-questions",
    schema: screeningQuestionsOutputSchema,
    system:
      "You write short screening questions employers ask candidates when they apply. Focus on availability, tools/skills, and role fit. These answers are for the employer's context only and must never imply automatic disqualification.",
    prompt,
  });
}
