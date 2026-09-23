import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/account/notification-preferences";

/**
 * GET/POST /api/unsubscribe/[token]
 * Must work for a logged-out recipient — this is what List-Unsubscribe and
 * the digest footer link point at, and RFC 8058 one-click unsubscribe (see
 * `List-Unsubscribe-Post` on the digest emails) POSTs here with no session.
 * Same neutral outcome on both verbs and for an unrecognized token: it's a
 * bearer credential that only ever disables mail, never single-use, and
 * this must never confirm or deny that a given token exists — see
 * unsubscribeByToken's doc comment.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await unsubscribeByToken(token);
  // No standalone unsubscribe page exists yet — redirect to the dashboard of
  // whichever surface is nearest to "you're unsubscribed" today. A UI agent
  // can add a dedicated /unsubscribed confirmation page later and this
  // redirect target would move there (mirrors the /verify-email/success
  // pattern in app/api/auth/verify-email/[token]/route.ts).
  return NextResponse.redirect(new URL("/unsubscribed", req.url));
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await unsubscribeByToken(token);
  return NextResponse.json({ ok: true });
}
