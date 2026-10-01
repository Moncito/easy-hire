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

/**
 * A PATCH may toggle just one preference — every field is optional, but at
 * least one must be present, or there's nothing to update. Same
 * `.partial().refine(...)` shape as updateJobAlertSchema
 * (lib/validations/job-alert.ts).
 */
export const notificationPreferencesUpdateSchema = z
  .object({
    notifyMessages: z.boolean().optional(),
    notifyApplicationUpdates: z.boolean().optional(),
    notifyProductDigest: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.notifyMessages !== undefined ||
      data.notifyApplicationUpdates !== undefined ||
      data.notifyProductDigest !== undefined,
    { message: "Provide at least one preference to update" }
  );

export type NotificationPreferencesUpdateRequest = z.infer<typeof notificationPreferencesUpdateSchema>;

/** POST /api/account/2fa/confirm — a bare 6-digit TOTP code, nothing else. */
export const twoFactorConfirmRequestSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

export type TwoFactorConfirmRequest = z.infer<typeof twoFactorConfirmRequestSchema>;

/**
 * POST /api/account/2fa/disable — re-authentication, same "one of these two
 * fields" shape as accountDeletionRequestSchema above. Which one is valid
 * for a given account (e.g. a Google-only account has no password) is
 * decided after loading the user row in lib/auth/two-factor.ts, not here.
 */
export const twoFactorDisableRequestSchema = z
  .object({
    password: z.string().min(1).max(200).optional(),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.")
      .optional(),
  })
  .refine((data) => Boolean(data.password) || Boolean(data.code), {
    message: "Enter your current password or a 2FA code to continue.",
  });

export type TwoFactorDisableRequest = z.infer<typeof twoFactorDisableRequestSchema>;
