import { z } from "zod";

export const employmentTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]);
export const remoteTypeSchema = z.enum(["REMOTE", "ONSITE", "HYBRID"]);
export const jobStatusSchema = z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "CLOSED"]);
export const salaryPeriodSchema = z.enum(["HOURLY", "MONTHLY", "ANNUAL"]);

export const screeningQuestionInputSchema = z.object({
  prompt: z
    .string()
    .min(1, "Question is required")
    .max(300, "Keep questions under 300 characters"),
  required: z.boolean().optional().default(true),
});

export const jobInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  industry: z.string().optional().nullable(),
  employmentType: employmentTypeSchema,
  salaryMin: z.union([z.string(), z.number()]).optional().nullable(),
  salaryMax: z.union([z.string(), z.number()]).optional().nullable(),
  salaryPeriod: salaryPeriodSchema.default("MONTHLY"),
  location: z.string().min(1, "Location is required"),
  remoteType: remoteTypeSchema.default("REMOTE"),
  screeningQuestions: z
    .array(screeningQuestionInputSchema)
    .max(5, "Up to 5 screening questions are allowed")
    .optional()
    .default([]),
});

export const jobStatusUpdateSchema = z.object({
  status: jobStatusSchema,
});

export type JobInput = z.infer<typeof jobInputSchema>;

export function parseSalary(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function jobInputToData(input: JobInput) {
  return {
    title: input.title,
    description: input.description,
    requirements: input.requirements || null,
    benefits: input.benefits || null,
    category: input.category,
    industry: input.industry || null,
    employmentType: input.employmentType,
    salaryMin: parseSalary(input.salaryMin),
    salaryMax: parseSalary(input.salaryMax),
    salaryPeriod: input.salaryPeriod,
    location: input.location,
    remoteType: input.remoteType,
  };
}
