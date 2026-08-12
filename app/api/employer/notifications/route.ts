import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import {
  getEmployerNotificationsCached,
  invalidateEmployerNotifications,
} from "@/lib/employer-cache";
import { markNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notifications, unreadCount } = await getEmployerNotificationsCached(session.user.id);

    return NextResponse.json({ notifications, unreadCount });
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
    invalidateEmployerNotifications(session.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
