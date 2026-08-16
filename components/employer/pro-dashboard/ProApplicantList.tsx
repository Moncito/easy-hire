import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import { getApplicantStatusLabel } from "@/lib/employer/dashboard-panels";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import ProEmptyState from "@/components/employer/pro/ProEmptyState";
import ProButton from "@/components/employer/pro/ProButton";

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/65",
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

export default function ProApplicantList({ items, needsReview }: Props) {
  return (
    <section aria-labelledby="pro-applicant-list-heading">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2
            id="pro-applicant-list-heading"
            className="font-display text-xl font-black tracking-tighter text-ink"
          >
            {needsReview > 0 ? "Applicants waiting" : "Recent applicants"}
          </h2>
          <p className="mt-0.5 text-sm text-ink/45">
            {needsReview > 0
              ? `${needsReview} waiting for a decision`
              : "Latest pipeline activity, including hires"}
          </p>
        </div>
        <Link
          href="/employer/applicants"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 transition hover:text-ink"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <ProEmptyState
          embedded
          compact
          className="rounded-[1.75rem] border border-dashed border-ink/10 bg-white/60"
          icon={<Users className="h-9 w-9" strokeWidth={1.5} />}
          title="No applicants yet"
          description="Share a listing or browse talent to get started."
          action={
            <ProButton href="/employer/talent" variant="primary">
              Browse talent
            </ProButton>
          }
        />
      ) : (
        <div className="pro-card overflow-hidden !p-0">
          <ul className="divide-y divide-ink/[0.06]">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/employer/jobs/${item.jobId}/applicants`}
                  className="group flex items-center gap-3 bg-white px-4 py-3.5 transition hover:bg-ink/[0.02] sm:px-5"
                >
                  <EmployerAvatar name={item.seekerName} imageUrl={item.seekerPhotoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-[#9A5B12]">
                      {item.seekerName}
                    </p>
                    <p className="truncate text-xs text-ink/45">{item.jobTitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        STATUS_STYLES[item.status] ?? STATUS_STYLES.APPLIED
                      }`}
                    >
                      {getApplicantStatusLabel(item.status)}
                    </span>
                    <p className="mt-1 text-xs text-ink/35">{formatRelativeTime(item.appliedAt)}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs font-semibold text-[#9A5B12] opacity-0 transition group-hover:opacity-100 sm:inline">
                    Review →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
