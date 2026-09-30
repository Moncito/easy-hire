"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Clock, MoreHorizontal, X } from "lucide-react";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import RejectCandidateModal from "@/components/employer/RejectCandidateModal";
import { patchApplication } from "@/lib/client/applications";
import type { InProgressCandidate, QueueItem } from "@/lib/employer/dashboard-decisions";

const STAGE_LABEL = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", INTERVIEW: "Interview" } as const;
const STAGE_DOT = { APPLIED: "bg-eh-muted", SHORTLISTED: "bg-eh-teal", INTERVIEW: "bg-eh-marigold" } as const;
/** Matches DECISION_TARGET_DAYS: past this, the wait is a genuine warning. */
const OVERDUE_DAYS = 14;

type Props = {
  queue: QueueItem[];
  queueTotal: number;
  inProgress: InProgressCandidate[];
  inProgressCandidateCount: number;
  inProgressApplicationCount: number;
  /** Hiring-defaults rejection message; the reject dialog opens with it. */
  defaultRejectionMessage: string | null;
};

function applicantsHref(item: { jobId: string; applicationId: string }) {
  return `/employer/jobs/${item.jobId}/applicants?application=${item.applicationId}`;
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * "Needs your decision" plus "In progress, by candidate". Shortlist and
 * Reject call the same PATCH /api/applications/[id] the applicants board
 * uses, so emails, stage history and caches behave identically. Both are
 * optimistic: the row leaves the queue at once, and comes back with an
 * error if the request fails. Reject goes through the existing confirmation
 * dialog — it emails the candidate, so it's never one click.
 */
export default function ProDecisionQueue({
  queue,
  queueTotal,
  inProgress,
  inProgressCandidateCount,
  inProgressApplicationCount,
  defaultRejectionMessage,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<QueueItem | null>(null);
  const [rejectError, setRejectError] = useState("");

  const visible = queue.filter((item) => !handled.has(item.applicationId));
  const remaining = Math.max(0, queueTotal - handled.size);
  const [hero, ...rest] = visible;

  async function decide(item: QueueItem, body: Record<string, unknown>) {
    setError(null);
    setBusyId(item.applicationId);
    setHandled((prev) => new Set(prev).add(item.applicationId));
    try {
      await patchApplication(item.applicationId, body);
      startTransition(() => router.refresh());
      return true;
    } catch (err) {
      setHandled((prev) => {
        const next = new Set(prev);
        next.delete(item.applicationId);
        return next;
      });
      setError(err instanceof Error ? err.message : "Couldn't update that application. Please try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(reason: string) {
    if (!rejecting) return;
    setRejectError("");
    const ok = await decide(rejecting, { status: "REJECTED", rejectionReason: reason || null });
    if (ok) setRejecting(null);
    else setRejectError("Couldn't reject this application. Please try again.");
  }

  return (
    <section
      aria-labelledby="pro-decisions-heading"
      className="rounded-card border border-eh-line bg-eh-surface pb-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-5 pt-4">
        <h2 id="pro-decisions-heading" className="whitespace-nowrap text-card-title text-eh-ink">
          Needs your decision
        </h2>
        <span className="num whitespace-nowrap text-ui text-eh-muted">{plural(remaining, "application")}</span>
        <Link
          href="/employer/applicants?filter=NEEDS_REVIEW"
          className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-ui text-eh-muted transition hover:text-eh-ink"
        >
          All applicants
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {error ?? ""}
      </div>
      {error && <p className="mx-5 mt-3 text-ui text-eh-danger">{error}</p>}

      {hero ? (
        <div
          className={`mx-5 mt-4 grid grid-cols-[auto_1fr] items-center gap-3.5 rounded-card border p-3.5 min-[861px]:grid-cols-[auto_1fr_auto] ${
            hero.waitingDays > OVERDUE_DAYS
              ? "border-[color-mix(in_srgb,var(--eh-danger)_30%,var(--eh-line))] bg-eh-danger-tint"
              : "border-[color-mix(in_srgb,var(--eh-marigold)_35%,var(--eh-line))] bg-eh-marigold-tint"
          }`}
        >
          <EmployerAvatar name={hero.seekerName} imageUrl={hero.seekerPhotoUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-eh-ink">{hero.seekerName}</p>
            <p className="truncate text-ui text-eh-muted">
              {hero.role} · Applied {hero.appliedLabel}
            </p>
            <p
              className={`num mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                hero.waitingDays > OVERDUE_DAYS ? "text-eh-danger" : "text-eh-marigold-ink"
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Waiting {plural(hero.waitingDays, "day")}
            </p>
          </div>
          <div className="col-span-2 flex flex-wrap gap-1.5 min-[861px]:col-span-1 min-[861px]:justify-end">
            <button
              type="button"
              onClick={() => {
                setRejectError("");
                setRejecting(hero);
              }}
              disabled={busyId !== null}
              className="inline-flex h-[30px] items-center gap-1 rounded-control px-2.5 text-small font-medium text-eh-muted transition hover:bg-eh-surface hover:text-eh-ink disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Reject
            </button>
            <Link
              href={applicantsHref(hero)}
              className="inline-flex h-[30px] items-center rounded-control border border-eh-line bg-eh-surface px-2.5 text-small font-medium text-eh-ink transition hover:bg-eh-surface-2"
            >
              View profile
            </Link>
            <button
              type="button"
              onClick={() => decide(hero, { status: "SHORTLISTED" })}
              disabled={busyId !== null}
              className="inline-flex h-[30px] items-center gap-1 rounded-control border border-[color-mix(in_srgb,var(--eh-success)_40%,var(--eh-line))] bg-eh-surface px-2.5 text-small font-medium text-eh-success transition hover:bg-eh-success-tint disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Shortlist
            </button>
          </div>
        </div>
      ) : (
        <p className="mx-5 mt-4 rounded-card border border-eh-line bg-eh-surface-2 px-4 py-3 text-ui text-eh-muted">
          Nothing waiting for a decision. New applications will show up here.
        </p>
      )}

      {rest.length > 0 && (
        <ul className="mt-2">
          {rest.map((item) => (
            <li key={item.applicationId} className="flex items-center gap-3 px-5 py-2.5">
              <EmployerAvatar name={item.seekerName} imageUrl={item.seekerPhotoUrl} size="sm" />
              <p className="min-w-0 flex-1 truncate text-ui">
                <span className="font-semibold text-eh-ink">{item.seekerName}</span>
                <span className="text-eh-muted"> · {item.role}</span>
              </p>
              <span
                className={`num shrink-0 text-xs font-medium ${
                  item.waitingDays > OVERDUE_DAYS ? "text-eh-danger" : "text-eh-muted"
                }`}
              >
                {plural(item.waitingDays, "day")}
              </span>
              <Link
                href={applicantsHref(item)}
                className="shrink-0 rounded-control px-2 py-1 text-small font-medium text-eh-ink transition hover:bg-eh-surface-2"
              >
                Review
              </Link>
            </li>
          ))}
          {remaining > visible.length && (
            <li className="num px-5 py-1 text-xs text-eh-muted">+{remaining - visible.length} more in All applicants</li>
          )}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap justify-between gap-x-3 px-5 pb-1.5 pt-4 text-ui text-eh-muted">
        <span className="whitespace-nowrap">In progress, by candidate</span>
        <span className="num whitespace-nowrap">
          {plural(inProgressCandidateCount, "candidate")} · {plural(inProgressApplicationCount, "application")}
        </span>
      </div>
      {inProgress.length === 0 ? (
        <p className="px-5 pb-3 text-ui text-eh-muted">No open applications on active roles.</p>
      ) : (
        <ul>
          {inProgress.map((candidate, index) => (
            <li
              key={candidate.seekerId}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 ${
                index > 0 ? "border-t border-eh-line" : ""
              }`}
            >
              <EmployerAvatar name={candidate.name} imageUrl={candidate.photoUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-eh-ink">{candidate.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {candidate.applications.map((app) => (
                    <Link
                      key={app.applicationId}
                      href={applicantsHref(app)}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-chip border border-eh-line bg-eh-surface-2 px-2 py-0.5 text-xs text-eh-ink-2 transition hover:border-eh-muted"
                    >
                      <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${STAGE_DOT[app.status]}`} aria-hidden="true" />
                      <span className="truncate">
                        {app.role} · {STAGE_LABEL[app.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href={`/employer/talent/${candidate.seekerId}`}
                className="grid h-[30px] w-[30px] place-items-center rounded-control text-eh-muted transition hover:border hover:border-eh-line hover:bg-eh-surface hover:text-eh-ink"
                aria-label={`Open ${candidate.name}'s profile`}
                title="Open profile"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {inProgressCandidateCount > inProgress.length && (
            <li className="num border-t border-eh-line px-5 py-2.5 text-xs text-eh-muted">
              +{inProgressCandidateCount - inProgress.length} more candidates in Applicants
            </li>
          )}
        </ul>
      )}

      <RejectCandidateModal
        open={rejecting !== null}
        candidateName={rejecting?.seekerName ?? ""}
        loading={busyId !== null}
        error={rejectError}
        onCancel={() => setRejecting(null)}
        onConfirm={confirmReject}
        defaultReason={defaultRejectionMessage ?? ""}
      />
    </section>
  );
}
