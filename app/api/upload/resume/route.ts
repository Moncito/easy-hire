import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse, ApiError } from "@/lib/api-error";
import { requireSeekerProfile } from "@/lib/seeker-auth";
import { updateSeekerProfile } from "@/lib/seekers";
import { uploadResume } from "@/lib/storage";
import {
  formatResume,
  MAX_RESUMES,
  resumeFilenameFromUrl,
} from "@/lib/seeker-profile-format";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await requireSeekerProfile(session.user.id);

    if (profile.resumes.length >= MAX_RESUMES) {
      throw new ApiError(`You can store up to ${MAX_RESUMES} resumes. Remove one to upload another.`, 400);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const resumeUrl = await uploadResume(session.user.id, file);
    const label = resumeFilenameFromUrl(resumeUrl);
    const updatedAt = new Date().toISOString();
    const entry = formatResume({ label, url: resumeUrl, updatedAt });
    const resumes = [...profile.resumes, entry];
    const isFirst = !profile.resumeUrl;

    const updated = await updateSeekerProfile(session.user.id, {
      resumes,
      ...(isFirst
        ? {
            resumeUrl,
            resumeLabel: label,
          }
        : {}),
    });

    return NextResponse.json({
      resumeUrl: updated.resumeUrl,
      resumeLabel: updated.resumeLabel,
      resumeUpdatedAt: updated.resumeUpdatedAt?.toISOString() ?? updatedAt,
      resumes: updated.resumes,
      entry,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
