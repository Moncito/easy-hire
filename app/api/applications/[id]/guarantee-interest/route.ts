import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { recordGuaranteeInterest } from "@/lib/hiring/offers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await recordGuaranteeInterest(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
