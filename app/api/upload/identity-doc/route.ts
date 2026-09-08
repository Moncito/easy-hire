import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { requireSeekerProfile } from "@/lib/auth/seeker-guards";
import { uploadIdentityDocument } from "@/lib/storage";

// Authenticated, but each call buffers a whole file into memory — same
// limits as app/api/upload/verification-doc/route.ts.
const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "upload:identity-doc", session.user.id),
      limit: UPLOAD_RATE_LIMIT,
      windowSeconds: UPLOAD_RATE_WINDOW_SECONDS,
    });

    await requireSeekerProfile(session.user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const { url, fileName } = await uploadIdentityDocument(session.user.id, file);
    return NextResponse.json({ url, fileName });
  } catch (error) {
    return errorResponse(error);
  }
}
