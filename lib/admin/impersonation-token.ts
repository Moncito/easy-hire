import { getAuthSecret } from "@/lib/shared/auth-secret";

/**
 * Edge-safe signing/verification for the impersonation cookie
 * (docs/ADMIN-CONSOLE-PLAN.md §8.2). This module is imported by BOTH
 * `proxy.ts` (Edge Runtime) and `lib/admin/impersonation.ts` (Node), so it
 * must not import Prisma, `node:crypto`, or anything else Node-only — Web
 * Crypto (`crypto.subtle`) only, which is available in both runtimes.
 *
 * `getAuthSecret()` (lib/shared/auth-secret.ts) is already required to be
 * Edge-safe — `auth.config.ts` imports it for the exact same reason — so it
 * is reused here rather than inventing a second secret. The impersonation
 * cookie is a SEPARATE token from the NextAuth session JWT (its own
 * signature, its own short TTL — §8.2: "separate from the normal session
 * token"); it just happens to be signed with the same underlying secret,
 * the way NextAuth itself signs its JWT.
 *
 * IMPORTANT — what verifying this token does and does NOT prove:
 * `verifyImpersonationToken` proves the cookie's bytes were produced by us
 * (signature check) and that the TOKEN's own embedded expiry has not
 * passed. It does NOT prove the underlying `ImpersonationSession` row in
 * Postgres is still active — the admin may have ended the session early
 * (`endedAt` set) or lost the `impersonate` permission since the cookie was
 * issued, and neither of those is knowable from the token bytes alone. Only
 * `resolveActiveImpersonation` (lib/admin/impersonation.ts), which loads the
 * DB row and re-checks live permissions, is authoritative. This module's
 * verifier is exactly the "optimistic check" `proxy.ts` is allowed to make
 * per Next.js's own proxy docs ("should not be used as a full session
 * management or authorization solution").
 */

/** Single shared spelling for the cookie name — every consumer (route handlers, proxy.ts, the /lib resolver) imports this rather than re-typing the string. */
export const IMPERSONATION_COOKIE_NAME = "eh_impersonation";

export type ImpersonationTokenPayload = {
  /** `ImpersonationSession.id` — the only thing the token carries. Everything else (who, whom, ticket, reason, scope) lives in the DB row, looked up by this id. */
  sessionId: string;
  /** Epoch milliseconds. Mirrors `ImpersonationSession.expiresAt` at issuance time — see this module's doc comment for why this is a token-level check only, not the authoritative one. */
  expiresAt: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = getAuthSecret();
  if (!secret) {
    // Mirrors getAuthSecret's own contract: undefined only in production
    // with no AUTH_SECRET/NEXTAUTH_SECRET set, which is already a
    // deploy-time misconfiguration NextAuth itself cannot run under either.
    throw new Error("[impersonation-token] no AUTH_SECRET/NEXTAUTH_SECRET configured — cannot sign or verify impersonation tokens.");
  }
  const keyMaterial = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Signs `payload` into the opaque cookie value: `base64url(json) + "." + base64url(hmac)`. */
export async function signImpersonationToken(payload: ImpersonationTokenPayload): Promise<string> {
  const key = await getSigningKey();
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = base64UrlEncode(payloadBytes);
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBytes));
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies `raw` (the cookie value) and returns the embedded payload, or
 * `null` if the signature doesn't match, the shape is malformed, or the
 * token's own `expiresAt` has already passed. See this module's doc comment
 * for exactly what a non-null result does and does not prove.
 */
export async function verifyImpersonationToken(raw: string | undefined | null): Promise<ImpersonationTokenPayload | null> {
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getSigningKey();
    const signatureBytes = base64UrlDecode(signatureB64);
    // `signatureBytes` is a plain Uint8Array built by hand in
    // base64UrlDecode — @types/node's global Uint8Array override types it as
    // Uint8Array<ArrayBufferLike>, which lib.dom's BufferSource (expecting
    // Uint8Array<ArrayBuffer>) rejects at the type level even though it's a
    // valid ArrayBufferView at runtime. Cast, not a runtime concession.
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      new TextEncoder().encode(payloadB64)
    );
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const parsed = JSON.parse(payloadJson) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as ImpersonationTokenPayload).sessionId !== "string" ||
      typeof (parsed as ImpersonationTokenPayload).expiresAt !== "number"
    ) {
      return null;
    }

    const payload = parsed as ImpersonationTokenPayload;
    if (payload.expiresAt <= Date.now()) return null;

    return payload;
  } catch {
    // Malformed base64, JSON, or a crypto failure — treat exactly like an
    // invalid signature: fail closed, never throw out to the caller.
    return null;
  }
}
