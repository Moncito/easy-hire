export type ExistingGoogleLinkUser = {
  id: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
};

export type GoogleAccountLinkingAction =
  | { type: "create" }
  | { type: "evictUnverifiedPassword"; userId: string }
  | { type: "backfillVerification"; userId: string }
  | { type: "linkAsIs"; userId: string };

/**
 * Pure decision function for the Google `profile()` callback in Auth.ts —
 * no DB access, so the account-linking branches (especially the unverified-
 * password eviction case) are unit tested directly instead of through a
 * Prisma mock, mirroring the "pure guard" pattern in
 * lib/account/account-deletion.ts (assertCanDeleteOwnedCompany).
 *
 * Google has already proven the current signer owns the mailbox. An
 * unverified Credentials row on the same email never proved that — it could
 * be the real owner who hasn't clicked their verification link yet, or an
 * attacker who pre-registered the email to squat on it and later hijack a
 * Google sign-in. Since Google's proof outranks an unverified claim, that
 * case evicts the password on file rather than silently handing the
 * Google signer someone else's (possibly attacker-controlled) account row.
 * See Auth.ts for the actual DB writes each action performs.
 */
export function resolveGoogleAccountLinkingAction(
  existingUser: ExistingGoogleLinkUser | null
): GoogleAccountLinkingAction {
  if (!existingUser) {
    return { type: "create" };
  }

  if (!existingUser.emailVerifiedAt && existingUser.passwordHash) {
    return { type: "evictUnverifiedPassword", userId: existingUser.id };
  }

  if (!existingUser.emailVerifiedAt) {
    // Already Google-only (no password) — just never stamped verified.
    return { type: "backfillVerification", userId: existingUser.id };
  }

  return { type: "linkAsIs", userId: existingUser.id };
}
