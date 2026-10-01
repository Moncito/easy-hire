import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { getNewJobPrefill } from "@/lib/employer/hiring-defaults";
import CollaboratorJobForm from "@/components/hiring/CollaboratorJobForm";

export default async function NewCollaborativeJobPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/new`)}`);
  await requireCompanyMembership(companyId, session.user.id, "jobs:manage");
  const prefill = await getNewJobPrefill(companyId);
  return <CollaboratorJobForm companyId={companyId} initialData={prefill} />;
}
