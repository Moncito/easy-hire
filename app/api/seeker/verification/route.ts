import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { createIdentityDocument, listIdentityDocuments } from "@/lib/seeker/identity-verification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await listIdentityDocuments(session.user.id);
    return NextResponse.json(documents);
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
    const document = await createIdentityDocument(session.user.id, body);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
