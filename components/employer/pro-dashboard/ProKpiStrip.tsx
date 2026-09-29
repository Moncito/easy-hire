import type { ReactNode } from "react";
import { Briefcase, Check, Clock, MessageSquare, Users } from "lucide-react";
import type { DashboardKpis } from "@/lib/employer/dashboard-kpis";
import { waitBarGeometry } from "@/lib/employer/dashboard-kpis";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function Tile({
  label,
  icon,
  urgent = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  urgent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[118px] flex-col gap-1.5 rounded-card border bg-eh-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
        urgent ? "border-[color-mix(in_srgb,var(--eh-danger)_35%,var(--eh-line))]" : "border-eh-line"
      }`}
    >
      <p className="flex items-center gap-1.5 text-ui text-eh-muted">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <p className="mt-auto text-small text-eh-muted [&_b]:font-medium [&_b]:text-eh-ink-2">{children}</p>;
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

function DeltaChip({ current, previous, range }: { current: number; previous: number; range: DashboardRange }) {
  const diff = current - previous;
  const text = diff === 0 ? "±0" : diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
  return (
    <span
      className={`num rounded-chip px-1.5 py-px text-xs font-medium ${
        diff > 0
          ? "bg-eh-success-tint text-eh-success"
          : "border border-eh-line bg-eh-surface-2 text-eh-muted"
      }`}
      title={`${plural(current, "application")} in the last ${range} days, ${previous} in the ${range} days before`}
    >
      {text} vs prev {range}d
    </span>
  );
}

const iconClass = "h-4 w-4 shrink-0";

/**
 * Five KPI tiles (see lib/employer/dashboard-kpis.ts for exactly what each
 * counts). 5 columns on wide screens, 3 below 1180px, 2 below 860px, 1 below
 * 520px — viewport widths, as in the design.
 */
export default function ProKpiStrip({ kpis, range }: { kpis: DashboardKpis; range: DashboardRange }) {
  const { activeJobs, applicants, needsReview, interview, hired } = kpis;
  const waiting = needsReview.count > 0 && needsReview.oldestDays !== null;
  const wait = waiting ? waitBarGeometry(needsReview.oldestDays!, needsReview.targetDays) : null;
  // Red only once the oldest wait is past the 14-day target: a two-day-old
  // application is routine, and Ember is reserved for genuine warnings.
  const urgent = wait?.overdue ?? false;

  return (
    <section
      aria-label="Key numbers"
      className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2 min-[861px]:grid-cols-3 min-[1181px]:grid-cols-5"
    >
      <Tile label="Active jobs" icon={<Briefcase className={iconClass} strokeWidth={1.75} aria-hidden="true" />}>
        <p className="num text-kpi text-eh-ink">{activeJobs.count}</p>
        <Footer>
          <b className="num">{activeJobs.openings}</b> {activeJobs.openings === 1 ? "opening" : "openings"} ·{" "}
          <b className="num">{activeJobs.filled}</b> filled
        </Footer>
      </Tile>

      <Tile label="Applicants" icon={<Users className={iconClass} strokeWidth={1.75} aria-hidden="true" />}>
        <p className="flex flex-wrap items-center gap-2">
          <span className="num text-kpi text-eh-ink">{applicants.total}</span>
          <DeltaChip current={applicants.inRange} previous={applicants.previousRange} range={range} />
        </p>
        <Sparkline series={applicants.series} />
      </Tile>

      <Tile
        label="Needs review"
        urgent={urgent}
        icon={<Clock className={iconClass} strokeWidth={1.75} aria-hidden="true" />}
      >
        <p className={`num text-kpi ${urgent ? "text-eh-danger" : "text-eh-ink"}`}>{needsReview.count}</p>
        {wait ? (
          <div className="mt-auto">
            <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-eh-line" aria-hidden="true">
              <i
                className={`absolute inset-y-0 left-0 rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${
                  urgent ? "bg-eh-danger" : "bg-eh-marigold"
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
            <p className="mt-1.5 flex justify-between gap-2 whitespace-nowrap text-micro text-eh-muted">
              <span className="min-w-0 truncate">
                Oldest waiting{" "}
                <b className={`num font-semibold ${urgent ? "text-eh-danger" : "text-eh-ink-2"}`}>
                  {plural(needsReview.oldestDays!, "day")}
                </b>
              </span>
              <span className="num">target {needsReview.targetDays}d</span>
            </p>
          </div>
        ) : (
          <Footer>All caught up</Footer>
        )}
      </Tile>

      <Tile label="In interview" icon={<MessageSquare className={iconClass} strokeWidth={1.75} aria-hidden="true" />}>
        <p className="num text-kpi text-eh-ink">{interview.count}</p>
        <Footer>
          {interview.count === 0 ? (
            "None right now"
          ) : (
            <>
              <b className="num">{interview.candidates}</b> {interview.candidates === 1 ? "candidate" : "candidates"} across{" "}
              <b className="num">{interview.roles}</b> {interview.roles === 1 ? "role" : "roles"}
            </>
          )}
        </Footer>
      </Tile>

      <Tile label="Hired" icon={<Check className={iconClass} strokeWidth={1.75} aria-hidden="true" />}>
        <p className="num text-kpi text-eh-ink">{hired.count}</p>
        <Footer>
          {hired.rate === null ? (
            "No applicants yet"
          ) : (
            <>
              Hire rate <b className="num">{hired.rate}%</b> of applicants
            </>
          )}
        </Footer>
      </Tile>
    </section>
  );
}
