import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { requestVerificationReview } from "@/lib/verification";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const updated = await requestVerificationReview(company.id);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
