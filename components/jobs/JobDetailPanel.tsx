"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import JobDetailContent, { type JobDetailData } from "@/components/jobs/JobDetailContent";
import ApplyButton from "@/components/jobs/ApplyButton";
import SaveJobButton from "@/components/jobs/SaveJobButton";

type Props = {
  jobId: string;
  saved: boolean;
  onToggleSaved?: (jobId: string, nextSaved: boolean) => void;
};

export default function JobDetailPanel({ jobId, saved, onToggleSaved }: Props) {
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setJob(null);

    fetch(`/api/public/jobs/${jobId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Job not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this job — it may no longer be available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink/40">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (error || !job) {
    return <p className="p-8 text-sm text-ink/50">{error || "Job not found."}</p>;
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink/45 hover:text-navy"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open full page
        </Link>
        <SaveJobButton jobId={job.id} saved={saved} onToggle={onToggleSaved} />
      </div>
      <JobDetailContent
        job={job}
        variant="panel"
        applyAction={
          <div className="rounded-xl border border-marigold/25 bg-marigold/10 p-5">
            <p className="font-display text-sm font-bold text-ink">Ready to apply?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              Your profile and resume go straight to the employer&apos;s applicant board.
            </p>
            <ApplyButton jobId={job.id} jobTitle={job.title} companyName={job.company.companyName} />
          </div>
        }
      />
    </div>
  );
}
