import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
]);

export const applicationUpdateSchema = z
  .object({
    status: applicationStatusSchema.optional(),
    internalNotes: z.string().max(5000).optional().nullable(),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    rejectionReason: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;

export const applicationAnswerInputSchema = z.object({
  questionId: z.string().min(1),
  answerText: z.string().max(2000),
});

export const applicationCreateSchema = z.object({
  jobId: z.string().min(1),
  coverNote: z.string().max(2000).optional().nullable(),
  answers: z.array(applicationAnswerInputSchema).optional().default([]),
});

export type ApplicationCreate = z.infer<typeof applicationCreateSchema>;
