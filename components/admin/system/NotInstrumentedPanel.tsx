import { CircleDashed } from "lucide-react";
import type { SerializedSystemHealthMetric, SerializedSystemHealthReport } from "./types";

/**
 * The five not-instrumented metrics, grouped together deliberately (task
 * spec: "so the screen reads as 'here is what we know, here is what we don't'
 * rather than scattering them among live tiles"). Every row here is either a
 * real "ok" value (rendered as a plain number — future-proofed, since
 * `SerializedSystemHealthMetric<T>` is a real discriminated union and one of
 * these could legitimately flip to instrumented later) or an explicitly
 * dashed, differently-shaped "Not instrumented" chip carrying its reason as
 * visible text — never a bare `0` or an em dash styled like a real value.
 *
 * Alert thresholds (`SYSTEM_HEALTH_ALERT_THRESHOLDS`) are surfaced alongside
 * the metric they govern, per the task spec, even though that metric is not
 * instrumented: `dbConnectionCount`'s row shows the pooler-client threshold.
 * `dbCpuSustainedPercent` and `realtimeConnectionCount` govern metrics this
 * report has no field for at all (not even a "not_instrumented" placeholder —
 * there is no `SystemHealthReport` key for DB CPU or Realtime connections),
 * so those two thresholds are listed in a small reference line rather than
 * attached to a row that doesn't exist, so they are not silently dropped.
 */

type NotInstrumentedMetricKey =
  | "errorRate"
  | "p95LatencyJobsMs"
  | "p95LatencySeekerDashboardMs"
  | "dbConnectionCount"
  | "emailDeliveryRate"
  | "emailBounceRate"
  | "paymentWebhookSuccessRate";

type MetricRowDef = {
  key: NotInstrumentedMetricKey;
  label: string;
  unit?: string;
  thresholdNote?: string;
};

function metricRows(thresholds: SerializedSystemHealthReport["alertThresholds"]): MetricRowDef[] {
  return [
    { key: "errorRate", label: "Request error rate", unit: "%" },
    { key: "p95LatencyJobsMs", label: "p95 latency — /jobs", unit: "ms" },
    { key: "p95LatencySeekerDashboardMs", label: "p95 latency — /seeker/dashboard", unit: "ms" },
    {
      key: "dbConnectionCount",
      label: "DB / pooler connection count",
      thresholdNote: `Alert threshold: pooler clients > ${thresholds.poolerClientCount}`,
    },
    { key: "emailDeliveryRate", label: "Email delivery rate", unit: "%" },
    { key: "emailBounceRate", label: "Email bounce rate", unit: "%" },
    { key: "paymentWebhookSuccessRate", label: "Payment webhook success rate", unit: "%" },
  ];
}

function MetricValue({ metric, unit }: { metric: SerializedSystemHealthMetric<number>; unit?: string }) {
  if (metric.status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 font-data text-xs font-semibold text-teal">
        {metric.value}
        {unit ?? ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50">
      <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
      Not instrumented
    </span>
  );
}

export default function NotInstrumentedPanel({ report }: { report: SerializedSystemHealthReport }) {
  const rows = metricRows(report.alertThresholds);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-dashed border-ink/15 bg-mist/40">
        <ul className="divide-y divide-ink/10">
          {rows.map((row) => {
            const metric = report[row.key];
            return (
              <li key={row.key} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex items-start gap-2">
                  {metric.status !== "ok" && (
                    <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-ink/25" aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium text-ink/75">{row.label}</span>
                </div>
                <div className="sm:max-w-md sm:text-right">
                  <MetricValue metric={metric} unit={row.unit} />
                  {metric.status === "not_instrumented" && (
                    <p className="mt-1 text-xs text-ink/50">{metric.reason}</p>
                  )}
                  {row.thresholdNote && <p className="mt-1 text-[11px] font-data text-ink/40">{row.thresholdNote}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-2 text-[11px] text-ink/40">
        Two more alert thresholds have no corresponding local metric at all yet: DB CPU sustained &gt;{" "}
        {report.alertThresholds.dbCpuSustainedPercent}% and Realtime connections &gt;{" "}
        {report.alertThresholds.realtimeConnectionCount} — both are Supabase dashboard figures with no field on this
        report.
      </p>
    </div>
  );
}
