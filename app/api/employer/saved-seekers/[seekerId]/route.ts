import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { unsaveSeeker } from "@/lib/talent";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ seekerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seekerId } = await params;
    const result = await unsaveSeeker(session.user.id, seekerId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
