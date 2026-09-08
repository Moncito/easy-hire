import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireSeekerProfile } from "@/lib/auth/seeker-guards";
import {
  getSeekerNotificationsCached,
  invalidateSeekerNotifications,
} from "@/lib/seeker/cache";
import { markNotificationsRead } from "@/lib/notifications";
import { notificationListSchema } from "@/lib/validations/notification";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireSeekerProfile(session.user.id);

    const { searchParams } = new URL(req.url);
    const { cursor, limit } = notificationListSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const { notifications, nextCursor, unreadCount } = await getSeekerNotificationsCached(
      session.user.id,
      { cursor, limit }
    );

    return NextResponse.json({ notifications, nextCursor, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireSeekerProfile(session.user.id);

    const body = (await parseJsonBody(req)) as { ids?: string[] };
    await markNotificationsRead(session.user.id, body.ids);
    invalidateSeekerNotifications(session.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
