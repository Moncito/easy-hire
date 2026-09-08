import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getInterviewIcsForSeeker } from "@/lib/seeker/interviews";

/**
 * In-app "Add to calendar" download — the .ics generator
 * (lib/shared/calendar-invite.ts) previously only ever went out as an email
 * attachment (lib/collaborative-interviews.ts). Same auth + ownership rules
 * as the respond endpoint; refuses a CANCELLED interview.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await params;
    const ics = await getInterviewIcsForSeeker(session.user.id, interviewId);

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="interview.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
