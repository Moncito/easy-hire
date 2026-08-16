import Link from "next/link";
import type { RecentActivityItem } from "@/lib/employer-analytics";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Props = {
  items: RecentActivityItem[];
  sparse?: boolean;
  embedded?: boolean;
  variant?: "free" | "pro";
};

const SPARSE_TIPS = [
  "Add screening questions to filter stronger applicants early.",
  "Complete your company profile — verified employers get more views.",
  "Share job links on LinkedIn or Facebook to reach more VAs.",
];

export default function RecentActivity({
  items,
  sparse = false,
  embedded = false,
  variant = "free",
}: Props) {
  const content = (
    <>
      <h2 className={`font-bold text-ink ${embedded ? "mb-3 text-sm" : "mb-4 text-sm"}`}>
        Recent activity
      </h2>
      {items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-ink/50">No applications yet</p>
          <p className="mt-1 text-xs text-ink/35">
            New applicants will show up here as they apply to your jobs.
          </p>
          <Link
            href="/employer/jobs/new"
            className="mt-3 inline-block text-xs font-semibold text-teal hover:underline"
          >
            Post a job to get started →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={`/employer/jobs/${item.jobId}/applicants`}
              className="group relative flex gap-3 rounded-lg p-1 transition hover:bg-ink/[0.02]"
            >
              {i < items.length - 1 && (
                <div className="absolute bottom-[-12px] left-[15px] top-8 w-px bg-ink/8" />
              )}
              <EmployerAvatar name={item.seekerName} imageUrl={item.seekerPhotoUrl} size="sm" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="leading-snug text-ink/75">
                  <span
                    className={`font-semibold text-ink ${
                      variant === "pro" ? "group-hover:text-[#9A5B12]" : "group-hover:text-teal"
                    }`}
                  >
                    {item.seekerName}
                  </span>{" "}
                  applied for{" "}
                  <span className="font-medium text-ink/80">{item.jobTitle}</span>
                </p>
                <span className="mt-0.5 block text-[10px] text-ink/35">
                  {formatRelativeTime(item.appliedAt)}
                </span>
              </div>
            </Link>
          ))}
          {sparse && items.length < 5 && (
            <div className="mt-2 border-t border-ink/5 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/35">
                Tips to get more applicants
              </p>
              <ul className="mt-2 space-y-1.5">
                {SPARSE_TIPS.map((tip) => (
                  <li key={tip} className="text-[11px] leading-relaxed text-ink/45">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    const shellClass =
      variant === "pro"
        ? "pro-card p-5"
        : "rounded-2xl border border-navy/[0.08] bg-white/90 p-5 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)]";
    return <div className={shellClass}>{content}</div>;
  }

  return <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">{content}</div>;
}
