import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { generate as generateTotpToken, generateSecret as generateTotpSecretRaw, generateURI, verify as verifyTotp } from "otplib";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

/**
 * TOTP TWO-FACTOR — PHASE 1 (enrollment storage only)
 * ======================================================
 * See docs/two-factor-auth-plan.md for the full design. Phase 1 covers
 * enroll -> confirm -> view recovery codes -> disable. `Auth.ts` is
 * deliberately untouched by this module and by every caller of it: nothing
 * here is wired into `authorize()` yet, so `totpEnabledAt` being set has no
 * effect on sign-in until Phase 2 gets its own explicit sign-off.
 *
 * `verifyTotpCode` and `consumeRecoveryCode` near the bottom are exported
 * for that future Phase 2 to call — nothing in this codebase invokes them
 * yet, but they're covered by tests now so Phase 2 isn't the first time
 * they run.
 */

// ============================================================================
// Encryption — AES-256-GCM, key from TOTP_ENCRYPTION_KEY
// ============================================================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
// 12 bytes is the NIST-recommended (and Node default) nonce length for GCM —
// using the cipher's own IV_LENGTH would also work, but this is explicit.
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32; // AES-256

/**
 * Loads and validates `TOTP_ENCRYPTION_KEY` on every call rather than once
 * at module scope. That's deliberate: this module is imported by the status
 * route too (GET, no encryption involved), and a missing key must not break
 * every importer at process boot — it must fail loudly and immediately, but
 * only at the moment something actually tries to encrypt or decrypt a
 * secret. There is no fallback branch here of any kind: a missing key, a
 * key that isn't valid base64, or a key that doesn't decode to exactly 32
 * bytes all throw. A silently-accepted shorter/guessable key, or a silent
 * plaintext fallback, would be worse than shipping no 2FA at all — see
 * docs/two-factor-auth-plan.md §2.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` (see .env.example) " +
        "and set it before enrolling, confirming, or verifying any TOTP secret."
    );
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("TOTP_ENCRYPTION_KEY is not valid base64. Regenerate it with `openssl rand -base64 32`.");
  }

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `TOTP_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes for AES-256-GCM (got ${key.length}). ` +
        "Regenerate it with `openssl rand -base64 32`."
    );
  }

  return key;
}

/**
 * Encrypts a plaintext TOTP secret for storage in `User.totpSecret`.
 * Format: `<iv>:<authTag>:<ciphertext>`, each segment base64, so a single
 * TEXT column can hold everything needed to decrypt later. Random IV per
 * call — GCM's security guarantees depend on never reusing an IV under the
 * same key.
 */
export function encryptTotpSecret(plainSecret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/**
 * Decrypts a value produced by `encryptTotpSecret`. GCM's auth tag makes
 * this fail loudly (throw) rather than return garbage bytes when the key is
 * wrong or the ciphertext was tampered with — there is no code path here
 * that can return a plausible-looking wrong secret.
 */
export function decryptTotpSecret(stored: string): string {
  const key = getEncryptionKey();
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted TOTP secret — expected `<iv>:<authTag>:<ciphertext>`.");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  // Throws "Unsupported state or unable to authenticate data" on a wrong
  // key or corrupted ciphertext — that's GCM's tag check, not a bug.
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

// ============================================================================
// TOTP secret / token — thin wrappers around otplib's functional API
// ============================================================================

const TOTP_ISSUER = "EasyHire";
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;

/** Base32-encoded, 20 random bytes (otplib's default) — never stored raw, only through encryptTotpSecret. */
export function generateTotpSecret(): string {
  return generateTotpSecretRaw();
}

/** `otpauth://` URI for QR rendering. Label is the user's own email so it's recognisable inside an authenticator app next to other accounts. */
export function buildTotpUri(secret: string, email: string): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
  });
}

/**
 * One time step of drift tolerance, in seconds — otplib v13's
 * `epochTolerance` is measured in seconds, not steps.
 *
 * otplib v13's actual default is `0`, meaning an exact step match and no
 * tolerance at all. That is unusable in practice: a code read at second 29
 * and submitted at second 31 falls in the next step and is rejected even
 * with a perfectly correct clock, before considering real device drift.
 *
 * RFC 6238 §5.2 recommends accepting at most one step, which is what this
 * is. The trade is explicit — a stolen code stays valid for up to ~90s
 * rather than ~30s. Do not widen further; every extra step enlarges that
 * window for no usability gain.
 */
const TOTP_EPOCH_TOLERANCE_SECONDS = TOTP_PERIOD_SECONDS;

/** Verifies a 6-digit code against a (decrypted, plaintext) secret. */
export async function verifyTotpToken(secret: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  const result = await verifyTotp({
    secret,
    token,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    epochTolerance: TOTP_EPOCH_TOLERANCE_SECONDS,
  });
  return result.valid;
}

/** Test/tooling helper — generates a currently-valid code for a given secret. Not used by any enroll/confirm/disable flow, which only ever verify user-supplied codes. */
export async function generateCurrentTotpToken(secret: string): Promise<string> {
  return generateTotpToken({ secret, digits: TOTP_DIGITS, period: TOTP_PERIOD_SECONDS });
}

// ============================================================================
// Recovery codes
// ============================================================================

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 5; // 5 bytes -> 10 hex chars, formatted XXXXX-XXXXX
// Same cost factor changePassword/resetPassword already use for password
// hashes (lib/account/change-password.ts, lib/auth/credentials-recovery.ts)
// — recovery codes are credentials in exactly the same sense.
const RECOVERY_CODE_BCRYPT_COST = 10;

/** Normalizes user input before hashing/comparing: case- and whitespace-insensitive, dash-insensitive. */
export function normalizeRecoveryCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "");
}

/** One plaintext recovery code, same CSPRNG (`crypto.randomBytes`) as `createVerificationToken` in lib/auth/credentials-recovery.ts. */
export function generateRecoveryCodePlaintext(): string {
  const raw = randomBytes(RECOVERY_CODE_BYTES).toString("hex");
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => generateRecoveryCodePlaintext());
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(normalizeRecoveryCode(code), RECOVERY_CODE_BCRYPT_COST);
}

export type RecoveryCodeRecord = { id: string; codeHash: string; usedAt: Date | null };

/**
 * Pure matcher — no DB access, so it's directly unit-testable with
 * fabricated records (same rationale as `assertCanDeleteOwnedCompany` in
 * lib/account/account-deletion.ts). Compares with bcrypt's own
 * constant-time compare, never string equality, and skips already-used
 * codes so a spent code can never match twice. Callers still need their
 * own DB-level compare-and-swap (`updateMany({ where: { usedAt: null } })`)
 * to make consumption atomic under concurrent requests — see
 * `consumeRecoveryCode` below, mirroring `resetPassword`'s token consume in
 * lib/auth/credentials-recovery.ts.
 */
export async function findMatchingRecoveryCode(
  records: RecoveryCodeRecord[],
  code: string
): Promise<RecoveryCodeRecord | null> {
  const normalized = normalizeRecoveryCode(code);
  for (const record of records) {
    if (record.usedAt) continue;
    const matches = await bcrypt.compare(normalized, record.codeHash);
    if (matches) return record;
  }
  return null;
}

// ============================================================================
// Enroll / confirm / disable / status — the actual DB-touching flows
// ============================================================================

export type EnrollTwoFactorResult = {
  otpauthUri: string;
  qrCodeDataUrl: string;
};

/**
 * Generates a secret, encrypts and stores it, returns the `otpauth://` URI
 * and a scannable QR data URL. Deliberately does NOT set `totpEnabledAt` —
 * see docs/two-factor-auth-plan.md §2.3: enabling at generation time is how
 * users lock themselves out mid-setup. `confirmTwoFactor` is the only
 * function that may set it.
 *
 * Refuses outright if the account already has `totpEnabledAt` set, so a
 * stray call can't silently replace a working secret out from under a user
 * — they must disable first. Re-calling this while an enrollment is
 * unconfirmed (`totpSecret` set, `totpEnabledAt` still null) is allowed and
 * simply overwrites the abandoned secret, since nothing depended on it yet.
 */
export async function enrollTwoFactor(userId: string): Promise<EnrollTwoFactorResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, totpEnabledAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (user.totpEnabledAt) {
    throw new ApiError(
      "Two-factor authentication is already enabled. Disable it before re-enrolling.",
      409
    );
  }

  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret);

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encrypted },
  });

  const otpauthUri = buildTotpUri(secret, user.email);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

  return { otpauthUri, qrCodeDataUrl };
}

export type ConfirmTwoFactorResult = {
  recoveryCodes: string[];
};

/**
 * Verifies a 6-digit code against the secret stored by `enrollTwoFactor`.
 * Only on success: sets `totpEnabledAt`, replaces any existing recovery
 * codes with a fresh set of 10, and returns them in plaintext — the only
 * place they are ever returned. Everywhere else, only `codeHash` exists.
 */
export async function confirmTwoFactor(userId: string, code: string): Promise<ConfirmTwoFactorResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (user.totpEnabledAt) {
    throw new ApiError("Two-factor authentication is already enabled.", 409);
  }
  if (!user.totpSecret) {
    throw new ApiError("Start enrollment before confirming a code.", 400);
  }

  const secret = decryptTotpSecret(user.totpSecret);
  const isValid = await verifyTotpToken(secret, code);
  if (!isValid) {
    throw new ApiError("Incorrect code. Check the time on your device and try again.", 400);
  }

  const plaintextCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(plaintextCodes.map((plain) => hashRecoveryCode(plain)));

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { totpEnabledAt: new Date() } });
    // Replace, not append — confirm only ever runs once per enrollment, but
    // this keeps the operation idempotent/safe if it's ever retried.
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.twoFactorRecoveryCode.createMany({
      data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
    });
  });

  return { recoveryCodes: plaintextCodes };
}

export type DisableTwoFactorCredentials = {
  /** Current password — same re-auth credential change-password/account-deletion already use. */
  password?: string;
  /** A valid TOTP code, as an alternative when the caller doesn't want to (re-)enter their password. */
  code?: string;
};

/**
 * Re-authentication for disable — mirrors `assertReauthenticated` in
 * lib/account/account-deletion.ts (same "throw ApiError, don't return a
 * boolean" shape), but offers a second path account-deletion doesn't need:
 * a valid TOTP code, since a user disabling 2FA because they still have
 * their authenticator app is a real, common case and forcing a password
 * re-entry on top adds no security value there.
 */
async function assertReauthenticatedForDisable(
  user: { passwordHash: string | null; totpSecret: string | null },
  credentials: DisableTwoFactorCredentials
): Promise<void> {
  if (credentials.password) {
    if (!user.passwordHash) {
      throw new ApiError("This account has no password set.", 400);
    }
    const valid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!valid) {
      throw new ApiError("Incorrect password.", 401);
    }
    return;
  }

  if (credentials.code) {
    if (!user.totpSecret) {
      throw new ApiError("Two-factor authentication is not enrolled.", 400);
    }
    const secret = decryptTotpSecret(user.totpSecret);
    const valid = await verifyTotpToken(secret, credentials.code);
    if (!valid) {
      throw new ApiError("Incorrect code.", 401);
    }
    return;
  }

  throw new ApiError("Enter your current password or a 2FA code to continue.", 400);
}

/**
 * Disables 2FA: clears `totpSecret` and `totpEnabledAt`, and deletes the
 * user's recovery codes, after re-authentication succeeds. Also allowed
 * when enrollment was never confirmed (`totpSecret` set, `totpEnabledAt`
 * null) — lets a user cancel an abandoned enrollment, not just a completed
 * one.
 */
export async function disableTwoFactor(
  userId: string,
  credentials: DisableTwoFactorCredentials
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, totpSecret: true, totpEnabledAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (!user.totpSecret && !user.totpEnabledAt) {
    throw new ApiError("Two-factor authentication is not enabled.", 400);
  }

  await assertReauthenticatedForDisable(user, credentials);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabledAt: null } });
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
  });
}

export type TwoFactorStatus = {
  enabled: boolean;
  unusedRecoveryCodeCount: number;
};

/** Never returns the secret or any code — just enough for the settings UI to render enrolled/not-enrolled and "N recovery codes remaining". */
export async function getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabledAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const unusedRecoveryCodeCount = await prisma.twoFactorRecoveryCode.count({
    where: { userId, usedAt: null },
  });

  return { enabled: Boolean(user.totpEnabledAt), unusedRecoveryCodeCount };
}

// ============================================================================
// Phase 2 exports — unused today, needed once `Auth.ts` starts enforcing
// ============================================================================

/**
 * Verifies a code against a user's stored, confirmed secret. Returns
 * `false` (never throws) for "not enrolled" as well as "wrong code" — a
 * login-time caller shouldn't need to distinguish those, and throwing would
 * make `authorize()` handle two different error shapes for what is, from
 * the login form's perspective, the same outcome: access denied.
 *
 * Not called anywhere yet — Phase 2 wires this into `Auth.ts`'s
 * `authorize()`. See docs/two-factor-auth-plan.md §6.
 */
export async function verifyTotpCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });
  if (!user?.totpEnabledAt || !user.totpSecret) {
    return false;
  }
  const secret = decryptTotpSecret(user.totpSecret);
  return verifyTotpToken(secret, code);
}

/**
 * Finds an unused recovery code matching `code`, marks it used, and returns
 * whether it worked. Single-use: the `updateMany({ where: { usedAt: null
 * } })` is a compare-and-swap at the row level, same pattern as
 * `resetPassword`'s token consume in lib/auth/credentials-recovery.ts — two
 * concurrent requests racing the same code can't both succeed.
 *
 * Not called anywhere yet — Phase 2 wires this into `Auth.ts`'s
 * `authorize()` as the "lost my phone" fallback. See
 * docs/two-factor-auth-plan.md §6.
 */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const records = await prisma.twoFactorRecoveryCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true, usedAt: true },
  });

  const match = await findMatchingRecoveryCode(records, code);
  if (!match) {
    return false;
  }

  const result = await prisma.twoFactorRecoveryCode.updateMany({
    where: { id: match.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return result.count === 1;
}
