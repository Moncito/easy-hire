import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireSeekerProfile } from "@/lib/seeker-auth";
import { updateSeekerProfile } from "@/lib/seekers";
import { uploadSeekerPhoto } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireSeekerProfile(session.user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const photoUrl = await uploadSeekerPhoto(session.user.id, file);
    const profile = await updateSeekerProfile(session.user.id, { photoUrl });

    return NextResponse.json({ photoUrl: profile.photoUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
