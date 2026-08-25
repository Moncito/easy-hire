import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { createCollaborativeJob } from "@/lib/collaborative-job-management";

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const job = await createCollaborativeJob(companyId, session.user.id, await request.json());
    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    return errorResponse(error);
  }
}
