import { z } from "zod";

export const jobAlertFrequencySchema = z.enum(["DAILY", "WEEKLY"]);

export const createJobAlertSchema = z.object({
  keywords: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional(),
  frequency: jobAlertFrequencySchema.default("DAILY"),
});

export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>;

// Reuses createJobAlertSchema's own field validators (not redefined) so the
// two schemas can never drift on what counts as a valid keywords/category/
// frequency value. Every field is optional here — a PATCH may touch just
// one of them — but at least one must be present, or there's nothing to
// update.
export const updateJobAlertSchema = createJobAlertSchema
  .partial()
  .refine((data) => data.keywords !== undefined || data.category !== undefined || data.frequency !== undefined, {
    message: "Provide at least one field to update",
  });

export type UpdateJobAlertInput = z.infer<typeof updateJobAlertSchema>;
