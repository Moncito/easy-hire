import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { listConversationsForUserCached } from "@/lib/conversations-cache";

export default async function SeekerMessagesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SEEKER") {
    redirect("/login");
  }

  const conversations = await listConversationsForUserCached(session.user.id, "SEEKER");

  return <MessagesInbox role="SEEKER" fillNavClearance initialConversations={conversations} />;
}
