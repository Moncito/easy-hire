import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { listJobAlerts, createJobAlert } from "@/lib/job-alerts";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await listJobAlerts(session.user.id);
    return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
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

    const body = await req.json();
    const alert = await createJobAlert(session.user.id, body);
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
