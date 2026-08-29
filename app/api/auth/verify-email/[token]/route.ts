import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/auth/credentials-recovery";

/**
 * Consumes the emailed verification link and redirects to a page-level
 * success/failure state — the UI agent owns /verify-email/success and
 * /verify-email/invalid; this route never renders anything itself.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    await verifyEmail(token);
    return NextResponse.redirect(new URL("/verify-email/success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/verify-email/invalid", req.url));
  }
}
