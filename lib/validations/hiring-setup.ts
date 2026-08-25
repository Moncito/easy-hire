import { z } from "zod";

export const hiringSetupSchema = z.object({
  memberIds: z.array(z.string().min(1)).max(30),
  title: z.string().trim().min(2).max(80),
  instructions: z.string().trim().max(1000).nullable().optional(),
  criteria: z.array(z.object({ label: z.string().trim().min(2).max(80), description: z.string().trim().max(300).nullable().optional() })).min(1).max(10),
});
