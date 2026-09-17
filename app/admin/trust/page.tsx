import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listTrustDirectory, encodeTrustDirectoryCursor } from "@/lib/admin/trust-directory";
import TrustDirectory from "@/components/admin/trust/TrustDirectory";

/**
 * `/admin/trust` — the risk-ranked trust directory (docs/ADMIN-CONSOLE-PLAN.md
 * §4.8, §11 Phase 4 gate: "a risky account surfaces before a human reports
 * it"). Server component renders the first page by calling
 * `listTrustDirectory` directly (§5: "Server components for reads"),
 * gated on `user.read` — matches `GET /api/admin/trust`. `TrustDirectory`
 * (client) handles switching between SEEKER/COMPANY and paging against that
 * route.
 */
export default async function AdminTrustPage() {
  const ctx = await requireAdminPagePermission("user.read");

  const result = await listTrustDirectory(ctx.userId, { targetType: "SEEKER", limit: 25 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Trust / Scores</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Trust scores</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Every scored account, ranked lowest score first — the accounts most likely to need attention next. Open
          abuse reports are shown alongside the score so the two halves of trust &amp; safety read as one screen.
        </p>
      </div>

      <TrustDirectory
        initialTargetType="SEEKER"
        initialRows={JSON.parse(JSON.stringify(result.rows))}
        initialNextCursor={result.nextCursor ? encodeTrustDirectoryCursor(result.nextCursor) : null}
        initialScoredCount={result.scoredCount}
        initialNeverScoredCount={result.neverScoredCount}
        initialBelowThresholdCount={result.belowThresholdCount}
        initialScoreDistribution={result.scoreDistribution}
      />
    </div>
  );
}
