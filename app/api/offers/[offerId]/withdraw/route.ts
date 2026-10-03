import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { withdrawOffer } from "@/lib/hiring/offers";

export async function POST(_req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await params;
    const result = await withdrawOffer(session.user.id, offerId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
