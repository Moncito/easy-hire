"use client";

import { useState } from "react";
import { Briefcase, FileText, ShieldCheck } from "lucide-react";
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
} from "./offer-view";
import type { CandidateApplication } from "./types";
import { formatAppliedAt } from "./utils";

type Props = OfferPanelProps & {
  application: CandidateApplication;
  /** Server render time, for "N days left". */
  nowMs: number;
  onStatusChange: (status: string) => void;
};

const PRIMARY_CLASS =
  "inline-flex items-center gap-1.5 rounded-xl bg-teal px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-teal/15 transition hover:bg-teal/95 disabled:opacity-50";
const SECONDARY_CLASS =
  "inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 transition hover:bg-ink/3 disabled:opacity-50";

function RateLine({ offer, full }: { offer: Pick<JobOffer, "monthlyRateCents" | "hourlyRateCents" | "currency">; full?: JobOffer }) {
  return (
    <span className="font-data text-xs font-semibold text-ink">
      {formatRate(offer)}
      {full?.hoursPerWeek ? <span className="font-normal text-ink/50"> · {full.hoursPerWeek} h/wk</span> : null}
      {full?.startDate ? <span className="font-normal text-ink/50"> · starts {formatAppliedAt(full.startDate)}</span> : null}
    </span>
  );
}

/** Free-tree "Next step" box. Sits under the stage stepper in the panel header. */
export function CandidateNextStep({
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
    <section aria-label="Next step" className="mt-3 rounded-xl border border-teal/15 bg-teal/5 p-3.5">
      {step.kind === "review" ? (
        <>
          <p className="text-xs font-semibold text-teal">New application</p>
          <p className="mt-0.5 text-sm text-ink/70">Shortlist {name} if they look like a fit.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onStatusChange("SHORTLISTED")} className={PRIMARY_CLASS}>
              Shortlist
            </button>
          </div>
        </>
      ) : null}

      {step.kind === "offer" ? (
        <>
          <p className="text-xs font-semibold text-teal">Next step</p>
          <p className="mt-0.5 text-sm text-ink/70">
            Ready to hire {name}? Send an offer — they accept on EasyHire and the hire is verified.
          </p>
          {closed ? (
            <p className={`mt-1.5 text-xs ${closedOfferText(closed).warn ? "text-ember" : "text-ink/50"}`}>
              {closedOfferText(closed).text}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {onMakeOffer ? (
              <button type="button" onClick={onMakeOffer} className={PRIMARY_CLASS}>
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Make offer
              </button>
            ) : null}
            {step.canInterview ? (
              <button type="button" onClick={() => onStatusChange("INTERVIEW")} className={SECONDARY_CLASS}>
                Move to interview
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {step.kind === "waiting" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">
            Waiting for {name} · {daysLeftLabel(step.daysLeft)}
          </span>
          <RateLine offer={step.offer} full={offers?.find((o) => o.id === step.offer.id)} />
          <button
            type="button"
            onClick={() => onWithdrawOffer?.(step.offer.id)}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink/55 transition hover:bg-ink/5 hover:text-ink"
          >
            Withdraw
          </button>
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
          <span className="text-xs font-semibold text-teal">
            Offer accepted{accepted.respondedAt ? ` ${formatAppliedAt(accepted.respondedAt)}` : ""}
          </span>
          <RateLine offer={accepted} full={accepted} />
        </div>
      ) : (
        <p className="mb-2 text-xs font-semibold text-teal">Hired</p>
      )}
      <ul className="divide-y divide-teal/10">
        {onGuaranteeInterest ? (
          <li className="flex items-center gap-2.5 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
            {done ? (
              <p role="status" className="min-w-0 flex-1 text-xs text-ink/60">
                {GUARANTEE_THANKS}
              </p>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">Protect this hire</p>
                  <p className="text-[11px] text-ink/50">{GUARANTEE_HINT}</p>
                </div>
                <button
                  type="button"
                  onClick={handleProtect}
                  disabled={busy}
                  className="shrink-0 rounded-lg border border-navy/25 bg-white px-2.5 py-1 text-xs font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "I'm interested"}
                </button>
              </>
            )}
          </li>
        ) : null}
        {showClose ? (
          <li className="flex items-center gap-2.5 py-2">
            <Briefcase className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-xs font-semibold text-ink">
              <span className="font-data">{hiredCount}</span> of <span className="font-data">{targetHireCount}</span> hired — close this job?
            </p>
            <button
              type="button"
              onClick={onCloseJob}
              className="shrink-0 rounded-lg border border-teal/30 bg-white px-2.5 py-1 text-xs font-semibold text-teal transition hover:bg-teal/5"
            >
              Close job
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
