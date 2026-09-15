import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { getIpHashFromRequest } from "@/lib/admin/events";
import { impersonationEndSchema, impersonationStartSchema } from "@/lib/validations/admin";
import {
  IMPERSONATION_TTL_MS,
  endImpersonation,
  resolveActiveImpersonation,
  startImpersonation,
} from "@/lib/admin/impersonation";
import { IMPERSONATION_COOKIE_NAME, signImpersonationToken } from "@/lib/admin/impersonation-token";

/**
 * POST   /api/admin/impersonation — start a READ_ONLY "view as" session and
 *        set the impersonation cookie.
 * DELETE /api/admin/impersonation — end the caller's own active session (if
 *        any) and clear the cookie. Idempotent — safe to call with no
 *        active session.
 * GET    /api/admin/impersonation — the caller's own current session, or
 *        `{ session: null }`.
 *
 * All three are gated on the `impersonate` permission (SUPER_ADMIN only) via
 * `requireAdminWithPermission` here AND again inside
 * lib/admin/impersonation.ts's own functions — §8.1's defence in depth,
 * "a missing route guard should not be the only thing between a support
 * admin and the revenue screen."
 */

const IMPERSONATION_START_RATE_LIMIT = 10;
const IMPERSONATION_RATE_WINDOW_SECONDS = 60 * 60;

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "impersonate");

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "admin:impersonation:start", session.user.id),
      limit: IMPERSONATION_START_RATE_LIMIT,
      windowSeconds: IMPERSONATION_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const input = impersonationStartSchema.parse(body);

    const started = await startImpersonation({
      adminUserId: session.user.id,
      targetUserId: input.targetUserId,
      ticketReference: input.ticketReference,
      reason: input.reason,
      ipHash: getIpHashFromRequest(req),
    });

    const token = await signImpersonationToken({
      sessionId: started.id,
      expiresAt: started.expiresAt.getTime(),
    });

    const response = NextResponse.json(
      {
        sessionId: started.id,
        targetUserId: started.targetUserId,
        expiresAt: started.expiresAt.toISOString(),
      },
      { status: 201 }
    );

    response.cookies.set(IMPERSONATION_COOKIE_NAME, token, cookieOptions(Math.floor(IMPERSONATION_TTL_MS / 1000)));

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "impersonate");

    // Body is optional on DELETE — a bare "end whatever's active" call sends
    // no body at all, which req.json() would otherwise throw on.
    let reason: string | undefined;
    const rawBody = await req.text();
    if (rawBody.length > 0) {
      const parsed = impersonationEndSchema.parse(JSON.parse(rawBody));
      reason = parsed.reason;
    }

    const active = await resolveActiveImpersonation();

    const response = NextResponse.json({ ended: true });
    response.cookies.set(IMPERSONATION_COOKIE_NAME, "", cookieOptions(0));

    if (active && active.adminUserId === session.user.id) {
      await endImpersonation({ sessionId: active.sessionId, adminUserId: session.user.id, reason });
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "impersonate");

    const active = await resolveActiveImpersonation();
    if (!active || active.adminUserId !== session.user.id) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        sessionId: active.sessionId,
        target: active.target,
        expiresAt: active.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
