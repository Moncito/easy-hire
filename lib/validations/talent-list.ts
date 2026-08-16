import { z } from "zod";

export const talentListCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep names under 80 characters"),
});

export const talentListUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep names under 80 characters"),
});

export const talentListItemCreateSchema = z.object({
  seekerId: z.string().min(1),
  note: z.string().trim().max(500).optional().nullable(),
});
