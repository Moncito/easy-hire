import { SegmentedControl } from "@/components/employer/system";
import { DASHBOARD_RANGES, type DashboardRange } from "@/lib/employer/dashboard-insights";

/**
 * 7d / 30d / 60d. Links rather than client state: the range lives in
 * `?range=`, so it survives reloads, can be shared, and the page keeps
 * fetching its data on the server.
 */
export default function ProRangeControl({ range }: { range: DashboardRange }) {
  return (
    <SegmentedControl
      label="Date range"
      value={String(range)}
      options={DASHBOARD_RANGES.map((value) => ({ value: String(value), label: `${value}d`, href: `?range=${value}` }))}
    />
  );
}
