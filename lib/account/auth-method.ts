import { prisma } from "@/lib/prisma";

/**
 * Whether this account signs in with a password (Credentials) or is
 * Google-only. Account deletion re-authenticates differently for each
 * (see `assertReauthenticated` in lib/account/account-deletion.ts), and the
 * settings UI needs to know which control to render — components/ and
 * page.tsx files are both barred from importing Prisma directly by
 * eslint.config.mjs, so the lookup lives here.
 */
export async function accountHasPassword(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return Boolean(user?.passwordHash);
}
