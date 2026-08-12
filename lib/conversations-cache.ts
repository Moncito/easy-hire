import { unstable_cache, revalidateTag } from "next/cache";
import { listConversationsForUser } from "@/lib/conversation-inbox";
import { conversationsListTag } from "@/lib/employer-cache-tags";

const CONVERSATIONS_REVALIDATE = 15;

export function listConversationsForUserCached(userId: string, role: string) {
  return unstable_cache(
    async () => listConversationsForUser(userId, role),
    ["conversations-list", userId, role],
    { revalidate: CONVERSATIONS_REVALIDATE, tags: [conversationsListTag(userId)] }
  )();
}

export function invalidateConversationsList(userId: string) {
  revalidateTag(conversationsListTag(userId), "max");
}

/** Bust inbox list cache for both participants after a thread changes. */
export function invalidateConversationsForParticipants(
  employerUserId: string,
  seekerUserId: string
) {
  invalidateConversationsList(employerUserId);
  invalidateConversationsList(seekerUserId);
}
