import Link from "next/link";
import { DASHBOARD_RANGES, type DashboardRange } from "@/lib/employer/dashboard-insights";

/**
 * 7d / 30d / 60d. Links rather than client state: the range lives in
 * `?range=`, so it survives reloads, can be shared, and the page keeps
 * fetching its data on the server.
 */
export default function ProRangeControl({ range }: { range: DashboardRange }) {
  return (
    <nav
      aria-label="Date range"
      className="inline-flex rounded-control border border-eh-line bg-eh-surface p-0.5"
    >
      {DASHBOARD_RANGES.map((value) => {
        const active = value === range;
        return (
          <Link
            key={value}
            href={`?range=${value}`}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`num rounded-[6px] px-2.5 py-[5px] text-ui transition-colors ${
              active
                ? "bg-eh-surface-2 font-semibold text-eh-ink shadow-[inset_0_0_0_1px_var(--eh-line)]"
                : "text-eh-muted hover:text-eh-ink"
            }`}
          >
            {value}d
          </Link>
        );
      })}
    </nav>
  );
}
