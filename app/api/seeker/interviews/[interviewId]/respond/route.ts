import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { respondToInterview } from "@/lib/seeker/interviews";
import { respondToInterviewSchema } from "@/lib/validations/interview";

export async function POST(req: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await params;
    const body = await parseJsonBody(req);
    const { response } = respondToInterviewSchema.parse(body);

    const result = await respondToInterview(session.user.id, interviewId, response);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
