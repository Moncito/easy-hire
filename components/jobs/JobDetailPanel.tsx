"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import JobDetailTabs from "@/components/jobs/JobDetailTabs";
import ApplyButton from "@/components/jobs/ApplyButton";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import { JobDetailPanelSkeleton } from "@/components/jobs/JobPageSkeletons";
import type { JobDetailData } from "@/components/jobs/JobDetailContent";

type Props = {
  jobId: string;
  saved: boolean;
  onToggleSaved?: (jobId: string, nextSaved: boolean) => void;
};

function PremiumApplyBlock({ job }: { job: JobDetailData }) {
  return (
    <div>
      <p className="font-display text-sm font-bold text-ink">Ready to apply?</p>
      <p className="mt-1 text-xs leading-relaxed text-ink/55">
        Your profile and resume go directly to the employer — no agency middlemen.
      </p>
      <div className="mt-4">
        <ApplyButton
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company.companyName}
          companyId={job.company.id}
          screeningQuestions={job.screeningQuestions ?? []}
        />
      </div>
    </div>
  );
}

function JobDetailPanelContent({ jobId, saved, onToggleSaved }: Props) {
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

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
      <div className="job-detail-panel-enter">
        <JobDetailPanelSkeleton />
      </div>
    );
  }

  if (error || !job) {
    return (
      <p className="job-detail-panel-enter p-8 text-sm text-ink/50">{error || "Job not found."}</p>
    );
  }

  return (
    <div className="job-detail-panel-enter px-5 pb-8 pt-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink/45 hover:text-navy"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open full page
        </Link>
        <SaveJobButton jobId={job.id} saved={saved} onToggle={onToggleSaved} />
      </div>
      <JobDetailTabs job={job} applyAction={<PremiumApplyBlock job={job} />} />
    </div>
  );
}

export default function JobDetailPanel(props: Props) {
  return <JobDetailPanelContent key={props.jobId} {...props} />;
}
