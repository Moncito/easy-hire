import { parseJsonBody } from "@/lib/client/fetch-json";

type Notification = {
  id: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
};

export async function listEmployerNotifications() {
  const res = await fetch("/api/employer/notifications");
  if (!res.ok) return null;
  const data = await parseJsonBody(res);
  return data as { notifications: Notification[]; unreadCount: number };
}

export async function markEmployerNotificationsRead() {
  await fetch("/api/employer/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export async function listSeekerNotifications(params?: { cursor?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();

  const res = await fetch(`/api/seeker/notifications${qs ? `?${qs}` : ""}`);
  if (!res.ok) return null;
  const data = await parseJsonBody(res);
  return data as { notifications: Notification[]; nextCursor: string | null; unreadCount: number };
}

export async function markSeekerNotificationsRead(ids?: string[]) {
  await fetch("/api/seeker/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}
