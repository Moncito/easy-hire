"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Building2, MapPin, Clock } from "lucide-react";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";

type PendingJob = {
  id: string;
  title: string;
  category: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  updatedAt: string;
  company: {
    id: string;
    companyName: string;
    industry: string | null;
    verifiedStatus: string;
  };
};

type Props = {
  initialJobs: PendingJob[];
};

export default function JobReviewQueue({ initialJobs }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  async function review(jobId: string, action: "approve" | "reject", reason?: string) {
    setError("");
    setLoadingId(jobId);

    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    const result = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      setError(result.error || "Action failed");
      return;
    }

    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setRejectingId(null);
    setRejectReason("");
    router.refresh();
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
        <Check className="mx-auto mb-3 h-8 w-8 text-teal" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">Queue is clear</h2>
        <p className="mt-1 text-sm text-ink/50">No jobs are waiting for review right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
      )}

      {jobs.map((job) => (
        <article
          key={job.id}
          className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-ink">{job.title}</h2>
                <span className="rounded-full bg-marigold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                  Pending review
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-ink/35" aria-hidden="true" />
                  {job.company.companyName}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    job.company.verifiedStatus === "APPROVED"
                      ? "bg-teal/10 text-teal"
                      : "bg-marigold/10 text-[#8a5a10]"
                  }`}
                >
                  Company {job.company.verifiedStatus === "APPROVED" ? "verified" : "unverified"}
                </span>
                <span>{job.category}</span>
                <span>{formatEnumLabel(job.employmentType)}</span>
                <span>{formatEnumLabel(job.remoteType)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/45">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {job.location}
                </span>
                <span>{formatPesoRange(job.salaryMin, job.salaryMax)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Submitted {new Date(job.updatedAt).toLocaleString()}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink/70">{job.description}</p>
              {job.requirements && (
                <p className="mt-2 text-xs text-ink/50">
                  <span className="font-semibold text-ink/65">Requirements:</span> {job.requirements}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
              {job.company.verifiedStatus !== "APPROVED" && (
                <p className="max-w-[200px] text-xs leading-relaxed text-[#8a5a10] lg:text-right">
                  Verify the company first in{" "}
                  <Link href="/admin/companies" className="font-semibold underline hover:text-teal">
                    Company verifications
                  </Link>
                  .
                </p>
              )}
              <button
                type="button"
                disabled={loadingId === job.id || job.company.verifiedStatus !== "APPROVED"}
                onClick={() => review(job.id, "approve")}
                title={
                  job.company.verifiedStatus !== "APPROVED"
                    ? "Verify the employer company before approving this job"
                    : undefined
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Approve
              </button>
              <button
                type="button"
                disabled={loadingId === job.id}
                onClick={() => setRejectingId(rejectingId === job.id ? null : job.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ember/20 px-4 py-2.5 text-sm font-semibold text-ember hover:bg-ember/5 disabled:opacity-60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Reject
              </button>
            </div>
          </div>

          {rejectingId === job.id && (
            <div className="mt-4 rounded-xl border border-ember/15 bg-ember/5 p-4">
              <label className="mb-2 block text-xs font-semibold text-ink/60">
                Rejection reason (sent to employer)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain what needs to be fixed before this job can go live..."
                className="w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink outline-none focus:border-ember/40"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={loadingId === job.id}
                  onClick={() => review(job.id, "reject", rejectReason)}
                  className="rounded-lg bg-ember px-3 py-2 text-xs font-semibold text-white hover:bg-ember/90 disabled:opacity-60"
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason("");
                  }}
                  className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
