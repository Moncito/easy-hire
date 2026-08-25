import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getCollaborativeReportsData } from "@/lib/collaborative-reports";
import CollaboratorReportsBoard from "@/components/hiring/CollaboratorReportsBoard";

export default async function CollaborativeReportsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/reports`)}`);
  const data = await getCollaborativeReportsData(companyId, session.user.id);
  return (
    <CollaboratorReportsBoard
      companyId={companyId}
      role={data.membership.role}
      analytics={data.analytics}
      chartData={data.chartData}
      exclusive={data.exclusive}
      performanceRows={data.performanceRows}
    />
  );
}
