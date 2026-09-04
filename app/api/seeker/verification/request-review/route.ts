import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requestIdentityReview } from "@/lib/seeker/identity-verification";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await requestIdentityReview(session.user.id);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
