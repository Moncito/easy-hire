import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { listConversationsForUserCached } from "@/lib/conversations-cache";

export default async function SeekerMessagesPage() {
  const { userId } = await requireSeekerPageContext();

  const conversations = await listConversationsForUserCached(userId, "SEEKER");

  return <MessagesInbox role="SEEKER" fillNavClearance initialConversations={conversations} />;
}
