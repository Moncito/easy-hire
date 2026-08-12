import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";

export const getSession = cache(async () => auth());

export type SeekerPageContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  userId: string;
};

export async function requireSeekerLayoutContext() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "SEEKER") {
    return null;
  }

  return { session, userId: session.user.id };
}

/** Layout + pages: ensures seeker is signed in. */
export async function requireSeekerPageContext(): Promise<SeekerPageContext> {
  const ctx = await requireSeekerLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}
