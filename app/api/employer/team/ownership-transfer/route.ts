import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { requestOwnershipTransferSchema } from "@/lib/validations/collaborative-hiring";
import {
  cancelOwnershipTransfer,
  getOwnershipTransferState,
  requestOwnershipTransfer,
} from "@/lib/company-ownership-transfer";

// POST checks the owner's password, so it gets the same cap as
// /api/account/change-password.
const TRANSFER_RATE_LIMIT = 5;
const TRANSFER_RATE_WINDOW_SECONDS = 60 * 60;

async function requireEmployer() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return null;
  return session;
}

export async function GET() {
  try {
    const session = await requireEmployer();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getOwnershipTransferState(session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/employer/team/ownership-transfer — offer the company to a teammate. Nothing moves until they accept. */
export async function POST(req: Request) {
  try {
    const session = await requireEmployer();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await enforceRateLimit({
      key: clientKeyFromRequest(req, "employer:ownership-transfer", session.user.id),
      limit: TRANSFER_RATE_LIMIT,
      windowSeconds: TRANSFER_RATE_WINDOW_SECONDS,
    });
    const input = requestOwnershipTransferSchema.parse(await parseJsonBody(req));
    await requestOwnershipTransfer(session.user.id, input);
    return NextResponse.json(await getOwnershipTransferState(session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE — withdraw a pending offer. */
export async function DELETE() {
  try {
    const session = await requireEmployer();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await cancelOwnershipTransfer(session.user.id);
    return NextResponse.json(await getOwnershipTransferState(session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
