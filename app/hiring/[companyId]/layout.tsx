import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
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

  // Load branding here (access already verified) so the topbar renders the
  // company name/logo on first paint instead of flashing it in after a client
  // fetch.
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { companyName: true, logoUrl: true, verifiedStatus: true },
  });

  return (
    <WorkspaceForRole companyId={companyId} role={membership.role} branding={company}>
      {children}
    </WorkspaceForRole>
  );
}
