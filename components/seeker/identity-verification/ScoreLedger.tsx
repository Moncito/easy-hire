import { useState } from "react";
import { AlertCircle, Circle, CircleCheck, CircleDot, ChevronDown, Clock } from "lucide-react";
import {
  VERIFICATION_SCORE_WEIGHTS,
  POINTS_PER_CONFIRMED_HIRE,
  verificationTier,
  type VerificationScoreBreakdown,
} from "@/lib/seeker/verification-score";
import type { ProfileBucketId } from "@/components/seeker/profile-buckets";

type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  score: number;
  breakdown: VerificationScoreBreakdown;
  status: IdVerificationStatus;
  profileBucketsCompleted: number;
  profileBucketsTotal: number;
  firstIncompleteBucket: ProfileBucketId | null;
  defaultExpanded: boolean;
};

const TIER_LABEL: Record<string, string> = {
  UNVERIFIED: "Unverified",
  BASIC: "Basic",
  STRONG: "Strong",
  TRUSTED: "Trusted",
};

type RowState = "done" | "partial" | "pending" | "rejected" | "todo";

function RowIcon({ state }: { state: RowState }) {
  const cls = "h-4 w-4 shrink-0";
  if (state === "done") return <CircleCheck className={`${cls} text-marigold`} aria-hidden="true" />;
  if (state === "partial") return <CircleDot className={`${cls} text-marigold/70`} aria-hidden="true" />;
  if (state === "pending") return <Clock className={`${cls} text-navy`} aria-hidden="true" />;
  if (state === "rejected") return <AlertCircle className={`${cls} text-ember/80`} aria-hidden="true" />;
  return <Circle className={`${cls} text-ink/25`} aria-hidden="true" />;
}

function LedgerRow({
  label,
  earned,
  max,
  state,
  statusText,
  action,
  muted,
}: {
  label: string;
  earned: number;
  max: number;
  state: RowState;
  statusText?: string;
  action?: { label: string; href: string };
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <RowIcon state={state} />
        <span className={`truncate text-sm ${muted ? "text-ink/60" : "text-ink"}`}>{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-data text-xs tabular-nums text-ink/55">
          {earned}/{max}
        </span>
        {action ? (
          <a href={action.href} className="text-xs font-semibold text-[#8a5a10] hover:underline">
            {action.label} →
          </a>
        ) : statusText ? (
          <span className={`text-xs ${state === "rejected" ? "text-ember/80" : "text-ink/45"}`}>{statusText}</span>
        ) : null}
      </div>
    </div>
  );
}

function Segment({ weight, earned }: { weight: number; earned: number }) {
  const pct = weight > 0 ? Math.min(100, Math.round((earned / weight) * 100)) : 0;
  return (
    <div className="h-full overflow-hidden rounded-full bg-ink/8" style={{ flexGrow: weight, flexBasis: 0 }}>
      <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ScoreLedger({
  score,
  breakdown,
  status,
  profileBucketsCompleted,
  profileBucketsTotal,
  firstIncompleteBucket,
  defaultExpanded,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const w = VERIFICATION_SCORE_WEIGHTS;
  const tier = verificationTier(score);
  const remainingBuckets = profileBucketsTotal - profileBucketsCompleted;

  const identityState: RowState =
    status === "APPROVED" ? "done" : status === "PENDING" ? "pending" : status === "REJECTED" ? "rejected" : "todo";
  const identityStatusText =
    status === "APPROVED"
      ? "Approved"
      : status === "PENDING"
        ? "In review"
        : status === "REJECTED"
          ? "Not approved"
          : "Not uploaded";

  const profileState: RowState = breakdown.profile >= w.profile ? "done" : breakdown.profile > 0 ? "partial" : "todo";
  const emailState: RowState = breakdown.email >= w.email ? "done" : "todo";
  const historyState: RowState =
    breakdown.history >= w.history ? "done" : breakdown.history > 0 ? "partial" : "todo";

  return (
    <div className="rounded-2xl border border-ink/8 bg-white/60">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="identity-score-ledger-detail"
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-ink">
          Identity confidence · <span className="font-data tabular-nums">{score}/100</span>
          <span className="ml-1.5 font-normal text-ink/45">· {TIER_LABEL[tier]}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div className="px-4 pb-3.5">
        <div
          role="img"
          aria-label={`Identity confidence: ${score} of 100.`}
          className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        >
          <Segment weight={w.identity} earned={breakdown.identity} />
          <Segment weight={w.profile} earned={breakdown.profile} />
          <Segment weight={w.history} earned={breakdown.history} />
          <Segment weight={w.email} earned={breakdown.email} />
        </div>
      </div>

      {expanded && (
        <div id="identity-score-ledger-detail" className="space-y-4 border-t border-ink/[0.06] px-4 py-4">
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">You control this</p>
            <LedgerRow
              label="Government ID approved"
              earned={breakdown.identity}
              max={w.identity}
              state={identityState}
              statusText={identityStatusText}
            />
            <LedgerRow
              label="Profile completeness"
              earned={breakdown.profile}
              max={w.profile}
              state={profileState}
              statusText={firstIncompleteBucket ? undefined : "All sections complete"}
              action={
                firstIncompleteBucket
                  ? {
                      label: `Finish ${remainingBuckets} section${remainingBuckets === 1 ? "" : "s"}`,
                      href: `/seeker/profile?bucket=${firstIncompleteBucket}`,
                    }
                  : undefined
              }
            />
          </div>
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">Earned automatically</p>
            <LedgerRow
              label="Verified email"
              earned={breakdown.email}
              max={w.email}
              state={emailState}
              statusText={emailState === "done" ? "Verified" : "Not verified yet"}
              muted
            />
            <LedgerRow
              label="Confirmed hires"
              earned={breakdown.history}
              max={w.history}
              state={historyState}
              statusText={`${POINTS_PER_CONFIRMED_HIRE} pts per company that hires you (max ${w.history / POINTS_PER_CONFIRMED_HIRE})`}
              muted
            />
          </div>
        </div>
      )}
    </div>
  );
}
