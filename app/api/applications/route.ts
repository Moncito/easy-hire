import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { createApplication } from "@/lib/applications";
import { getSeekerApplicationForJob } from "@/lib/seekers";

// Authenticated, but cheap to spam — cap per-seeker application submissions.
const APPLY_RATE_LIMIT = 20;
const APPLY_RATE_WINDOW_SECONDS = 60 * 60;

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = new URL(req.url).searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId query parameter is required" }, { status: 400 });
    }

    const application = await getSeekerApplicationForJob(session.user.id, jobId);
    return NextResponse.json({ application });
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

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "applications", session.user.id),
      limit: APPLY_RATE_LIMIT,
      windowSeconds: APPLY_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const application = await createApplication(session.user.id, body);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
