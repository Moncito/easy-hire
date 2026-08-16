import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { isEmployerPro } from "@/lib/billing/subscriptions";

/**
 * CSV export contains seeker PII (name + email) by design — it's an
 * employer-facing export of their own applicants, gated to Employer Pro.
 * We never include resume URLs, phone numbers, or answers to screening
 * questions in the export, and every export call is written to
 * `ExportAuditLog` (see `logApplicantsExport`) so PII access stays
 * traceable. Callers must confirm Pro status before calling `buildCsv`.
 */

const CSV_HEADERS = ["Name", "Email", "Job Title", "Status", "Applied At", "Rating"] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(values: string[]): string {
  return values.map(csvEscape).join(",");
}

export type ApplicantExportRow = {
  name: string;
  email: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
  rating: number | null;
};

async function fetchApplicantExportRows(
  companyId: string,
  jobId?: string
): Promise<ApplicantExportRow[]> {
  const applications = await prisma.application.findMany({
    where: {
      job: { companyId, ...(jobId ? { id: jobId } : {}) },
    },
    orderBy: { appliedAt: "desc" },
    select: {
      status: true,
      appliedAt: true,
      rating: true,
      job: { select: { title: true } },
      seeker: {
        select: {
          fullName: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return applications.map((a) => ({
    name: a.seeker.fullName,
    email: a.seeker.user.email,
    jobTitle: a.job.title,
    status: a.status,
    appliedAt: a.appliedAt.toISOString(),
    rating: a.rating,
  }));
}

export function rowsToCsv(rows: ApplicantExportRow[]): string {
  const lines = [
    toCsvRow([...CSV_HEADERS]),
    ...rows.map((r) =>
      toCsvRow([r.name, r.email, r.jobTitle, r.status, r.appliedAt, r.rating != null ? String(r.rating) : ""])
    ),
  ];
  return lines.join("\n");
}

/**
 * Builds the applicants CSV for one job, or the whole company hub when
 * `jobId` is omitted. Throws if the company isn't Pro — call sites should
 * still gate earlier so they can render an upgrade prompt instead of an
 * error, but this is a hard backstop.
 */
export async function buildApplicantsCsv(
  companyId: string,
  jobId?: string
): Promise<{ csv: string; rowCount: number }> {
  const pro = await isEmployerPro(companyId);
  if (!pro) {
    throw new ApiError("Candidate CSV export is an Employer Pro feature. Upgrade to export applicants.", 403);
  }

  if (jobId) {
    const job = await prisma.job.findFirst({ where: { id: jobId, companyId }, select: { id: true } });
    if (!job) {
      throw new ApiError("Job not found", 404);
    }
  }

  const rows = await fetchApplicantExportRows(companyId, jobId);
  return { csv: rowsToCsv(rows), rowCount: rows.length };
}

/**
 * Records who exported what and how many rows — never the exported PII
 * itself — so candidate-data access stays auditable.
 */
export async function logApplicantsExport(input: {
  companyId: string;
  userId: string;
  jobId?: string;
  rowCount: number;
}) {
  await prisma.exportAuditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      kind: "applicants_csv",
      meta: { jobId: input.jobId ?? null, rowCount: input.rowCount },
    },
  });
}

export async function listExportAuditLog(companyId: string, limit = 50) {
  return prisma.exportAuditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
