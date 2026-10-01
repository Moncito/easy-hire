import { Briefcase, Check, Clock, MessageSquare, Users } from "lucide-react";
import { MetricCard, TrendIndicator } from "@/components/employer/system";
import { waitSeverity } from "@/lib/employer/attention";
import type { DashboardKpis } from "@/lib/employer/dashboard-kpis";
import { waitBarGeometry } from "@/lib/employer/dashboard-kpis";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Server-rendered sparkline — no client JS for a 28px line. */
function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const max = Math.max(1, ...series);
  const step = 120 / (series.length - 1);
  const points = series.map((v, i) => `${(i * step).toFixed(1)},${(26 - (v / max) * 22).toFixed(1)}`).join(" ");
  return (
    <svg className="mt-auto h-7 w-full" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--eh-ink)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Delta({ current, previous, range }: { current: number; previous: number; range: DashboardRange }) {
  const diff = current - previous;
  const text = diff === 0 ? "±0" : diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
  return (
    <TrendIndicator
      direction={diff > 0 ? "up" : diff < 0 ? "down" : "flat"}
      title={`${plural(current, "application")} in the last ${range} days, ${previous} in the ${range} days before`}
    >
      {text} vs prev {range}d
    </TrendIndicator>
  );
}

const iconProps = { strokeWidth: 1.75, "aria-hidden": true } as const;

/**
 * Five KPI tiles (see lib/employer/dashboard-kpis.ts for exactly what each
 * counts). 5 columns on wide screens, 3 below 1180px, 2 below 860px, 1 below
 * 520px — viewport widths, as in the design.
 */
export default function ProKpiStrip({ kpis, range }: { kpis: DashboardKpis; range: DashboardRange }) {
  const { activeJobs, applicants, needsReview, interview, hired } = kpis;
  const waiting = needsReview.count > 0 && needsReview.oldestDays !== null;
  const wait = waiting ? waitBarGeometry(needsReview.oldestDays!, needsReview.targetDays) : null;
  // The shared two-level rule: marigold from 3 days, Ember only past the
  // 14-day target — a day-old application is routine.
  const severity = waiting ? waitSeverity(needsReview.oldestDays) : "none";
  const tone = severity === "none" ? "default" : severity;

  return (
    <section
      aria-label="Key numbers"
      className="grid grid-cols-1 gap-4 min-[521px]:grid-cols-2 min-[861px]:grid-cols-3 min-[1181px]:grid-cols-5"
    >
      <MetricCard
        label="Active jobs"
        icon={<Briefcase {...iconProps} />}
        value={activeJobs.count}
        description={
          <>
            <b className="num">{activeJobs.openings}</b> {activeJobs.openings === 1 ? "opening" : "openings"} ·{" "}
            <b className="num">{activeJobs.filled}</b> filled
          </>
        }
      />

      <MetricCard
        label="Applicants"
        icon={<Users {...iconProps} />}
        value={applicants.total}
        trend={<Delta current={applicants.inRange} previous={applicants.previousRange} range={range} />}
      >
        <Sparkline series={applicants.series} />
      </MetricCard>

      <MetricCard
        label="Needs review"
        icon={<Clock {...iconProps} />}
        value={needsReview.count}
        tone={tone}
        description={wait ? undefined : "All caught up"}
      >
        {wait && (
          <div className="mt-auto">
            <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-eh-line" aria-hidden="true">
              <i
                className={`absolute inset-y-0 left-0 rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${
                  severity === "none" ? "bg-eh-muted" : severity === "critical" ? "bg-eh-danger" : "bg-eh-marigold"
                }`}
                style={{ width: `${Math.round(wait.fill * 100)}%` }}
              />
              {wait.target < 1 && (
                <em
                  className="absolute -inset-y-0.5 w-0.5 bg-eh-ink-2 opacity-50"
                  style={{ left: `${(wait.target * 100).toFixed(1)}%` }}
                />
              )}
            </div>
            {/* Wraps to two lines in narrow tiles rather than truncating the day count. */}
            <p className="mt-1.5 flex flex-wrap justify-between gap-x-2 text-micro text-eh-muted">
              <span className="whitespace-nowrap">
                Oldest waiting{" "}
                <b
                  className={`num font-semibold ${
                    severity === "critical"
                      ? "text-eh-danger"
                      : severity === "attention"
                        ? "text-eh-marigold-ink"
                        : "text-eh-ink-2"
                  }`}
                >
                  {plural(needsReview.oldestDays!, "day")}
                </b>
              </span>
              <span className="num whitespace-nowrap">target {needsReview.targetDays}d</span>
            </p>
          </div>
        )}
      </MetricCard>

      <MetricCard
        label="In interview"
        icon={<MessageSquare {...iconProps} />}
        value={interview.count}
        description={
          interview.count === 0 ? (
            "None right now"
          ) : (
            <>
              <b className="num">{interview.candidates}</b> {interview.candidates === 1 ? "candidate" : "candidates"} across{" "}
              <b className="num">{interview.roles}</b> {interview.roles === 1 ? "role" : "roles"}
            </>
          )
        }
      />

      <MetricCard
        label="Hired"
        icon={<Check {...iconProps} />}
        value={hired.count}
        description={
          hired.rate === null ? (
            "No applicants yet"
          ) : (
            <>
              Hire rate <b className="num">{hired.rate}%</b> of applicants
            </>
          )
        }
      />
    </section>
  );
}