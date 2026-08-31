import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { createCollaborativeJob } from "@/lib/collaborative-job-management";

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const job = await createCollaborativeJob(companyId, session.user.id, await parseJsonBody(request));
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}
