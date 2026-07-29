import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse, ApiError } from "@/lib/api-error";
import { getSeekerProfileForEmployer } from "@/lib/talent";
import { resumeFilenameFromUrl } from "@/lib/seeker-profile-format";

export async function GET(_req: Request, { params }: { params: Promise<{ seekerId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seekerId } = await params;
    const { profile, canDownloadResume } = await getSeekerProfileForEmployer(session.user.id, seekerId);

    if (!canDownloadResume || !profile.resumeUrl) {
      throw new ApiError("Resume not available", 404);
    }

    const upstream = await fetch(profile.resumeUrl);
    if (!upstream.ok || !upstream.body) {
      throw new ApiError("Resume file could not be retrieved", 502);
    }

    const filename = resumeFilenameFromUrl(profile.resumeUrl);
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
