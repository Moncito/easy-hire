import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { listSeekerAppliedJobIds } from "@/lib/seekers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobIds = await listSeekerAppliedJobIds(session.user.id);
    return NextResponse.json({ jobIds });
  } catch (error) {
    return errorResponse(error);
  }
}
