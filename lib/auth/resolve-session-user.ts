import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  email?: string | null;
};

/** Resolve a Prisma user id from session fields. Handles stale OAuth UUIDs in JWT. */
export async function resolveSessionUserId(user: SessionUser): Promise<string | null> {
  const byId = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });
  if (byId) return byId.id;

  if (user.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }

  return null;
}
