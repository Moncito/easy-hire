import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { listSavedJobIds, listSavedJobs } from "@/lib/saved-jobs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get("full") === "1") {
      const saved = await listSavedJobs(session.user.id);
      return NextResponse.json({ saved });
    }

    const jobIds = await listSavedJobIds(session.user.id);
    return NextResponse.json({ jobIds });
  } catch (error) {
    return errorResponse(error);
  }
}
