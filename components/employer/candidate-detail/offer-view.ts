import type { JobOffer } from "@/lib/client/offers";
import { periodSuffix, type SalaryPeriod } from "@/lib/shared/format";
import type { PendingOfferSummary } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** What the Offer section of a candidate panel should show. Shared by the Free and Pro trees (logic only; each draws its own UI). */
export type OfferView =
  | { kind: "none"; canOffer: boolean }
  | { kind: "pending"; offer: JobOffer }
  | { kind: "accepted"; offer: JobOffer }
  | { kind: "closed"; offer: JobOffer; canOffer: boolean };

export function deriveOfferView(offers: JobOffer[] | undefined, applicationStatus: string): OfferView {
  const canOffer = applicationStatus !== "HIRED" && applicationStatus !== "REJECTED";
  const latest = offers?.[0];
  if (!latest) return { kind: "none", canOffer };
  if (latest.status === "PENDING") return { kind: "pending", offer: latest };
  if (latest.status === "ACCEPTED") return { kind: "accepted", offer: latest };
  return { kind: "closed", offer: latest, canOffer };
}

export function closedOfferText(offer: JobOffer): { text: string; warn: boolean } {
  switch (offer.status) {
    case "DECLINED":
      return { text: offer.declineReason ? `Last offer declined: ${offer.declineReason}` : "Last offer declined", warn: true };
    case "EXPIRED":
      return { text: "Last offer expired", warn: true };
    default:
      return { text: "Last offer withdrawn", warn: false };
  }
}

export const GUARANTEE_HINT = "Replacement guarantee, coming soon.";
export const GUARANTEE_THANKS = "Thanks — we'll let you know when it's ready.";

export type OfferPanelProps = {
  offers?: JobOffer[];
  offersLoading?: boolean;
  onMakeOffer?: () => void;
  onWithdrawOffer?: (offerId: string) => void;
  onGuaranteeInterest?: () => Promise<boolean> | void;
  /** Job facts for the after-hire checklist ("2 of 2 hired — close this job?"). */
  hiredCount?: number;
  targetHireCount?: number;
  jobStatus?: string;
  /** Opens the board's close-job confirmation. */
  onCloseJob?: () => void;
};

/** First word of a full name, for sentences like "Shortlist Ana if they look like a fit." */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** The candidate's open offer when it has not run out yet, else null. */
export function openOffer(app: { offers?: PendingOfferSummary[] }, nowMs: number): PendingOfferSummary | null {
  const pending = app.offers?.find((o) => o.status === "PENDING");
  if (!pending) return null;
  return Date.parse(pending.expiresAt) > nowMs ? pending : null;
}

/**
 * The open offer for the panel: the full per-candidate list once it has
 * loaded (always current), otherwise the summary that came with the board.
 */
export function currentOpenOffer(
  app: { offers?: PendingOfferSummary[] },
  fullList: JobOffer[] | undefined,
  nowMs: number
): PendingOfferSummary | null {
  return openOffer({ offers: fullList ? fullList.filter((o) => o.status === "PENDING") : app.offers }, nowMs);
}

/** Whole days left, rounded up, never below zero. */
/**
 * Rounded, not ceiled: `nowMs` is the page's server-render time, which can be
 * slightly older than an offer created afterwards on the same page, so a
 * fresh 7-day offer measures 7.00x days and ceil would show "8 days left".
 */
export function daysLeft(expiresAt: string, nowMs: number): number {
  return Math.max(0, Math.round((Date.parse(expiresAt) - nowMs) / DAY_MS));
}

export function daysLeftLabel(days: number): string {
  if (days <= 0) return "Expires today";
  return `${days} ${days === 1 ? "day" : "days"} left`;
}

export type NextStep =
  | { kind: "review" }
  | { kind: "offer"; canInterview: boolean }
  | { kind: "waiting"; offer: PendingOfferSummary; daysLeft: number }
  | { kind: "hired" }
  | { kind: "none" };

/**
 * What the employer should do next with this candidate. `openPendingOffer` is
 * the candidate's pending offer if they have one (see currentOpenOffer).
 */
export function nextStep(
  status: string,
  openPendingOffer: PendingOfferSummary | null,
  nowMs: number
): NextStep {
  if (status === "REJECTED") return { kind: "none" };
  if (status === "HIRED") return { kind: "hired" };
  if (openPendingOffer && Date.parse(openPendingOffer.expiresAt) > nowMs) {
    return { kind: "waiting", offer: openPendingOffer, daysLeft: daysLeft(openPendingOffer.expiresAt, nowMs) };
  }
  if (status === "SHORTLISTED" || status === "INTERVIEW") {
    return { kind: "offer", canInterview: status === "SHORTLISTED" };
  }
  return { kind: "review" };
}

/** An offer can be started unless the candidate is hired/rejected or already has one open. */
export function canStartOffer(status: string, hasOpenOffer: boolean): boolean {
  return status !== "HIRED" && status !== "REJECTED" && !hasOpenOffer;
}

export type StepperStageKey = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED";
export type StepperStage = {
  key: StepperStageKey;
  label: string;
  state: "complete" | "current" | "upcoming";
};

const STEPPER_ORDER: { key: StepperStageKey; label: string }[] = [
  { key: "APPLIED", label: "Applied" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
];

/**
 * The five-segment panel stepper. "Offer" is not an application status: it is
 * complete once an offer was accepted (or the candidate is hired), current
 * while an offer is open, otherwise upcoming.
 */
export function stepperStages(status: string, hasOpenOffer: boolean, offerAccepted: boolean): StepperStage[] {
  const statusLevel = Math.max(0, ["APPLIED", "SHORTLISTED", "INTERVIEW"].indexOf(status));
  const level = status === "HIRED" ? 4 : hasOpenOffer ? 3 : statusLevel;
  return STEPPER_ORDER.map((stage, i) => {
    let state: StepperStage["state"] = i < level ? "complete" : i === level ? "current" : "upcoming";
    if (stage.key === "OFFER" && offerAccepted) state = "complete";
    return { ...stage, state };
  });
}

export type OfferPrefill = {
  rateType: "MONTHLY" | "HOURLY";
  /** Posted minimum, offered as the starting amount. Absent for annual salaries. */
  amount?: number;
  /** "$30,000–$45,000/mo", shown under the amount field. */
  rangeLabel?: string;
  /** Posted bounds in the same unit as rateType; only set when the period is monthly or hourly. */
  min?: number | null;
  max?: number | null;
};

export function offerPrefill(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
}): OfferPrefill {
  const period = (job.salaryPeriod === "HOURLY" || job.salaryPeriod === "ANNUAL" ? job.salaryPeriod : "MONTHLY") as SalaryPeriod;
  const rateType = period === "HOURLY" ? "HOURLY" : "MONTHLY";
  const { salaryMin, salaryMax } = job;

  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  const suffix = periodSuffix(period);
  let rangeLabel: string | undefined;
  if (salaryMin != null && salaryMax != null) {
    rangeLabel = `${money(Math.min(salaryMin, salaryMax))}–${money(Math.max(salaryMin, salaryMax))}${suffix}`;
  } else if (salaryMin != null) {
    rangeLabel = `From ${money(salaryMin)}${suffix}`;
  } else if (salaryMax != null) {
    rangeLabel = `Up to ${money(salaryMax)}${suffix}`;
  }

  const comparable = period !== "ANNUAL";
  return {
    rateType,
    amount: comparable && salaryMin != null && salaryMin > 0 ? salaryMin : undefined,
    rangeLabel,
    min: comparable ? salaryMin : undefined,
    max: comparable ? salaryMax : undefined,
  };
}
