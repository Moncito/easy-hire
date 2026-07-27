import { z } from "zod";

export const employmentTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]);
export const remoteTypeSchema = z.enum(["REMOTE", "ONSITE", "HYBRID"]);
export const jobStatusSchema = z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "CLOSED"]);

export const jobInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  employmentType: employmentTypeSchema,
  salaryMin: z.union([z.string(), z.number()]).optional().nullable(),
  salaryMax: z.union([z.string(), z.number()]).optional().nullable(),
  location: z.string().min(1, "Location is required"),
  remoteType: remoteTypeSchema.default("REMOTE"),
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
    employmentType: input.employmentType,
    salaryMin: parseSalary(input.salaryMin),
    salaryMax: parseSalary(input.salaryMax),
    location: input.location,
    remoteType: input.remoteType,
  };
}
