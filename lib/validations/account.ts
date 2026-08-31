import { z } from "zod";

/**
 * Shape only — which field is actually required depends on whether the
 * account has a password (Credentials) or is Google-only, and that can only
 * be known after loading the user row. That branch lives in
 * lib/account/account-deletion.ts, not here.
 */
export const accountDeletionRequestSchema = z.object({
  password: z.string().min(1).max(200).optional(),
  confirmation: z.string().min(1).max(200).optional(),
});

export type AccountDeletionRequest = z.infer<typeof accountDeletionRequestSchema>;
