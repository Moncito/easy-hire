import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getCollaborativeCompanyProfile } from "@/lib/collaborative-company-profile";
import CollaboratorCompanyProfile from "@/components/hiring/CollaboratorCompanyProfile";

export default async function CollaborativeCompanyProfilePage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/company-profile`)}`);
  const { membership, company, activeJobsCount, totalApplicantsCount } = await getCollaborativeCompanyProfile(companyId, session.user.id);
  return <CollaboratorCompanyProfile companyId={companyId} role={membership.role} company={company} activeJobsCount={activeJobsCount} totalApplicantsCount={totalApplicantsCount} />;
}
