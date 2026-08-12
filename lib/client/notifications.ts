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
