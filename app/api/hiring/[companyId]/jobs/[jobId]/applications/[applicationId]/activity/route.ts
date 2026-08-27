import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { addApplicationActivityNote } from "@/lib/collaborative-hiring-reviews";

const noteSchema = z.object({ body: z.string().trim().min(1, "Note can't be empty.").max(2000, "Note is too long.") });

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId, applicationId } = await params;
    const input = noteSchema.parse(await request.json());
    const note = await addApplicationActivityNote(companyId, session.user.id, jobId, applicationId, input.body);
    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid note" }, { status: 400 });
    return errorResponse(error);
  }
}
