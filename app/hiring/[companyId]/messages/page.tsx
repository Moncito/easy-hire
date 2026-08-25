import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import CollaboratorMessagesInbox from "@/components/hiring/CollaboratorMessagesInbox";

export default async function CollaborativeMessagesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/messages`)}`);
  const membership = await requireCompanyMembership(companyId, session.user.id, "messages:manage");
  return <CollaboratorMessagesInbox companyId={companyId} role={membership.role} />;
}
