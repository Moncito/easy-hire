import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { listCollaborativeConversations } from "@/lib/collaborative-messages";
import CollaboratorMessagesInbox from "@/components/hiring/CollaboratorMessagesInbox";

export default async function CollaborativeMessagesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/messages`)}`);
  await requireCompanyMembership(companyId, session.user.id, "messages:manage");
  // Fetch the inbox on the server so the list is in the first paint instead of
  // waiting for a client round-trip after hydration.
  const initialConversations = await listCollaborativeConversations(companyId, session.user.id);
  return <CollaboratorMessagesInbox companyId={companyId} initialConversations={initialConversations} />;
}
