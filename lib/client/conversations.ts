import { fetchJson, fetchJsonSafe, noStore, parseJsonBody } from "@/lib/client/fetch-json";
import type { ConversationListItem } from "@/lib/messages";

export async function listConversations(init?: RequestInit) {
  const res = await fetch("/api/conversations", { ...noStore, ...init });
  if (!res.ok) return null;
  const data = await parseJsonBody(res);
  return data as { conversations: ConversationListItem[] };
}

export async function getConversation(id: string, init?: RequestInit) {
  const res = await fetch(`/api/conversations/${id}`, { ...noStore, ...init });
  if (!res.ok) return null;
  return parseJsonBody(res);
}

export async function pollConversationMessages(
  conversationId: string,
  after?: string | null,
  init?: RequestInit
) {
  const url = after
    ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(after)}`
    : `/api/conversations/${conversationId}/messages`;
  const res = await fetch(url, { ...noStore, ...init });
  if (!res.ok) return null;
  return parseJsonBody(res);
}

export async function sendConversationMessage(conversationId: string, body: string) {
  return fetchJsonSafe<{ message?: unknown }>(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export async function startConversation(seekerId: string, jobId?: string) {
  return fetchJsonSafe<{ id: string; error?: string }>("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seekerId, jobId }),
  });
}
