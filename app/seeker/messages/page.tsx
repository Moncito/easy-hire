import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { listConversationsForUserCached } from "@/lib/conversations-cache";
import { ABUSE_REPORT_REASONS_BY_TARGET_TYPE } from "@/lib/admin/abuse-reports";

export default async function SeekerMessagesPage() {
  const { userId } = await requireSeekerPageContext();

  const conversations = await listConversationsForUserCached(userId, "SEEKER");

  return (
    <MessagesInbox
      role="SEEKER"
      fillNavClearance
      initialConversations={conversations}
      reportReasons={ABUSE_REPORT_REASONS_BY_TARGET_TYPE.MESSAGE}
    />
  );
}
