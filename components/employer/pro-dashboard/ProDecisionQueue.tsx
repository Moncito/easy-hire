"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Inbox, UserRound, X } from "lucide-react";
import {
  Avatar,
  Button,
  CandidateReviewCard,
  Card,
  CardHeader,
  EmptyState,
} from "@/components/employer/system";
import RejectCandidateModal from "@/components/employer/RejectCandidateModal";
import { patchApplication } from "@/lib/client/applications";
import type { InProgressCandidate, QueueItem } from "@/lib/employer/dashboard-decisions";

const STAGE_LABEL = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", INTERVIEW: "Interview" } as const;
const STAGE_DOT = { APPLIED: "bg-eh-muted", SHORTLISTED: "bg-eh-teal", INTERVIEW: "bg-eh-marigold" } as const;

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
    <Card aria-labelledby="pro-decisions-heading" padded={false} className="pb-2">
      <CardHeader
        id="pro-decisions-heading"
        className="px-5 pt-5 sm:px-6"
        title="Needs your decision"
        description={<span className="num whitespace-nowrap">{plural(remaining, "application")}</span>}
        action={
          <Link
            href="/employer/applicants?filter=NEEDS_REVIEW"
            className="inline-flex items-center gap-1 whitespace-nowrap text-ui text-eh-muted transition hover:text-eh-ink"
          >
            All applicants
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <div role="status" aria-live="polite" className="sr-only">
        {error ?? ""}
      </div>
      {error && <p className="mx-5 mt-3 text-ui text-eh-danger sm:mx-6">{error}</p>}

      <div className="mx-5 mt-4 sm:mx-6">
        {hero ? (
          <CandidateReviewCard
            name={hero.seekerName}
            photoUrl={hero.seekerPhotoUrl}
            role={hero.role}
            appliedLabel={hero.appliedLabel}
            waitingDays={hero.waitingDays}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X />}
                  disabled={busyId !== null}
                  onClick={() => {
                    setRejectError("");
                    setRejecting(hero);
                  }}
                >
                  Reject
                </Button>
                <Button href={applicantsHref(hero)} size="sm">
                  View profile
                </Button>
                <Button
                  size="sm"
                  icon={<Check />}
                  disabled={busyId !== null}
                  onClick={() => decide(hero, { status: "SHORTLISTED" })}
                >
                  Shortlist
                </Button>
              </>
            }
          />
        ) : (
          <EmptyState
            compact
            icon={<Inbox />}
            title="Nothing waiting for a decision"
            description="New applications will show up here."
            className="rounded-card border border-eh-line bg-eh-surface-2 !py-6"
          />
        )}

        {rest.length > 0 && (
          <ul className="mt-2 divide-y divide-eh-line">
            {rest.map((item) => (
              <li key={item.applicationId}>
                <CandidateReviewCard
                  variant="row"
                  name={item.seekerName}
                  photoUrl={item.seekerPhotoUrl}
                  role={item.role}
                  waitingDays={item.waitingDays}
                  actions={
                    <Button href={applicantsHref(item)} variant="ghost" size="sm">
                      Review
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {remaining > visible.length && (
          <p className="num py-1 text-xs text-eh-muted">+{remaining - visible.length} more in All applicants</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-x-3 border-t border-eh-line px-5 pb-1.5 pt-4 text-ui text-eh-muted sm:px-6">
        <span className="whitespace-nowrap font-medium text-eh-ink-2">In progress, by candidate</span>
        <span className="num whitespace-nowrap">
          {plural(inProgressCandidateCount, "candidate")} · {plural(inProgressApplicationCount, "application")}
        </span>
      </div>
      {inProgress.length === 0 ? (
        <p className="px-5 pb-3 text-ui text-eh-muted sm:px-6">No open applications on active roles.</p>
      ) : (
        <ul className="divide-y divide-eh-line">
          {inProgress.map((candidate) => (
            <li key={candidate.seekerId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 sm:px-6">
              <Avatar name={candidate.name} src={candidate.photoUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-eh-ink">{candidate.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {candidate.applications.map((app) => (
                    <Link
                      key={app.applicationId}
                      href={applicantsHref(app)}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-eh-line bg-eh-surface-2 px-2 py-0.5 text-xs text-eh-ink-2 transition-colors duration-150 hover:border-eh-muted"
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
                aria-label={`Open ${candidate.name}'s profile`}
                title="Open profile"
                className="grid h-8 w-8 place-items-center rounded-control border border-transparent text-eh-muted transition-colors duration-150 hover:border-eh-line hover:bg-eh-surface hover:text-eh-ink"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {inProgressCandidateCount > inProgress.length && (
            <li className="num px-5 py-2.5 text-xs text-eh-muted sm:px-6">
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
    </Card>
  );
}