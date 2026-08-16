"use client";

import { Download } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  /** Scope the export to one job; omit for the whole company. */
  jobId?: string;
  className?: string;
  label?: string;
};

/**
 * Employer Pro applicant CSV export — a plain anchor so the browser
 * handles the `Content-Disposition: attachment` response from
 * `GET /api/employer/exports/applicants` natively (auth cookie included,
 * no client-side blob handling needed). Renders nothing on Free.
 */
export default function ExportCsvLink({ jobId, className = "", label = "Export CSV" }: Props) {
  const { isPro } = useEmployerShell();
  if (!isPro) return null;

  const href = jobId
    ? `/api/employer/exports/applicants?jobId=${encodeURIComponent(jobId)}`
    : "/api/employer/exports/applicants";

  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/15 hover:bg-ink/[0.02] ${className}`}
    >
      <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      {label}
    </a>
  );
}
