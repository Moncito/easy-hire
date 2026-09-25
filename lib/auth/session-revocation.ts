import { createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * SESSION REVOCATION FOR JWT SESSIONS
 * ===================================
 * Auth.ts uses `session: { strategy: "jwt" }` with no Session table, so a
 * token can't be deleted server-side. Instead each token carries
 * `sessionIssuedAt` (stamped at sign-in), and each user row carries
 * `sessionsValidAfter`. The jwt callback rejects any token issued before the
 * cutoff, which clears the cookie and ends that session.
 *
 * The check piggybacks on the jwt callback's existing periodic DB refresh
 * (ROLE_REFRESH_MS in Auth.ts), so a revoked device is signed out within
 * that window rather than on its very next request. The UI says so.
 *
 * Keeping the device that asked: stamping the cutoff revokes every token,
 * including the one making the request. `keepCurrentSession`
 * (lib/auth/keep-current-session.ts) re-issues the caller's token through
 * Auth.js's server-side `unstable_update`, carrying an HMAC proof bound to
 * the user and the exact cutoff. The client can also trigger an update
 * (POST /api/auth/session), so the proof is what distinguishes the server's
 * re-issue from a stale token trying to renew itself. The proof never
 * leaves the server.
 */

/** Pure — no DB. A token without `sessionIssuedAt` predates this feature and is treated as issued at the epoch. */
export function isSessionRevoked(sessionIssuedAt: number | undefined, sessionsValidAfter: Date | null): boolean {
  if (!sessionsValidAfter) return false;
  return (sessionIssuedAt ?? 0) < sessionsValidAfter.getTime();
}

function reissueSecret(): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET is required to re-issue a session.");
  return secret;
}

export function sessionReissueProof(userId: string, sessionsValidAfter: Date): string {
  return createHmac("sha256", reissueSecret())
    .update(`session-reissue:${userId}:${sessionsValidAfter.getTime()}`)
    .digest("hex");
}

export function verifySessionReissueProof(userId: string, sessionsValidAfter: Date, proof: unknown): boolean {
  if (typeof proof !== "string") return false;
  const expected = Buffer.from(sessionReissueProof(userId, sessionsValidAfter), "hex");
  const received = Buffer.from(proof, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Stamps the cutoff and returns it. Accepts a transaction client so password
 * reset can revoke in the same transaction that swaps the hash.
 */
export async function revokeSessions(
  userId: string,
  db: Prisma.TransactionClient = prisma
): Promise<Date> {
  const sessionsValidAfter = new Date();
  await db.user.update({ where: { id: userId }, data: { sessionsValidAfter } });
  return sessionsValidAfter;
}
