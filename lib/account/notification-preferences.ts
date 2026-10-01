import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

/**
 * The three email opt-outs on `User` (Sprint 12). These gate EMAIL only —
 * see lib/shared/email-preferences.ts for the category rule these flags
 * feed, and the `User.notifyMessages` schema comment for why the matching
 * `notifications` row is never affected.
 */
export type NotificationPreferences = {
  notifyMessages: boolean;
  notifyApplicationUpdates: boolean;
  notifyProductDigest: boolean;
};

/** A PATCH may touch just one toggle — every field is optional here. */
export type NotificationPreferencesUpdate = Partial<NotificationPreferences>;

const PREFERENCES_SELECT = {
  notifyMessages: true,
  notifyApplicationUpdates: true,
  notifyProductDigest: true,
} as const;

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PREFERENCES_SELECT });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  return user;
}

export async function updateNotificationPreferences(
  userId: string,
  update: NotificationPreferencesUpdate
): Promise<NotificationPreferences> {
  return prisma.user.update({
    where: { id: userId },
    data: update,
    select: PREFERENCES_SELECT,
  });
}

/**
 * Lazily issues an unsubscribe token the first time one is actually needed
 * — a digest is about to send this user mail — rather than backfilling
 * every existing row up front (see the `unsubscribeToken` schema comment).
 *
 * Deliberately not hashed like createVerificationToken (lib/auth/
 * credentials-recovery.ts): that token grants a one-time state change
 * (password reset, email verify) and is looked up by comparing a hash, so a
 * DB leak can't be replayed. This token only ever flips notifyProductDigest
 * off — it grants no access and exposes no data — and it must stay valid
 * for repeat clicks (a mail client can retry a one-click unsubscribe), so
 * there's nothing to consume and nothing worth hashing at rest. Same CSPRNG
 * (32 bytes via crypto.randomBytes) as createVerificationToken, just stored
 * as-is for direct equality lookup.
 */
export async function getOrCreateUnsubscribeToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { unsubscribeToken: true } });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (user.unsubscribeToken) {
    return user.unsubscribeToken;
  }

  const token = randomBytes(32).toString("base64url");
  await prisma.user.update({ where: { id: userId }, data: { unsubscribeToken: token } });
  return token;
}

/**
 * Unsubscribe-by-token — the one flow that must work for a logged-out
 * recipient (a mail client's one-click unsubscribe never carries a
 * session). Turns off notifyProductDigest only; never touches the other two
 * preferences, and never confirms or denies whether the token exists — an
 * unrecognized token silently matches zero rows, and the caller (the API
 * route) returns the identical response either way so this can't be used to
 * probe for valid tokens.
 */
export async function unsubscribeByToken(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  await prisma.user.updateMany({
    where: { unsubscribeToken: trimmed },
    data: { notifyProductDigest: false },
  });
}
