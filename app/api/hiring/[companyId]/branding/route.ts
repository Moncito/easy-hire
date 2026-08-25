import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getCollaborativeCompanyBranding } from "@/lib/collaborative-company-profile";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const branding = await getCollaborativeCompanyBranding(companyId, session.user.id);
    return NextResponse.json(branding);
  } catch (error) {
    return errorResponse(error);
  }
}
