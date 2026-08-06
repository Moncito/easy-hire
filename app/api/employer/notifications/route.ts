import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import {
  getEmployerNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      getEmployerNotifications(session.user.id),
      getUnreadNotificationCount(session.user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { ids?: string[] };
    await markNotificationsRead(session.user.id, body.ids);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
