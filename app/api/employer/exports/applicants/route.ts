import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { buildApplicantsCsv, logApplicantsExport } from "@/lib/employer/exports";

/**
 * GET /api/employer/exports/applicants?jobId=<id>
 * Employer Pro only. Streams a CSV of applicants for one job, or the whole
 * company when `jobId` is omitted. Every call is written to
 * `ExportAuditLog` (see lib/employer/exports.ts for the PII policy).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const jobId = new URL(req.url).searchParams.get("jobId") ?? undefined;

    const { csv, rowCount } = await buildApplicantsCsv(company.id, jobId);
    await logApplicantsExport({ companyId: company.id, userId: session.user.id, jobId, rowCount });

    const filename = jobId ? `applicants-${jobId}.csv` : `applicants-${company.id}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
