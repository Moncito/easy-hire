import { AlertTriangle, CheckCircle2, Database, Server, Users2 } from "lucide-react";
import { formatDateTime } from "@/components/admin/directory/badges";
import CronHealthGrid from "./CronHealthGrid";
import NotInstrumentedPanel from "./NotInstrumentedPanel";
import type { SerializedSystemHealthReport } from "./types";

/**
 * `/admin/system` health screen — presentational, server-renderable (no
 * "use client": everything here is a read with no mutation, so a page reload
 * / re-navigation is the "refresh" affordance, same as any other admin server
 * component per §5 "server components for reads"). Section order mirrors the
 * task's own weighting: cron health first and largest (§4.10: "the most
 * operationally important block"), then reachability/config, then row
 * counts, then the not-instrumented group last.
 */

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="mb-3 font-display text-lg font-bold tracking-tight text-ink">
      {children}
    </h2>
  );
}

function ReachabilityTiles({ report }: { report: SerializedSystemHealthReport }) {
  const db = report.database;
  const dbOk = db.status === "ok";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Database round-trip */}
      <div className={`rounded-2xl border p-4 ${dbOk ? "border-ink/5 bg-white" : "border-ember/30 bg-ember/5"}`}>
        <div className="flex items-center gap-2 text-ink/45">
          <Database className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide">Database</p>
        </div>
        {dbOk ? (
          <p className="mt-2 flex items-center gap-1.5 font-data text-2xl font-bold text-ink">
            {db.latencyMs}
            <span className="text-sm font-medium text-ink/45">ms round-trip</span>
          </p>
        ) : (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-ember">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Unreachable
            </p>
            <p className="mt-1 text-xs text-ember/90">{db.error}</p>
          </>
        )}
      </div>

      {/* Redis */}
      <div className="rounded-2xl border border-ink/5 bg-white p-4">
        <div className="flex items-center gap-2 text-ink/45">
          <Server className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide">Redis</p>
        </div>
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${report.redis.configured ? "text-teal" : "text-ink/60"}`}>
          {report.redis.configured ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
          )}
          {report.redis.configured ? "Configured" : "No-op (not configured)"}
        </p>
        <p className="mt-1 text-xs text-ink/45">
          {report.redis.configured
            ? "Rate limiting and caching use the real Redis backend."
            : "Rate limiting and caching fall back to an in-process no-op — fine for a single instance, not a distributed guarantee."}
        </p>
      </div>

      {/* APP_URL fallback */}
      <div className={`rounded-2xl border p-4 ${report.appUrl.isFallback ? "border-ember/30 bg-ember/5" : "border-ink/5 bg-white"}`}>
        <div className="flex items-center gap-2 text-ink/45">
          <Server className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide">APP_URL</p>
        </div>
        {report.appUrl.isFallback ? (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-ember">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Falling back to localhost
            </p>
            <p className="mt-1 text-xs text-ember/90">
              `APP_URL` is not set. Emailed links (verification, password reset, notifications) point at localhost —
              this is a real problem if it is happening in production, not a neutral config detail.
            </p>
          </>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-teal">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Configured correctly
          </p>
        )}
      </div>
    </div>
  );
}

function RowCountTiles({ rowCounts }: { rowCounts: SerializedSystemHealthReport["rowCounts"] }) {
  const items: { label: string; value: number }[] = [
    { label: "Users", value: rowCounts.users },
    { label: "Companies", value: rowCounts.companies },
    { label: "Jobs", value: rowCounts.jobs },
    { label: "Applications", value: rowCounts.applications },
    { label: "Feature flags", value: rowCounts.featureFlags },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-ink/5 bg-white p-4">
          <div className="flex items-center gap-2 text-ink/45">
            <Users2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">{item.label}</p>
          </div>
          <p className="mt-1.5 font-data text-2xl font-bold text-ink">{item.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default function SystemHealthDashboard({ report }: { report: SerializedSystemHealthReport }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="cron-health-heading">
        <SectionHeading id="cron-health-heading">Cron health</SectionHeading>
        <CronHealthGrid cron={report.cron} />
      </section>

      <section aria-labelledby="reachability-heading">
        <SectionHeading id="reachability-heading">Reachability &amp; config</SectionHeading>
        <ReachabilityTiles report={report} />
      </section>

      <section aria-labelledby="row-counts-heading">
        <SectionHeading id="row-counts-heading">Row counts</SectionHeading>
        <RowCountTiles rowCounts={report.rowCounts} />
      </section>

      <section aria-labelledby="not-instrumented-heading">
        <SectionHeading id="not-instrumented-heading">Not instrumented</SectionHeading>
        <p className="mb-3 -mt-2 max-w-2xl text-sm text-ink/50">
          These are Vercel / Supabase / Resend dashboard metrics with no local source in this app, and the
          payment-webhook line is Phase 6 (no payment provider is integrated yet). Grouped here rather than mixed
          into the tiles above, so this screen reads as &ldquo;here is what we know, here is what we don&rsquo;t.&rdquo;
        </p>
        <NotInstrumentedPanel report={report} />
      </section>

      <p className="text-xs text-ink/35">Generated {formatDateTime(report.generatedAt)}</p>
    </div>
  );
}
