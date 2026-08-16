import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { canAutoPublishJob, getCompanyPlan } from "@/lib/subscriptions";
import { canCreateOrActivateJob, FREE_ACTIVE_JOB_SOFT_CAP } from "@/lib/billing/entitlements";

/**
 * GET /api/employer/entitlements — small summary the employer UI can use to
 * show/hide Pro-only affordances (instant publish copy, featured toggle,
 * soft-cap banner) without duplicating billing logic client-side.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const [plan, canAutoPublish, jobCap] = await Promise.all([
      getCompanyPlan(company.id),
      canAutoPublishJob(company.id),
      canCreateOrActivateJob(company.id),
    ]);

    const isVerified = company.verifiedStatus === "APPROVED";

    return NextResponse.json(
      {
        plan,
        canAutoPublish,
        // Alias of `jobCap.allowed` — the soft cap is the only thing that
        // can block job creation today, so this mirrors it under the name
        // the UI reaches for at the create-job call site.
        canCreateJob: jobCap.allowed,
        activeJobCount: jobCap.activeJobCount,
        softCap: FREE_ACTIVE_JOB_SOFT_CAP,
        isVerified,
        companyVerified: isVerified,
        activeJobSoftCap: {
          limit: FREE_ACTIVE_JOB_SOFT_CAP,
          current: jobCap.activeJobCount,
          reached: !jobCap.allowed,
          appliesToPlan: plan === "FREE",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
