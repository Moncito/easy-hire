import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { addJobToFolder } from "@/lib/seeker/saved-job-folders";

export async function POST(req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const body = await parseJsonBody(req);
    const item = await addJobToFolder(session.user.id, folderId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
