import { z } from "zod";

export const jobSearchSortSchema = z.enum(["newest", "salary_high"]);
export const jobSearchPostedWithinSchema = z.enum(["24h", "3d", "7d", "30d"]);

export const jobSearchSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  location: z.string().trim().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  remoteType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  salaryPeriod: z.enum(["HOURLY", "MONTHLY", "ANNUAL"]).optional(),
  postedWithin: jobSearchPostedWithinSchema.optional(),
  sort: jobSearchSortSchema.default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
