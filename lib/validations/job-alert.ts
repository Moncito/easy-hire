import { z } from "zod";

export const jobAlertFrequencySchema = z.enum(["DAILY", "WEEKLY"]);

export const createJobAlertSchema = z.object({
  keywords: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional(),
  frequency: jobAlertFrequencySchema.default("DAILY"),
});

export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>;
