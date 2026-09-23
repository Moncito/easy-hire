import { z } from "zod";
import { passwordSchema } from "@/lib/validations/sign-up";

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

/**
 * Shape only, same pattern as accountDeletionRequestSchema above: both
 * fields are optional here because a Google-only account (no
 * `passwordHash`) supplies neither — that request falls back to the
 * existing email reset flow instead of a direct change. Which fields are
 * actually required, and the "new password must differ from current"
 * rule, is decided after loading the user row in
 * lib/account/change-password.ts. `newPassword` reuses the exact strength
 * rule signup/reset already enforce — see passwordSchema's doc comment.
 */
export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: passwordSchema.optional(),
});

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
