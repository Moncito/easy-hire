import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";

export const getSession = cache(async () => auth());

export type AdminPageContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  userId: string;
};

export async function requireAdminLayoutContext() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return { session, userId: session.user.id };
}

/** Layout + pages: ensures admin is signed in. */
export async function requireAdminPageContext(): Promise<AdminPageContext> {
  const ctx = await requireAdminLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}
