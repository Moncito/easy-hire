import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { listSavedJobFolders, createSavedJobFolder } from "@/lib/seeker/saved-job-folders";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await listSavedJobFolders(session.user.id);
    return NextResponse.json({ folders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJsonBody(req);
    const folder = await createSavedJobFolder(session.user.id, body);
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
