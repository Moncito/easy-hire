import { BadgeCheck, Plus, Users } from "lucide-react";
import ProButton from "@/components/employer/pro/ProButton";

type Props = {
  companyName: string;
  verified: boolean;
};

/**
 * Dashboard opener. A working screen, so it leads with where you are and
 * the two things you'd do next. Logo, tagline, and location live on the
 * Company page, not here.
 */
export default function ProDashboardHeader({ companyName, verified }: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
          <span className="truncate">{companyName || "Your company"}</span>
          {verified && (
            <span className="inline-flex items-center gap-1 font-medium text-teal">
              <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Verified
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <ProButton
          href="/employer/applicants"
          variant="secondary"
          icon={<Users className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        >
          Review applicants
        </ProButton>
        <ProButton
          href="/employer/jobs/new"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
        >
          Post a job
        </ProButton>
      </div>
    </header>
  );
}
