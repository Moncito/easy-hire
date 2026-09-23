import { prisma } from "@/lib/prisma";

export type AccountSettingsContext = {
  /** Credentials account (true) vs Google-only (false) — decides whether the
   *  security panel offers "change password" or "set a password", and which
   *  re-auth control the delete form renders. */
  hasPassword: boolean;
  email: string;
  avatarUrl: string | null;
  /** Null means unverified — drives the "Email verified" badge on the profile card. */
  emailVerifiedAt: Date | null;
  /**
   * Null means "never recorded", not "never changed" — accounts predating
   * the column have no known date. Consumers must render that as unknown
   * rather than inventing an age.
   */
  passwordChangedAt: Date | null;
};

/**
 * Everything the settings page needs about the signed-in account, in one
 * query. Pages are barred from importing Prisma directly (see the
 * `no-restricted-imports` rule in eslint.config.mjs), and this also replaces
 * what was a separate `accountHasPassword` round trip — the same row already
 * carries the email and avatar.
 */
export async function getAccountSettingsContext(
  userId: string
): Promise<AccountSettingsContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      avatarUrl: true,
      passwordHash: true,
      emailVerifiedAt: true,
      passwordChangedAt: true,
    },
  });

  if (!user) return null;

  return {
    hasPassword: Boolean(user.passwordHash),
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt,
    passwordChangedAt: user.passwordChangedAt,
  };
}
