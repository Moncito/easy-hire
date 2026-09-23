import { randomBytes } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import {
  encryptTotpSecret,
  decryptTotpSecret,
  generateTotpSecret,
  buildTotpUri,
  verifyTotpToken,
  generateCurrentTotpToken,
  normalizeRecoveryCode,
  generateRecoveryCodePlaintext,
  generateRecoveryCodes,
  hashRecoveryCode,
  findMatchingRecoveryCode,
  hasTwoFactorEnrollmentArtifact,
  classifyTwoFactorCodeInput,
} from "@/lib/auth/two-factor";

// getEncryptionKey() (lib/auth/two-factor.ts) is read fresh from
// process.env on every encrypt/decrypt call, not cached at import time — so
// tests can freely swap TOTP_ENCRYPTION_KEY per-`it` without any module
// reset gymnastics. Every test gets a valid key by default; individual
// tests override it to exercise the missing/wrong/invalid-length paths.
const VALID_KEY = randomBytes(32).toString("base64");

beforeEach(() => {
  process.env.TOTP_ENCRYPTION_KEY = VALID_KEY;
});

describe("encryptTotpSecret / decryptTotpSecret", () => {
  afterEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = VALID_KEY;
  });

  it("round-trips a secret through encrypt then decrypt", () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    expect(encrypted).not.toBe(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it("stores the ciphertext as iv:authTag:ciphertext, three base64 segments", () => {
    const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(() => Buffer.from(part, "base64")).not.toThrow();
    }
  });

  it("never reuses an IV across two encryptions of the same secret", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const a = encryptTotpSecret(secret);
    const b = encryptTotpSecret(secret);
    expect(a).not.toBe(b);
    expect(decryptTotpSecret(a)).toBe(secret);
    expect(decryptTotpSecret(b)).toBe(secret);
  });

  it("throws — rather than returning garbage — when decrypted with the wrong key", () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret);

    process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptTotpSecret(encrypted)).toThrow();
  });

  it("throws when TOTP_ENCRYPTION_KEY is missing entirely", () => {
    delete process.env.TOTP_ENCRYPTION_KEY;
    expect(() => encryptTotpSecret("JBSWY3DPEHPK3PXP")).toThrow(/TOTP_ENCRYPTION_KEY is not set/);
  });

  it("throws when TOTP_ENCRYPTION_KEY doesn't decode to 32 bytes", () => {
    process.env.TOTP_ENCRYPTION_KEY = Buffer.from("too-short").toString("base64");
    expect(() => encryptTotpSecret("JBSWY3DPEHPK3PXP")).toThrow(/32 bytes/);
  });

  it("never silently falls back to plaintext storage when the key is bad", () => {
    process.env.TOTP_ENCRYPTION_KEY = "";
    let threw = false;
    let result: string | undefined;
    try {
      result = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });
});

describe("buildTotpUri", () => {
  it("embeds the EasyHire issuer and the user's email as the label", () => {
    const secret = generateTotpSecret();
    const uri = buildTotpUri(secret, "seeker@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(decodeURIComponent(uri)).toContain("EasyHire");
    expect(decodeURIComponent(uri)).toContain("seeker@example.com");
  });
});

describe("verifyTotpToken", () => {
  it("accepts a code generated for the current time step", async () => {
    const secret = generateTotpSecret();
    const token = await generateCurrentTotpToken(secret);
    await expect(verifyTotpToken(secret, token)).resolves.toBe(true);
  });

  it("rejects a wrong code", async () => {
    const secret = generateTotpSecret();
    const token = await generateCurrentTotpToken(secret);
    const wrongToken = token === "000000" ? "111111" : "000000";
    await expect(verifyTotpToken(secret, wrongToken)).resolves.toBe(false);
  });

  it("rejects a code generated for a different secret", async () => {
    const secretA = generateTotpSecret();
    const secretB = generateTotpSecret();
    const tokenForB = await generateCurrentTotpToken(secretB);
    await expect(verifyTotpToken(secretA, tokenForB)).resolves.toBe(false);
  });

  it("rejects malformed input without ever calling into otplib (non-6-digit, non-numeric)", async () => {
    const secret = generateTotpSecret();
    await expect(verifyTotpToken(secret, "12345")).resolves.toBe(false);
    await expect(verifyTotpToken(secret, "1234567")).resolves.toBe(false);
    await expect(verifyTotpToken(secret, "abcdef")).resolves.toBe(false);
    await expect(verifyTotpToken(secret, "")).resolves.toBe(false);
  });
});

describe("normalizeRecoveryCode", () => {
  it("is case-, whitespace-, and dash-insensitive", () => {
    expect(normalizeRecoveryCode("AbCd1-23ef4")).toBe(normalizeRecoveryCode(" abcd123ef4 "));
    expect(normalizeRecoveryCode("abcd1-23ef4")).toBe("abcd123ef4");
  });
});

describe("generateRecoveryCodePlaintext / generateRecoveryCodes", () => {
  it("generates codes in XXXXX-XXXXX hex form", () => {
    const code = generateRecoveryCodePlaintext();
    expect(code).toMatch(/^[0-9a-f]{5}-[0-9a-f]{5}$/);
  });

  it("generates 10 unique codes by default", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("supports a custom count", () => {
    expect(generateRecoveryCodes(3)).toHaveLength(3);
  });
});

describe("findMatchingRecoveryCode (single-use consumption)", () => {
  it("matches an unused code by its hash", async () => {
    const plain = generateRecoveryCodePlaintext();
    const codeHash = await hashRecoveryCode(plain);
    const records = [{ id: "code-1", codeHash, usedAt: null }];

    const match = await findMatchingRecoveryCode(records, plain);
    expect(match?.id).toBe("code-1");
  });

  it("matches regardless of casing/dash formatting in the user's input", async () => {
    const plain = generateRecoveryCodePlaintext();
    const codeHash = await hashRecoveryCode(plain);
    const records = [{ id: "code-1", codeHash, usedAt: null }];

    const match = await findMatchingRecoveryCode(records, plain.toUpperCase().replace("-", " "));
    expect(match?.id).toBe("code-1");
  });

  it("never matches an already-used code — single-use enforcement", async () => {
    const plain = generateRecoveryCodePlaintext();
    const codeHash = await hashRecoveryCode(plain);
    const records = [{ id: "code-1", codeHash, usedAt: new Date() }];

    const match = await findMatchingRecoveryCode(records, plain);
    expect(match).toBeNull();
  });

  it("returns null for a code that doesn't match any stored hash", async () => {
    const plain = generateRecoveryCodePlaintext();
    const codeHash = await hashRecoveryCode(plain);
    const records = [{ id: "code-1", codeHash, usedAt: null }];

    const match = await findMatchingRecoveryCode(records, generateRecoveryCodePlaintext());
    expect(match).toBeNull();
  });

  it("compares with bcrypt, never plain string equality — a raw codeHash string is not itself a match", async () => {
    const plain = generateRecoveryCodePlaintext();
    const codeHash = await hashRecoveryCode(plain);
    const records = [{ id: "code-1", codeHash, usedAt: null }];

    const match = await findMatchingRecoveryCode(records, codeHash);
    expect(match).toBeNull();
  });

  it("finds the correct record among several, skipping used ones", async () => {
    const usedPlain = generateRecoveryCodePlaintext();
    const targetPlain = generateRecoveryCodePlaintext();
    const otherPlain = generateRecoveryCodePlaintext();

    const records = [
      { id: "used", codeHash: await hashRecoveryCode(usedPlain), usedAt: new Date() },
      { id: "target", codeHash: await hashRecoveryCode(targetPlain), usedAt: null },
      { id: "other", codeHash: await hashRecoveryCode(otherPlain), usedAt: null },
    ];

    const match = await findMatchingRecoveryCode(records, targetPlain);
    expect(match?.id).toBe("target");
  });
});

describe("hashRecoveryCode", () => {
  it("produces a bcrypt hash, not the plaintext code", async () => {
    const plain = generateRecoveryCodePlaintext();
    const hash = await hashRecoveryCode(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("is verifiable with bcrypt.compare against the normalized plaintext", async () => {
    const plain = generateRecoveryCodePlaintext();
    const hash = await hashRecoveryCode(plain);
    await expect(bcrypt.compare(normalizeRecoveryCode(plain), hash)).resolves.toBe(true);
  });
});

// hasTwoFactorEnrollmentArtifact gates both disableTwoFactor (self-serve,
// lib/auth/two-factor.ts) and disableTwoFactorForSupport (the admin support
// path, called from lib/admin/users.ts's performUserSupportAction) — it is
// the one place that decides "does this account have anything to clear."
describe("hasTwoFactorEnrollmentArtifact", () => {
  it("is false for an account with neither a secret nor an enabled timestamp — the no-op case", () => {
    expect(hasTwoFactorEnrollmentArtifact({ totpSecret: null, totpEnabledAt: null })).toBe(false);
  });

  it("is true for a fully confirmed enrollment (secret + enabledAt)", () => {
    expect(
      hasTwoFactorEnrollmentArtifact({ totpSecret: "encrypted", totpEnabledAt: new Date() })
    ).toBe(true);
  });

  it("is true for an abandoned, never-confirmed enrollment (secret set, enabledAt null)", () => {
    expect(hasTwoFactorEnrollmentArtifact({ totpSecret: "encrypted", totpEnabledAt: null })).toBe(true);
  });

  it("is true for the (shouldn't-happen-but-defend-anyway) case of enabledAt set with no secret", () => {
    expect(hasTwoFactorEnrollmentArtifact({ totpSecret: null, totpEnabledAt: new Date() })).toBe(true);
  });
});

// "confirm rejects a bad code without enabling" — confirmTwoFactor's enable
// branch (lib/auth/two-factor.ts) is gated entirely on verifyTotpToken's
// boolean result; a false here is exactly what stops confirmTwoFactor from
// setting totpEnabledAt or generating recovery codes. The DB-touching
// confirmTwoFactor/enrollTwoFactor/disableTwoFactor functions themselves
// aren't exercised in this file — this codebase has no Prisma-mocking test
// harness (see lib/account/change-password.test.ts and
// lib/account/account-deletion.test.ts, which likewise only unit-test the
// pure guards their DB-touching functions depend on, not the DB path
// itself).
// classifyTwoFactorCodeInput is what Auth.ts's authorize() (Phase 2) uses
// to decide whether a login-time 2FA input should go to verifyTotpCode or
// consumeRecoveryCode, without trying both blindly.
describe("classifyTwoFactorCodeInput", () => {
  it("classifies a bare 6-digit string as totp", () => {
    expect(classifyTwoFactorCodeInput("123456")).toBe("totp");
    expect(classifyTwoFactorCodeInput("000000")).toBe("totp");
  });

  it("classifies a canonical xxxxx-xxxxx hex recovery code as recovery", () => {
    expect(classifyTwoFactorCodeInput("abcde-12345")).toBe("recovery");
  });

  it("classifies a recovery code regardless of casing, spacing, or missing dash", () => {
    expect(classifyTwoFactorCodeInput("ABCDE-12345")).toBe("recovery");
    expect(classifyTwoFactorCodeInput(" abcde 12345 ")).toBe("recovery");
    expect(classifyTwoFactorCodeInput("abcde12345")).toBe("recovery");
  });

  it("never classifies a 6-digit code as a recovery code, even though digits are valid hex", () => {
    // Would-be ambiguous input: 6 digits could theoretically also satisfy a
    // relaxed hex check, but the shape rule is exact-length-6 => totp first.
    expect(classifyTwoFactorCodeInput("123456")).not.toBe("recovery");
  });

  it("rejects a 5-digit string (too short to be either shape)", () => {
    expect(classifyTwoFactorCodeInput("12345")).toBe("unrecognized");
  });

  it("rejects a 7-digit string (too long to be a totp code)", () => {
    expect(classifyTwoFactorCodeInput("1234567")).toBe("unrecognized");
  });

  it("rejects non-numeric input that isn't 10 hex characters either", () => {
    expect(classifyTwoFactorCodeInput("abcdef")).toBe("unrecognized");
    expect(classifyTwoFactorCodeInput("not-a-code-at-all")).toBe("unrecognized");
  });

  it("rejects an empty string", () => {
    expect(classifyTwoFactorCodeInput("")).toBe("unrecognized");
  });

  it("rejects a recovery-shaped string containing a non-hex character", () => {
    expect(classifyTwoFactorCodeInput("zzzzz-11111")).toBe("unrecognized");
  });

  it("classifies a real generated recovery code plaintext as recovery", () => {
    const plain = generateRecoveryCodePlaintext();
    expect(classifyTwoFactorCodeInput(plain)).toBe("recovery");
  });
});

describe("confirm gate — wrong code never satisfies the enable condition", () => {
  it("a code for a different secret cannot pass the gate confirmTwoFactor relies on", async () => {
    const enrolledSecret = generateTotpSecret();
    const attackerSecret = generateTotpSecret();
    const attackerToken = await generateCurrentTotpToken(attackerSecret);

    const wouldEnable = await verifyTotpToken(enrolledSecret, attackerToken);
    expect(wouldEnable).toBe(false);
  });

  it("the same code, decrypted from its stored ciphertext, does pass the gate", async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    const token = await generateCurrentTotpToken(secret);

    const decrypted = decryptTotpSecret(encrypted);
    await expect(verifyTotpToken(decrypted, token)).resolves.toBe(true);
  });
});
