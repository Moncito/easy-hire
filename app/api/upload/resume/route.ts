import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse, ApiError } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { requireSeekerProfile } from "@/lib/auth/seeker-guards";
import { updateSeekerProfile } from "@/lib/seekers";
import { uploadResume } from "@/lib/storage";
import { hydrateResumeFields } from "@/lib/seeker/resume-urls";
import {
  formatResume,
  MAX_RESUMES,
  resumeFilenameFromUrl,
} from "@/lib/seeker/profile-format";

// Authenticated, but each call buffers a whole file into memory.
const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "upload:resume", session.user.id),
      limit: UPLOAD_RATE_LIMIT,
      windowSeconds: UPLOAD_RATE_WINDOW_SECONDS,
    });

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

    // The client renders these values immediately (no page reload), so hand
    // back signed URLs even though `updated` itself still holds bare paths.
    // The entry we just appended is always last in `updated.resumes`.
    const hydrated = await hydrateResumeFields(updated);
    const hydratedEntry = hydrated.resumes[hydrated.resumes.length - 1] ?? entry;

    return NextResponse.json({
      resumeUrl: hydrated.resumeUrl,
      resumeLabel: updated.resumeLabel,
      resumeUpdatedAt: updated.resumeUpdatedAt?.toISOString() ?? updatedAt,
      resumes: hydrated.resumes,
      entry: hydratedEntry,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
