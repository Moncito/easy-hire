import { RotateCcw } from "lucide-react";
import type { RecentOverturn } from "@/lib/admin/queues";

/**
 * "Recent overturns — the quality signal, not the volume signal"
 * (docs/ADMIN-CONSOLE-PLAN.md §4.1 Band 3). Each row names the ORIGINAL
 * admin and action, the OVERTURNING admin and action, and both timestamps —
 * per the plan's own wording, never collapsed down to just a count. An empty
 * list is rendered as an explicit, neutral "no overturns" note (a genuinely
 * good sign, not a null/blocked state, so it does not use the dashed
 * not-available visual language) — never a blank space.
 */

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function RecentOverturnsPanel({ overturns }: { overturns: RecentOverturn[] }) {
  if (overturns.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-ink/5 bg-mist/60 px-4 py-6 text-sm text-ink/50 admin-dark:border-white/10 admin-dark:bg-white/5 admin-dark:text-mist/50">
        <RotateCcw className="h-4 w-4 shrink-0 text-ink/30 admin-dark:text-mist/35" aria-hidden="true" />
        No overturns recorded — no rejected decision has been reversed on appeal.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white admin-dark:divide-white/10 admin-dark:border-white/10 admin-dark:bg-white/5">
      {overturns.map((o) => (
        <li
          key={`${o.targetType}-${o.targetId}`}
          className="flex items-start gap-2.5 px-4 py-3"
        >
          <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy admin-dark:text-teal" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink admin-dark:text-mist">
              {o.targetType}{" "}
              <span className="font-data text-xs font-normal text-ink/40 admin-dark:text-mist/45">
                #{o.targetId.slice(0, 8)}
              </span>
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/60 admin-dark:text-mist/60">
              <span className={o.originalAdminEmail ? "" : "italic"}>
                {o.originalAdminEmail ?? "unknown admin"}
              </span>{" "}
              {actionLabel(o.originalAction)} on{" "}
              <span className="font-data">{formatTimestamp(o.originalDecidedAt)}</span> — reversed by{" "}
              <span className={o.overturnAdminEmail ? "" : "italic"}>
                {o.overturnAdminEmail ?? "unknown admin"}
              </span>{" "}
              ({actionLabel(o.overturnAction)}) on{" "}
              <span className="font-data">{formatTimestamp(o.overturnedAt)}</span>.
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
