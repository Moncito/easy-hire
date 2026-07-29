import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { uploadCompanyBanner } from "@/lib/storage";
import { updateCompany } from "@/lib/companies";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bannerUrl = await uploadCompanyBanner(session.user.id, file);
    const updated = await updateCompany(session.user.id, {
      companyName: company.companyName,
      bannerUrl,
    });

    return NextResponse.json({ bannerUrl: updated.bannerUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
