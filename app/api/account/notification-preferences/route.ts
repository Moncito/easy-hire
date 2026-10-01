import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { notificationPreferencesUpdateSchema } from "@/lib/validations/account";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/account/notification-preferences";

/**
 * GET/PATCH /api/account/notification-preferences
 * The three email opt-outs on `User` (see lib/account/notification-preferences.ts).
 * The response body is the flat `{ notifyMessages, notifyApplicationUpdates,
 * notifyProductDigest }` shape on both verbs — no wrapper key — since the
 * settings UI reads those field names directly off the response.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getNotificationPreferences(session.user.id);
    return NextResponse.json(preferences);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = notificationPreferencesUpdateSchema.parse(await parseJsonBody(req));
    const preferences = await updateNotificationPreferences(session.user.id, body);
    return NextResponse.json(preferences);
  } catch (error) {
    return errorResponse(error);
  }
}
