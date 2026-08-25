import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { searchCollaborativeWorkspace } from "@/lib/collaborative-search";

export async function GET(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchCollaborativeWorkspace(companyId, session.user.id, q);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
