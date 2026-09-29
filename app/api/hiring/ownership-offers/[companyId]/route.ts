import { NextResponse } from "next/server";
import { auth, unstable_update } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { respondOwnershipTransferSchema } from "@/lib/validations/collaborative-hiring";
import { acceptOwnershipTransfer, declineOwnershipTransfer } from "@/lib/company-ownership-transfer";

/**
 * POST /api/hiring/ownership-offers/[companyId]  { action: "accept" | "decline" }
 * The nominee's answer. Open to any account type: the nominee is usually a
 * job seeker until the moment they accept.
 */
export async function POST(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const { action } = respondOwnershipTransferSchema.parse(await parseJsonBody(req));

    if (action === "decline") {
      await declineOwnershipTransfer(session.user.id, companyId);
      return NextResponse.json({ ok: true });
    }

    await acceptOwnershipTransfer(session.user.id, companyId);
    // The account may have just become EMPLOYER. An update forces the jwt
    // callback's DB refresh (see Auth.ts), so the cookie carries the new role
    // now instead of up to 15 minutes later — otherwise the proxy would
    // bounce the redirect to /employer.
    await unstable_update({});
    return NextResponse.json({ ok: true, redirectTo: "/employer/dashboard" });
  } catch (error) {
    return errorResponse(error);
  }
}
