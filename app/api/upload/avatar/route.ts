import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { uploadUserAvatar } from "@/lib/storage";

// Authenticated, but each call buffers a whole file into memory.
const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "upload:avatar", session.user.id),
      limit: UPLOAD_RATE_LIMIT,
      windowSeconds: UPLOAD_RATE_WINDOW_SECONDS,
    });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const avatarUrl = await uploadUserAvatar(session.user.id, file);
    await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
