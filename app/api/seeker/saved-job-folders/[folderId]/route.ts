import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import {
  getSavedJobFolder,
  renameSavedJobFolder,
  deleteSavedJobFolder,
} from "@/lib/seeker/saved-job-folders";

export async function GET(_req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const folder = await getSavedJobFolder(session.user.id, folderId);
    return NextResponse.json(folder, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const body = await parseJsonBody(req);
    const folder = await renameSavedJobFolder(session.user.id, folderId, body);
    return NextResponse.json(folder);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const result = await deleteSavedJobFolder(session.user.id, folderId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
