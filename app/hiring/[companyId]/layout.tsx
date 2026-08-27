import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import WorkspaceForRole from "@/components/workspaces/WorkspaceForRole";

export default async function HiringCompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect("/login");

  const membership = await requireCompanyMembership(companyId, session.user.id, "team:read").catch(() => null);
  if (!membership) redirect("/hiring");

  return (
    <WorkspaceForRole companyId={companyId} role={membership.role}>
      {children}
    </WorkspaceForRole>
  );
}
