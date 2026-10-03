"use client";

import { useState } from "react";
import { Briefcase, FileText, ShieldCheck } from "lucide-react";
import { Button, StatusBadge } from "@/components/employer/system";
import { formatRate, type JobOffer } from "@/lib/client/offers";
import {
  closedOfferText,
  currentOpenOffer,
  daysLeftLabel,
  firstName,
  GUARANTEE_HINT,
  GUARANTEE_THANKS,
  nextStep,
  type OfferPanelProps,
} from "@/components/employer/candidate-detail/offer-view";
import type { CandidateApplication } from "@/components/employer/candidate-detail/types";
import { formatAppliedAt } from "@/components/employer/candidate-detail/utils";

type Props = OfferPanelProps & {
  application: CandidateApplication;
  /** Server render time, for "N days left". */
  nowMs: number;
  onStatusChange: (status: string) => void;
};

function RateLine({ offer, full }: { offer: Pick<JobOffer, "monthlyRateCents" | "hourlyRateCents" | "currency">; full?: JobOffer }) {
  return (
    <span className="num text-ui font-semibold text-eh-ink">
      {formatRate(offer)}
      {full?.hoursPerWeek ? <span className="font-normal text-eh-muted"> · {full.hoursPerWeek} h/wk</span> : null}
      {full?.startDate ? <span className="font-normal text-eh-muted"> · starts {formatAppliedAt(full.startDate)}</span> : null}
    </span>
  );
}

/** Pro-tree "Next step" box, built on the employer design system. Sits under the stage stepper in the panel header. */
export function ProNextStep({
  application,
  nowMs,
  offers,
  onStatusChange,
  onMakeOffer,
  onWithdrawOffer,
  onGuaranteeInterest,
  hiredCount,
  targetHireCount,
  jobStatus,
  onCloseJob,
}: Props) {
  const name = firstName(application.seeker.fullName);
  const open = currentOpenOffer(application, offers, nowMs);
  const step = nextStep(application.status, open, nowMs);
  if (step.kind === "none") return null;

  const latest = offers?.[0];
  const closed = latest && (latest.status === "DECLINED" || latest.status === "EXPIRED" || latest.status === "WITHDRAWN") ? latest : null;

  return (
    <section
      aria-label="Next step"
      className="mt-4 rounded-card border border-eh-line bg-eh-marigold-tint p-3.5"
    >
      {step.kind === "review" ? (
        <>
          <p className="text-small font-semibold text-eh-ink">New application</p>
          <p className="mt-0.5 text-ui text-eh-ink-2">Shortlist {name} if they look like a fit.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="md" onClick={() => onStatusChange("SHORTLISTED")}>
              Shortlist
            </Button>
          </div>
        </>
      ) : null}

      {step.kind === "offer" ? (
        <>
          <p className="text-small font-semibold text-eh-ink">Next step</p>
          <p className="mt-0.5 text-ui text-eh-ink-2">
            Ready to hire {name}? Send an offer — they accept on EasyHire and the hire is verified.
          </p>
          {closed ? (
            <p className={`mt-1.5 text-small ${closedOfferText(closed).warn ? "text-eh-danger" : "text-eh-muted"}`}>
              {closedOfferText(closed).text}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {onMakeOffer ? (
              <Button variant="primary" size="md" icon={<FileText />} onClick={onMakeOffer}>
                Make offer
              </Button>
            ) : null}
            {step.canInterview ? (
              <Button variant="secondary" size="md" onClick={() => onStatusChange("INTERVIEW")}>
                Move to interview
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {step.kind === "waiting" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge tone="info" dot>
            Waiting for {name} · {daysLeftLabel(step.daysLeft)}
          </StatusBadge>
          <RateLine offer={step.offer} full={offers?.find((o) => o.id === step.offer.id)} />
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onWithdrawOffer?.(step.offer.id)}>
            Withdraw
          </Button>
        </div>
      ) : null}

      {step.kind === "hired" ? (
        <HiredChecklist
          key={application.id}
          accepted={latest?.status === "ACCEPTED" ? latest : undefined}
          onGuaranteeInterest={onGuaranteeInterest}
          hiredCount={hiredCount}
          targetHireCount={targetHireCount}
          jobStatus={jobStatus}
          onCloseJob={onCloseJob}
        />
      ) : null}
    </section>
  );
}

function HiredChecklist({
  accepted,
  onGuaranteeInterest,
  hiredCount,
  targetHireCount,
  jobStatus,
  onCloseJob,
}: Pick<OfferPanelProps, "onGuaranteeInterest" | "hiredCount" | "targetHireCount" | "jobStatus" | "onCloseJob"> & {
  accepted?: JobOffer;
}) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleProtect() {
    setBusy(true);
    try {
      const result = await onGuaranteeInterest?.();
      if (result !== false) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  const showClose =
    !!onCloseJob &&
    jobStatus === "ACTIVE" &&
    hiredCount != null &&
    targetHireCount != null &&
    hiredCount >= targetHireCount;

  return (
    <div>
      {accepted ? (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-small font-semibold text-eh-success">
            Offer accepted{accepted.respondedAt ? ` ${formatAppliedAt(accepted.respondedAt)}` : ""}
          </span>
          <RateLine offer={accepted} full={accepted} />
        </div>
      ) : (
        <p className="mb-2 text-small font-semibold text-eh-ink">Hired</p>
      )}
      <ul className="divide-y divide-eh-line">
        {onGuaranteeInterest ? (
          <li className="flex items-center gap-2.5 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-eh-navy" aria-hidden="true" />
            {done ? (
              <p role="status" className="min-w-0 flex-1 text-small text-eh-ink-2">
                {GUARANTEE_THANKS}
              </p>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold text-eh-ink">Protect this hire</p>
                  <p className="text-small text-eh-muted">{GUARANTEE_HINT}</p>
                </div>
                <Button variant="secondary" size="sm" loading={busy} onClick={handleProtect}>
                  I&apos;m interested
                </Button>
              </>
            )}
          </li>
        ) : null}
        {showClose ? (
          <li className="flex items-center gap-2.5 py-2">
            <Briefcase className="h-4 w-4 shrink-0 text-eh-muted" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-ui font-semibold text-eh-ink">
              <span className="num">{hiredCount}</span> of <span className="num">{targetHireCount}</span> hired — close this job?
            </p>
            <Button variant="secondary" size="sm" onClick={onCloseJob}>
              Close job
            </Button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
