import MessagesInbox from "@/components/messages/MessagesInbox";
import { listConversationsForUserCached } from "@/lib/conversations-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { ABUSE_REPORT_REASONS_BY_TARGET_TYPE } from "@/lib/admin/abuse-reports";

export default async function EmployerMessagesPage() {
  const { session } = await requireEmployerPageContext();
  const conversations = await listConversationsForUserCached(session.user.id, "EMPLOYER");

  return (
    <MessagesInbox
      role="EMPLOYER"
      initialConversations={conversations}
      reportReasons={ABUSE_REPORT_REASONS_BY_TARGET_TYPE.MESSAGE}
    />
  );
}
