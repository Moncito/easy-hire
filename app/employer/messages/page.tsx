import MessagesInbox from "@/components/messages/MessagesInbox";
import { listConversationsForUserCached } from "@/lib/conversations-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";

export default async function EmployerMessagesPage() {
  const { session } = await requireEmployerPageContext();
  const conversations = await listConversationsForUserCached(session.user.id, "EMPLOYER");

  return <MessagesInbox role="EMPLOYER" initialConversations={conversations} />;
}
