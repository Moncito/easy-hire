import { CircleDashed, ShieldAlert } from "lucide-react";
import { TrustScoreValue, VerificationStatusBadge, formatDateTime, titleCaseFromConstant } from "./badges";
import type { SerializedTrustComputation, VerificationStatus } from "./types";

/**
 * Trust panel — docs/ADMIN-CONSOLE-PLAN.md §4.3: "Trust panel: trust score
 * with component breakdown, verification status, reports filed against them,
 * reports they filed." Generic over seeker/employer/company so
 * UserRecordView and CompanyDetailView both use it — the score + the
 * component-breakdown explainability contract is identical for both
 * (lib/admin/trust.ts's `TrustComputation`).
 *
 * A missing/negative-looking score is never a colour-only signal: every
 * contribution below carries its sign in text (+/-) as well as colour.
 */

export type TrustPanelExtraRow = { label: string; value: React.ReactNode; warn?: boolean };

export type TrustPanelProps = {
  trustScore: number | null;
  trustScoreUpdatedAt: string | null;
  trustSignals: SerializedTrustComputation | null;
  verificationStatus: VerificationStatus | null;
  extraRows?: TrustPanelExtraRow[];
};

function contributionLabel(key: string): string {
  // Component keys are short camelCase identifiers from lib/admin/trust.ts
  // (e.g. "idVerified", "abuseReports") — split camelCase into words, then
  // title-case, reusing the same word-join style as titleCaseFromConstant.
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return titleCaseFromConstant(spaced.replace(/\s+/g, "_"));
}

export default function TrustPanel({ trustScore, trustScoreUpdatedAt, trustSignals, verificationStatus, extraRows = [] }: TrustPanelProps) {
  return (
    <section aria-labelledby="trust-panel-heading" className="rounded-2xl border border-ink/5 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="trust-panel-heading" className="font-display text-lg font-bold text-ink">
            Trust
          </h2>
          {trustScoreUpdatedAt && (
            <p className="mt-0.5 text-xs text-ink/40">Last recomputed {formatDateTime(trustScoreUpdatedAt)}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {verificationStatus && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Verification</p>
              <VerificationStatusBadge status={verificationStatus} />
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Score</p>
            <div className="text-lg">
              <TrustScoreValue score={trustScore} />
            </div>
          </div>
        </div>
      </div>

      {extraRows.length > 0 && (
        <dl className="mb-4 grid grid-cols-2 gap-3 border-y border-ink/5 py-3 sm:grid-cols-4">
          {extraRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{row.label}</dt>
              <dd className={`mt-0.5 flex items-center gap-1 font-data text-sm font-semibold ${row.warn ? "text-ember" : "text-ink"}`}>
                {row.warn && <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {trustSignals === null ? (
        <div className="flex items-center gap-2 rounded-xl bg-mist/60 px-3 py-3 text-sm text-ink/50">
          <CircleDashed className="h-4 w-4 shrink-0" aria-hidden="true" />
          {trustScore === null
            ? "Not yet scored — the nightly trust cron scores accounts with recent activity."
            : "Component breakdown not available on this view."}
        </div>
      ) : (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">
            Component breakdown (baseline {trustSignals.baseline}, weights v{trustSignals.weightsVersion})
          </p>
          <ul className="space-y-1.5">
            {trustSignals.components.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 rounded-lg bg-mist/50 px-3 py-1.5 text-xs">
                <div className="min-w-0">
                  <span className="font-medium text-ink">{contributionLabel(c.key)}</span>
                  {Object.keys(c.inputs).length > 0 && (
                    <span className="ml-2 truncate text-ink/45">
                      {Object.entries(c.inputs)
                        .map(([k, v]) => `${contributionLabel(k)}: ${v}`)
                        .join(" · ")}
                    </span>
                  )}
                </div>
                <span
                  className={`shrink-0 font-data font-semibold ${
                    c.contribution > 0 ? "text-teal" : c.contribution < 0 ? "text-ember" : "text-ink/35"
                  }`}
                >
                  {c.contribution > 0 ? "+" : ""}
                  {c.contribution}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
