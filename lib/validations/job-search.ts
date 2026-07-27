import { z } from "zod";

export const jobSearchSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  remoteType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
