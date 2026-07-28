import { z } from "zod";

export const talentSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  skill: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  availability: z.string().trim().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type TalentSearchInput = z.infer<typeof talentSearchSchema>;

export const savedSeekerSchema = z.object({
  seekerId: z.string().min(1),
});
