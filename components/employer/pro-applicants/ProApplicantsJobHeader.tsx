"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Download, ExternalLink, Pencil, Settings2, Sparkles, X } from "lucide-react";
import {
  Button,
  DropdownMenu,
  JobStatusBadge,
  PipelineMini,
  cx,
  type MenuItem,
} from "@/components/employer/system";
import type { ApplicantsJobSummary, PipelineCounts } from "@/components/employer/ApplicantsJobHeader";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import { PRO_REJECTED_STAGE, PRO_STAGES } from "@/components/employer/pro-applicants/stages";
import { formatJobSubtitle } from "@/lib/employer-jobs";
import type { WaitSeverity } from "@/lib/employer/attention";
import type { JobLifecycle } from "@/lib/employer/job-card-state";

type ShortlistItem = { applicationId: string; seekerName: string; score: number; reasons: string[] };

function lifecycleOf(status: string, companyVerified: boolean): JobLifecycle {
  if (status === "ACTIVE") return companyVerified ? "active" : "unlisted";
  if (status === "DRAFT") return "draft";
  if (status === "PENDING_REVIEW") return "pending";
  return "closed";
}

/**
 * Header of one job's applicants board: back link, the job and its state,
 * the pipeline in numbers, stage shortcuts that scroll the board, and the
 * actions. Easy AI's top-10 ranking and Edit job stay visible; the rest
 * (listing, hiring setup, CSV export) sit in the "⋯" menu.
 */
export default function ProApplicantsJobHeader({
  job,
  totalApplicants,
  pipeline,
  companyVerified,
  waitSeverity,
  activeStage,
  onStageSelect,
  selectionMode,
  onToggleSelection,
}: {
  job: ApplicantsJobSummary;
  totalApplicants: number;
  pipeline: PipelineCounts;
  companyVerified: boolean;
  /** The oldest unreviewed applicant's wait, on the shared two-level rule. */
  waitSeverity: WaitSeverity;
  activeStage: string | null;
  onStageSelect: (stage: string) => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
}) {
  const { run, isLoading } = useEasyAi();
  const [shortlist, setShortlist] = useState<ShortlistItem[] | null>(null);
  const ranking = isLoading("bulk-shortlist");
  const lifecycle = lifecycleOf(job.status, companyVerified);
  const isPublic = lifecycle === "active";
  const hasApplicants = totalApplicants > 0;
  const posted = new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  async function rankTopTen() {
    const res = await run<{ shortlist: ShortlistItem[] }>("bulk-shortlist", { jobId: job.id, limit: 10 });
    // The AI route returns either the list itself or { shortlist }.
    const payload = res?.data as { shortlist?: ShortlistItem[] } | ShortlistItem[] | null | undefined;
    if (!res?.configured || !payload) return;
    setShortlist(Array.isArray(payload) ? payload : (payload.shortlist ?? null));
  }

  const menuItems: MenuItem[] = [
    { label: "View listing", icon: <ExternalLink />, href: `/jobs/${job.id}`, external: true, hidden: !isPublic },
    { label: "Hiring setup", icon: <Settings2 />, href: `/employer/jobs/${job.id}/hiring-setup` },
    {
      label: "Export applicants (CSV)",
      icon: <Download />,
      href: `/api/employer/exports/applicants?jobId=${encodeURIComponent(job.id)}`,
      native: true,
    },
  ];

  return (
    <div className="mb-4 flex flex-col gap-4">
      <Link
        href="/employer/jobs"
        className="inline-flex w-fit items-center gap-1.5 rounded-chip text-ui text-eh-muted transition-colors duration-150 hover:text-eh-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] text-eh-ink">
              {job.title}
            </h1>
            <JobStatusBadge lifecycle={lifecycle} severity={waitSeverity} />
          </div>
          <p className="mt-1.5 text-ui text-eh-muted">{formatJobSubtitle(job)}</p>
          <p className="num mt-1 text-small text-eh-muted">
            <b className="font-semibold text-eh-ink">{totalApplicants}</b>{" "}
            {totalApplicants === 1 ? "applicant" : "applicants"} · Posted {posted}
            {hasApplicants && (
              <>
                {" · "}
                <b className="font-semibold text-eh-ink">
                  {pipeline.hired} / {job.targetHireCount}
                </b>{" "}
                hired
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasApplicants && (
            <Button icon={<Sparkles />} loading={ranking} onClick={() => void rankTopTen()}>
              {ranking ? "Ranking…" : "Easy AI top 10"}
            </Button>
          )}
          <Button href={`/employer/jobs/${job.id}/edit`} icon={<Pencil />}>
            Edit job
          </Button>
          <DropdownMenu
            label={`More actions for ${job.title}`}
            tooltip="More actions"
            triggerVariant="outline"
            triggerSize="md"
            items={menuItems}
          />
        </div>
      </div>

      {shortlist && shortlist.length > 0 && (
        <section
          aria-label="Easy AI top 10"
          className="rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-ui font-semibold text-eh-teal-ink">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Easy AI top {shortlist.length}
            </p>
            <button
              type="button"
              onClick={() => setShortlist(null)}
              aria-label="Dismiss Easy AI ranking"
              className="grid h-7 w-7 place-items-center rounded-chip text-eh-muted transition-colors duration-150 hover:bg-eh-surface hover:text-eh-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ol className="mt-2 grid gap-x-6 gap-y-1.5 text-small text-eh-ink-2 md:grid-cols-2">
            {shortlist.map((item) => (
              <li key={item.applicationId} className="flex min-w-0 gap-2">
                <span className="num w-7 shrink-0 font-semibold text-eh-teal-ink">{item.score}</span>
                <span className="min-w-0">
                  <b className="font-semibold text-eh-ink">{item.seekerName}</b> — {item.reasons?.[0] ?? "Strong fit"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-micro text-eh-muted">
            Advisory only — move candidates yourself after review. Easy AI never rejects anyone.
          </p>
        </section>
      )}

      {hasApplicants && (
        <div className="flex flex-col gap-3 border-t border-eh-line pt-3 lg:flex-row lg:items-center">
          <div role="group" aria-label="Jump to stage" className="flex flex-wrap gap-2">
            {[...PRO_STAGES, ...(pipeline.rejected > 0 ? [PRO_REJECTED_STAGE] : [])].map((stage) => {
              const count =
                stage.status === "REJECTED" ? pipeline.rejected : pipeline[stage.status.toLowerCase() as keyof PipelineCounts];
              const active = activeStage === stage.status;
              return (
                <button
                  key={stage.status}
                  type="button"
                  onClick={() => onStageSelect(stage.status)}
                  aria-pressed={active}
                  className={cx(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-ui transition-colors duration-150",
                    active
                      ? "border-eh-ink bg-eh-ink font-medium text-eh-surface"
                      : "border-eh-line bg-eh-surface text-eh-ink-2 hover:border-eh-muted hover:text-eh-ink"
                  )}
                >
                  <span className={cx("h-1.5 w-1.5 rounded-full", stage.dot)} aria-hidden="true" />
                  {stage.label}
                  <span className={cx("num text-xs", active ? "text-eh-surface/70" : "text-eh-muted")}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 lg:ml-auto">
            <div className="hidden w-44 xl:block">
              <PipelineMini
                className="[&>div:first-child]:h-2"
                stages={PRO_STAGES.map((s) => ({
                  label: s.label,
                  value: pipeline[s.status.toLowerCase() as keyof PipelineCounts],
                  tone: s.tone,
                }))}
              />
            </div>
            <Button
              size="sm"
              icon={<CheckSquare />}
              aria-pressed={selectionMode}
              onClick={onToggleSelection}
              className={selectionMode ? "border-eh-marigold! bg-eh-marigold-tint!" : undefined}
            >
              {selectionMode ? "Done selecting" : "Select candidates"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
