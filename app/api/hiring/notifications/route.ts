import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getEmployerNotifications, getUnreadNotificationCount, markNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [notifications, unreadCount] = await Promise.all([
      getEmployerNotifications(session.user.id),
      getUnreadNotificationCount(session.user.id),
    ]);
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
