import { z } from "zod";

export const adminJobReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export type AdminJobReviewInput = z.infer<typeof adminJobReviewSchema>;

export const adminCompanyReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export type AdminCompanyReviewInput = z.infer<typeof adminCompanyReviewSchema>;

export const adminSeekerVerificationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export type AdminSeekerVerificationReviewInput = z.infer<typeof adminSeekerVerificationReviewSchema>;
