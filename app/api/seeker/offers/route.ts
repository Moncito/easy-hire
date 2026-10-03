import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getPendingOffersForSeeker } from "@/lib/hiring/offers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offers = await getPendingOffersForSeeker(session.user.id);
    return NextResponse.json(offers);
  } catch (error) {
    return errorResponse(error);
  }
}
