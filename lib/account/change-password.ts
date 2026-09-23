import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { passwordSchema } from "@/lib/validations/sign-up";
import { requestPasswordReset } from "@/lib/auth/credentials-recovery";
import { sendPasswordChangedEmail } from "@/lib/shared/email";
import { recordEvent } from "@/lib/admin/events";
import { actorTypeForRole } from "@/lib/auth/auth-events";

/**
 * CHANGE PASSWORD — signed-in password rotation
 * ================================================
 * Two branches, decided by whether `user.passwordHash` is set (Credentials)
 * or null (Google-only — see lib/account/auth-method.ts's accountHasPassword,
 * which this mirrors but doesn't call directly since the full user row,
 * including email, is needed here anyway):
 *
 *  - Has a password: verify `currentPassword` against the stored hash, then
 *    hash and store `newPassword`. Same bcrypt cost factor (10) as
 *    resetPassword in lib/auth/credentials-recovery.ts, which this
 *    otherwise doesn't touch — a direct change is a different flow from a
 *    token-based reset, so the two stay separate rather than one calling
 *    the other.
 *  - Google-only: there is no current password to verify, so a password
 *    value coming straight from the session can never be trusted on its
 *    own. Instead of inventing a second token mechanism, this reuses
 *    requestPasswordReset(user.email) — the existing reset flow already
 *    handles token creation, TTL, hashing, and single-use consumption, and
 *    it proves control of the mailbox the way a bare session claim can't.
 */

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword?: string;
};

export type ChangePasswordResult =
  | { outcome: "changed" }
  | { outcome: "reset_email_sent" };

/**
 * Pure guard for the has-password branch — no DB access, cheap to unit test
 * (same rationale as assertCanDeleteOwnedCompany in
 * lib/account/account-deletion.ts). Narrows both fields to required
 * strings on success so the caller doesn't need its own non-null
 * assertions afterwards.
 */
export function assertChangePasswordInput(
  input: ChangePasswordInput
): asserts input is { currentPassword: string; newPassword: string } {
  if (!input.currentPassword) {
    throw new ApiError("Enter your current password.", 400);
  }
  if (!input.newPassword) {
    throw new ApiError("Enter a new password.", 400);
  }
  if (input.currentPassword === input.newPassword) {
    throw new ApiError("New password must be different from your current password.", 400);
  }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, passwordHash: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (!user.passwordHash) {
    // Google-only account — see the module doc comment above.
    await requestPasswordReset(user.email);
    return { outcome: "reset_email_sent" };
  }

  assertChangePasswordInput(input);

  // Same generic 400/401 shape as assertReauthenticated in
  // lib/account/account-deletion.ts — a wrong current password gets a
  // plain "Incorrect password." 401, no distinct status or timing signal
  // beyond what that existing re-auth check already exposes.
  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError("Incorrect password.", 401);
  }

  // Re-validated here (not just trusted from the route's Zod parse) —
  // mirrors resetPassword's own internal passwordSchema.parse call, so this
  // function stays safe to call from any future caller that might skip the
  // route-level schema.
  const parsedNewPassword = passwordSchema.parse(input.newPassword);
  // Hashed outside any transaction — bcrypt is CPU-bound, and there's no
  // multi-statement write here that needs one.
  const passwordHash = await bcrypt.hash(parsedNewPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });

  // SESSION INVALIDATION — NOT DONE, BY NECESSITY:
  // Auth.ts uses `session: { strategy: "jwt" }` and there is no `Session`
  // model in prisma/schema.prisma, so existing JWTs for this user on other
  // devices/browsers cannot be revoked server-side — the token itself is
  // the credential and remains valid until it expires on its own. Changing
  // passwordHash here does not (and cannot) invalidate it. A real fix would
  // need a server-side session/deny-list (e.g. a `passwordChangedAt` claim
  // checked in the `jwt` callback against a stored timestamp), which is out
  // of scope for this change.
  recordEvent({
    eventType: "PASSWORD_CHANGED",
    actorType: actorTypeForRole(user.role),
    userId: user.id,
  });

  // Account-security confirmation — always sent, not gated by any
  // notification preference (see sendPasswordChangedEmail's doc comment).
  await sendPasswordChangedEmail({ to: user.email });

  return { outcome: "changed" };
}
