import { z } from "zod";
import { generateAiObject } from "@/lib/ai/run";

export const companyBrandInputSchema = z.object({
  companyName: z.string().min(1).max(160),
  industry: z.string().optional().nullable(),
  existingDescription: z.string().max(4000).optional().nullable(),
  highlights: z.array(z.string()).max(10).optional(),
  notes: z.string().max(1000).optional(),
});
export type CompanyBrandInput = z.infer<typeof companyBrandInputSchema>;

const companyBrandOutputSchema = z.object({
  description: z.string().describe("2-3 paragraph company 'About' copy for the public company profile"),
  highlights: z.array(z.string()).min(2).max(6).describe("Short highlight chips, e.g. 'Remote-first', 'Founded 2019'"),
});
export type CompanyBrandOutput = z.infer<typeof companyBrandOutputSchema>;

/** Drafts/rewrites the public company "About" copy — employer reviews before saving to their profile. */
export async function generateCompanyBrandCopy(companyId: string, input: CompanyBrandInput) {
  const prompt = `
Company name: ${input.companyName}
Industry: ${input.industry ?? "Not specified"}
Existing description: ${input.existingDescription ?? "None yet"}
Existing highlights: ${input.highlights?.join(", ") || "None yet"}
Employer notes: ${input.notes ?? "None"}
`.trim();

  return generateAiObject({
    companyId,
    feature: "company-brand",
    schema: companyBrandOutputSchema,
    system:
      "You write welcoming, honest company profile copy for employers hiring Virtual Assistants. Never invent facts (funding, team size, awards) that weren't provided.",
    prompt,
  });
}
