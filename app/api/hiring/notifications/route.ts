import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { markNotificationsRead } from "@/lib/notifications";
import { getEmployerNotificationsCached, invalidateEmployerNotifications } from "@/lib/employer-cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Shared with the solo /employer bell — same underlying notifications table,
    // so this reuses that 15s cache instead of re-querying on every 60s poll.
    const { notifications, unreadCount } = await getEmployerNotificationsCached(session.user.id);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await markNotificationsRead(session.user.id);
    invalidateEmployerNotifications(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
