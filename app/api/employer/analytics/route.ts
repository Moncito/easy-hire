import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { getEmployerAnalytics } from "@/lib/employer-analytics";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const analytics = await getEmployerAnalytics(company.id);

    return NextResponse.json(analytics, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
