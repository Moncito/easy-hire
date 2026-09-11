import { recordEvent, type ActorType } from "@/lib/admin/events";

/**
 * Small `/lib` seam so `Auth.ts` (NextAuth config, not `/lib` business
 * logic — see CLAUDE.md) can still satisfy the "call recordEvent from /lib"
 * rule for the three session-lifecycle events that only NextAuth ever
 * observes: `USER_LOGGED_IN`, `USER_LOGIN_FAILED`, `USER_LOGGED_OUT`. Every
 * other §7.1 event is recorded directly from the `/lib` function performing
 * the action.
 */

/** Shared role→actorType mapping — exported so other /lib callers that already have a User.role in hand (e.g. lib/auth/credentials-recovery.ts) don't redefine it. */
export function actorTypeForRole(role: string | null | undefined): ActorType {
  if (role === "SEEKER" || role === "EMPLOYER" || role === "ADMIN") return role;
  return "SYSTEM";
}

/** Fires from the `events.signIn` NextAuth callback — covers both Credentials and Google providers. */
export function recordUserLoggedIn(userId: string, role: string | null | undefined): void {
  recordEvent({
    eventType: "USER_LOGGED_IN",
    actorType: actorTypeForRole(role),
    userId,
  });
}

/**
 * Fires from inside the Credentials provider's `authorize()` on a failed
 * attempt (unknown email, no password set, or wrong password). `userId`/
 * `role` are only passed when the email matched an existing account — no
 * email, name, or other PII is ever recorded, only the account's own id.
 */
export function recordUserLoginFailed(userId?: string, role?: string | null): void {
  recordEvent({
    eventType: "USER_LOGIN_FAILED",
    actorType: userId ? actorTypeForRole(role) : "SYSTEM",
    userId,
  });
}

/** Fires from the `events.signOut` NextAuth callback. */
export function recordUserLoggedOut(userId: string | undefined, role: string | null | undefined): void {
  recordEvent({
    eventType: "USER_LOGGED_OUT",
    actorType: actorTypeForRole(role),
    userId,
  });
}
