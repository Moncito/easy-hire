"use client";

import { useState } from "react";
import { Pencil, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button, JobCard, type MenuItem } from "@/components/employer/system";
import { callEasyAi } from "@/components/employer/pro/useEasyAi";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import { formatSalaryRange, type SalaryPeriod } from "@/lib/format";
import { jobCardState } from "@/lib/employer/job-card-state";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

const REMOTE: Record<string, string> = { REMOTE: "Remote", ONSITE: "On-site", HYBRID: "Hybrid" };
const EMPLOYMENT: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract" };

async function shareListing(job: EmployerJobCardData) {
  const url = `${window.location.origin}/jobs/${job.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: job.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Listing link copied");
  } catch (error) {
    // Dismissing the native share sheet rejects with AbortError — not a failure.
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share. Copy the link from the listing page instead.");
  }
}

/**
 * A Pro job posting: works out the card's state (lib/employer/job-card-state)
 * and wires its actions — share, feature, Easy AI tips, and the close /
 * duplicate / delete requests the board confirms.
 */
export default function ProJobCard({
  job,
  companyVerified,
  now,
  loading,
  onDuplicate,
  onClose,
  onDelete,
}: {
  job: EmployerJobCardData;
  companyVerified: boolean;
  /** Render time from the server, so the wait in days matches on server and client. */
  now: number;
  loading: boolean;
  onDuplicate: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const state = jobCardState(job, companyVerified, new Date(now));
  const [featured, setFeatured] = useState(
    Boolean(job.featuredUntil) && new Date(job.featuredUntil as string).getTime() > now
  );
  const [featureBusy, setFeatureBusy] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);
  const [tipsBusy, setTipsBusy] = useState(false);

  async function toggleFeatured() {
    if (featureBusy) return;
    setFeatureBusy(true);
    const result = await fetchJsonSafe(`/api/jobs/${job.id}/feature`, { method: featured ? "DELETE" : "POST" });
    if (result.ok) {
      setFeatured(!featured);
      toast.success(featured ? "Removed from featured placement" : "Job featured for 30 days");
    } else {
      toast.error(result.error ?? "Could not update featured status");
    }
    setFeatureBusy(false);
  }

  async function loadTips() {
    if (tipsBusy) return;
    setTipsBusy(true);
    const result = await callEasyAi<{ tips: string[] }>("job-tips", { jobId: job.id });
    if (result?.configured && result.data?.tips) setTips(result.data.tips);
    else toast.error("Easy AI couldn't suggest anything right now.");
    setTipsBusy(false);
  }

  const { lifecycle, primary } = state;
  const live = lifecycle === "active" || lifecycle === "unlisted";
  const isDraft = lifecycle === "draft" || lifecycle === "revision";
  const applicantsHref = `/employer/jobs/${job.id}/applicants`;

  const menuItems: MenuItem[] = [
    { label: "View applicants", href: applicantsHref, hidden: primary.href === applicantsHref || isDraft },
    { label: "Share listing", onSelect: () => void shareListing(job), hidden: !state.isPublic || primary.kind === "share" },
    { label: "Edit listing", href: `/employer/jobs/${job.id}/edit`, hidden: isDraft },
    { label: "Duplicate", onSelect: onDuplicate },
    {
      label: featureBusy ? "Updating…" : featured ? "Remove featured" : "Feature job",
      onSelect: () => void toggleFeatured(),
      hidden: lifecycle !== "active" && lifecycle !== "unlisted",
    },
    {
      label: tipsBusy ? "Analyzing…" : "Easy AI tips",
      onSelect: () => void loadTips(),
      hidden: !live && lifecycle !== "closed",
    },
    { label: "Close job", onSelect: onClose, tone: "danger", hidden: !live },
    { label: "Delete draft", onSelect: onDelete, tone: "danger", hidden: !isDraft },
  ];

  const icon = primary.kind === "edit" ? <Pencil /> : primary.kind === "share" ? <Share2 /> : <Users />;
  const primaryAction =
    primary.kind === "share" ? (
      <Button variant={primary.emphasis} icon={icon} onClick={() => void shareListing(job)}>
        {primary.label}
      </Button>
    ) : (
      <Button href={primary.href} variant={primary.emphasis} icon={icon}>
        {primary.label}
      </Button>
    );

  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryPeriod as SalaryPeriod);
  const meta = [REMOTE[job.remoteType] ?? job.remoteType, job.location, EMPLOYMENT[job.employmentType] ?? job.employmentType]
    .filter(Boolean)
    .join(" · ");

  const notice = (
    <>
      {job.reviewRejectionReason && isDraft && (
        <p className="rounded-control border border-[color-mix(in_srgb,var(--eh-danger)_25%,var(--eh-line))] bg-eh-danger-tint px-3 py-2 text-small text-eh-ink-2">
          <span className="font-semibold text-eh-danger">Admin feedback: </span>
          {job.reviewRejectionReason}
        </p>
      )}
      {tips && tips.length > 0 && (
        <div className="mt-2 rounded-control border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint px-3 py-2 text-small text-eh-ink-2 first:mt-0">
          <p className="font-semibold text-eh-teal-ink">Easy AI tips</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <JobCard
      title={job.title}
      href={primary.kind === "share" ? applicantsHref : primary.href}
      meta={meta}
      salary={salary === "Not specified" ? null : salary}
      lifecycle={lifecycle}
      featured={featured && live}
      applicants={job.applicantCount}
      views={job.viewCount}
      hired={job.hiredCount}
      target={job.targetHireCount}
      pipeline={job.pipeline}
      waiting={state.waiting}
      notice={(job.reviewRejectionReason && isDraft) || (tips && tips.length > 0) ? notice : undefined}
      primaryAction={primaryAction}
      publicHref={state.isPublic ? `/jobs/${job.id}` : null}
      menuItems={menuItems}
      footnote={`Updated ${new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
      loading={loading}
    />
  );
}
