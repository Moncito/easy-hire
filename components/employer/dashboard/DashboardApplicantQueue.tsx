import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import { getApplicantStatusLabel } from "@/lib/employer/dashboard-panels";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/70",
  SHORTLISTED: "bg-navy/10 text-navy",
  INTERVIEW: "bg-teal/10 text-teal",
  HIRED: "bg-teal text-white",
};

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
  items: DashboardApplicantItem[];
  needsReview: number;
};

export default function DashboardApplicantQueue({ items, needsReview }: Props) {
  return (
    <DashboardSurface>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal">Pipeline</p>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            {needsReview > 0 ? "Applicants waiting" : "Recent applicants"}
          </h2>
        </div>
        <Link
          href="/employer/applicants"
          className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/10 bg-ink/[0.02] px-4 py-8 text-center">
          <Users className="mx-auto h-8 w-8 text-ink/20" strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium text-ink/55">No applicants yet</p>
          <p className="mt-1 text-xs text-ink/40">Share your listings or browse talent to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-ink/[0.06]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/employer/jobs/${item.jobId}/applicants`}
                className="group flex items-center gap-3 py-3 transition first:pt-0 last:pb-0 hover:bg-ink/[0.02]"
              >
                <EmployerAvatar name={item.seekerName} imageUrl={item.seekerPhotoUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink group-hover:text-teal">
                    {item.seekerName}
                  </p>
                  <p className="truncate text-xs text-ink/50">{item.jobTitle}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_STYLES[item.status] ?? STATUS_STYLES.APPLIED
                    }`}
                  >
                    {getApplicantStatusLabel(item.status)}
                  </span>
                  <p className="mt-1 text-[10px] text-ink/35">{formatRelativeTime(item.appliedAt)}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-teal opacity-0 transition group-hover:opacity-100">
                  Review →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardSurface>
  );
}
