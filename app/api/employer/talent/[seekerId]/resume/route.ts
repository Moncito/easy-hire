import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse, ApiError } from "@/lib/api-error";
import { getSeekerProfileForEmployer } from "@/lib/talent";
import { signResumeUrl } from "@/lib/seeker/resume-urls";

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

    const signedUrl = await signResumeUrl(profile.resumeUrl);
    if (!signedUrl) {
      throw new ApiError("Resume not available", 404);
    }

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return errorResponse(error);
  }
}
