import { z } from "zod";

export const verificationDocTypeSchema = z.enum([
  "BUSINESS_REGISTRATION",
  "BUSINESS_PERMIT",
  "OTHER",
]);

/**
 * Verification documents live in a private bucket and are persisted as a
 * bare object path (`${userId}/${timestamp}-${name}`), not a full URL —
 * only signed at read time. Accept either shape so legacy full-URL rows and
 * new object-path rows both validate.
 */
const urlOrObjectPath = z
  .string()
  .max(2048)
  .refine((value) => value.length > 0 && !/\s/.test(value), "A valid file URL or path is required");

export const verificationDocumentCreateSchema = z.object({
  fileUrl: urlOrObjectPath,
  fileName: z.string().min(1, "File name is required").max(255),
  docType: verificationDocTypeSchema,
});

export type VerificationDocumentCreateInput = z.infer<typeof verificationDocumentCreateSchema>;
