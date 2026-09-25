import { unstable_update } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { sessionReissueProof } from "@/lib/auth/session-revocation";

/**
 * Re-issues the calling device's session cookie so it survives a revocation
 * the same user just triggered (password change, "Sign out of other
 * devices"). Must run in a Route Handler or Server Action — it writes the
 * cookie through next/headers. Kept apart from session-revocation.ts because
 * Auth.ts imports that module, and this one imports Auth.ts.
 */
export async function keepCurrentSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionsValidAfter: true },
  });
  if (!user?.sessionsValidAfter) return;

  // `unstable_update`'s type only admits Session fields; the jwt callback in
  // Auth.ts reads `sessionReissue` off the raw update payload.
  await unstable_update({
    sessionReissue: sessionReissueProof(userId, user.sessionsValidAfter),
  } as Parameters<typeof unstable_update>[0]);
}
