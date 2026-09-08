import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { removeJobFromFolder } from "@/lib/seeker/saved-job-folders";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ folderId: string; savedJobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId, savedJobId } = await params;
    const result = await removeJobFromFolder(session.user.id, folderId, savedJobId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
