import { z } from "zod";

export const verificationDocTypeSchema = z.enum([
  "BUSINESS_REGISTRATION",
  "BUSINESS_PERMIT",
  "OTHER",
]);

export const verificationDocumentCreateSchema = z.object({
  fileUrl: z.string().url("A valid file URL is required"),
  fileName: z.string().min(1, "File name is required").max(255),
  docType: verificationDocTypeSchema,
});

export type VerificationDocumentCreateInput = z.infer<typeof verificationDocumentCreateSchema>;
