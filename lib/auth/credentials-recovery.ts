import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { VerificationPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { normalizeEmail } from "@/lib/email-address";
import { passwordSchema } from "@/lib/validations/sign-up";
import { sendEmailVerificationEmail, sendPasswordResetEmail, sendWelcomeVerificationEmail } from "@/lib/shared/email";
import { recomputeVerificationScoreForUser } from "@/lib/seeker/identity-verification";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const INVALID_OR_EXPIRED_MESSAGE = "This link is invalid or has expired.";

/** Mirrors createInvitationToken() in lib/collaborative-hiring.ts — raw token is emailed, only its hash is persisted. */
export function createVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type LoadedVerificationToken = {
  purpose: VerificationPurpose;
  consumedAt: Date | null;
  expiresAt: Date;
};

/**
 * Pure guard shared by resetPassword and verifyEmail — no DB access, so the
 * hash/purpose/expiry/consumed rules that make a token usable are unit
 * tested directly instead of through an elaborate Prisma mock. The DB-level
 * double-consume guard (the atomic `updateMany({ where: { consumedAt: null } })`
 * compare-and-swap) still lives in each caller, since it depends on a live
 * transaction.
 */
export function assertTokenUsable(
  record: LoadedVerificationToken | null,
  purpose: VerificationPurpose,
  now: Date = new Date()
): asserts record is LoadedVerificationToken {
  if (!record || record.purpose !== purpose || record.consumedAt !== null || record.expiresAt <= now) {
    throw new ApiError(INVALID_OR_EXPIRED_MESSAGE, 400);
  }
}

/**
 * Applied to posting a job and sending a message only (not sign-in — the
 * signup funnel must not be blocked). Existing accounts from before this
 * feature shipped were backfilled to verified in the migration, so this
 * never locks out pre-existing users.
 */
export async function requireVerifiedEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!user?.emailVerifiedAt) {
    throw new ApiError("Please verify your email address before continuing.", 403);
  }
}

/**
 * Always resolves — regardless of whether the account exists, or exists but
 * has no password (e.g. a Google-only account) — so a caller can never use
 * this to enumerate registered emails. Only sends mail on the real match.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return;
  }

  const { token, tokenHash } = createVerificationToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction(async (tx) => {
    // Invalidate any outstanding reset tokens first, so only the newest link works.
    await tx.verificationToken.updateMany({
      where: { userId: user.id, purpose: "PASSWORD_RESET", consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.verificationToken.create({
      data: { userId: user.id, tokenHash, purpose: "PASSWORD_RESET", expiresAt },
    });
  });

  await sendPasswordResetEmail({ to: user.email, token });
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const parsedPassword = passwordSchema.parse(newPassword);
  const tokenHash = hashVerificationToken(rawToken);
  // Hashed outside the transaction — bcrypt is CPU-bound and shouldn't hold a DB transaction open.
  const passwordHash = await bcrypt.hash(parsedPassword, 10);

  await prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { tokenHash } });
    assertTokenUsable(record, "PASSWORD_RESET");

    // Atomic consume: the WHERE consumedAt: null makes this a compare-and-swap
    // at the row level — under concurrent requests for the same token, Postgres
    // serializes the two UPDATEs and only the first commits with count === 1;
    // the second re-evaluates against the now-committed row and affects 0 rows.
    const consumed = await tx.verificationToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) {
      throw new ApiError(INVALID_OR_EXPIRED_MESSAGE, 400);
    }

    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });

    // Invalidate any other outstanding reset tokens for this user.
    await tx.verificationToken.updateMany({
      where: { userId: record.userId, purpose: "PASSWORD_RESET", consumedAt: null },
      data: { consumedAt: new Date() },
    });
  });
}

/**
 * Shared by requestEmailVerification (plain resend) and
 * sendWelcomeVerificationEmail (registration) — issues a fresh EMAIL_VERIFY
 * token and returns it plus the user's email, without sending any mail
 * itself. Returns null when the account is already verified (nothing to do
 * — mirrors requestEmailVerification's previous early return).
 */
async function issueEmailVerificationToken(
  userId: string
): Promise<{ email: string; token: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (user.emailVerifiedAt) {
    return null;
  }

  const { token, tokenHash } = createVerificationToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.updateMany({
      where: { userId: user.id, purpose: "EMAIL_VERIFY", consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.verificationToken.create({
      data: { userId: user.id, tokenHash, purpose: "EMAIL_VERIFY", expiresAt },
    });
  });

  return { email: user.email, token };
}

export async function requestEmailVerification(userId: string): Promise<void> {
  const issued = await issueEmailVerificationToken(userId);
  if (!issued) {
    return;
  }
  await sendEmailVerificationEmail({ to: issued.email, token: issued.token });
}

/**
 * Registration-only variant of requestEmailVerification: same token
 * issuance, but sends the combined "Welcome to EasyHire — verify your
 * email" template instead of the plain verification email, so a brand-new
 * account gets exactly one email instead of two near-identical ones back to
 * back. Every other caller of requestEmailVerification (e.g. the "resend
 * verification email" action for an existing, already-onboarded account)
 * is untouched.
 */
export async function sendWelcomeVerification(
  userId: string,
  role: "SEEKER" | "EMPLOYER" | "ADMIN"
): Promise<void> {
  const issued = await issueEmailVerificationToken(userId);
  if (!issued) {
    return;
  }
  await sendWelcomeVerificationEmail({ to: issued.email, token: issued.token, role });
}

export async function verifyEmail(rawToken: string): Promise<{ userId: string }> {
  const tokenHash = hashVerificationToken(rawToken);

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { tokenHash } });
    assertTokenUsable(record, "EMAIL_VERIFY");

    // Same atomic compare-and-swap as resetPassword — see comment there.
    const consumed = await tx.verificationToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) {
      throw new ApiError(INVALID_OR_EXPIRED_MESSAGE, 400);
    }

    await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });

    return { userId: record.userId };
  });

  // Email verification feeds the "email" factor of the verification score
  // — no-ops for non-seeker accounts. Fire-and-forget: must never block the
  // verify-email flow.
  void recomputeVerificationScoreForUser(result.userId).catch((err) =>
    console.error("[credentials-recovery] verification score recompute failed:", err)
  );

  return result;
}
