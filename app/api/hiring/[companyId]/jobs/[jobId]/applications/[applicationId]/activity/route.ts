import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { addApplicationActivityNote } from "@/lib/collaborative-hiring-reviews";

const noteSchema = z.object({ body: z.string().trim().min(1, "Note can't be empty.").max(2000, "Note is too long.") });

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId, applicationId } = await params;
    const input = noteSchema.parse(await parseJsonBody(request));
    const note = await addApplicationActivityNote(companyId, session.user.id, jobId, applicationId, input.body);
    return NextResponse.json(note);
  } catch (error) {
    return errorResponse(error);
  }
}
