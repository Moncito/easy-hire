import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { uploadVerificationDocument } from "@/lib/storage";

// Authenticated, but each call buffers a whole file into memory.
const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "upload:verification-doc", session.user.id),
      limit: UPLOAD_RATE_LIMIT,
      windowSeconds: UPLOAD_RATE_WINDOW_SECONDS,
    });

    await requireEmployerCompany(session.user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const { url, fileName } = await uploadVerificationDocument(session.user.id, file);
    return NextResponse.json({ url, fileName });
  } catch (error) {
    return errorResponse(error);
  }
}
