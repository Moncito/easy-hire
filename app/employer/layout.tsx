import { redirect } from "next/navigation";
import EmployerShell from "@/components/employer/EmployerShell";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { requireEmployerLayoutContext } from "@/lib/employer-session";
import { FREE_ACTIVE_JOB_SOFT_CAP, getActiveJobCount } from "@/lib/billing/entitlements";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireEmployerLayoutContext();

  if (!ctx) {
    redirect("/login");
  }

  const { company, navCounts, plan, collaborativeHiringEnabled, impersonation } = ctx;
  // Free only: the sidebar's "x of 3 active job slots" card. Counts what the
  // cap actually enforces (live + pending review), not the nav's ACTIVE-only
  // count. Pro has no job limit, so no query and no card.
  const jobSlots =
    plan === "FREE" && company
      ? { used: await getActiveJobCount(company.id), limit: FREE_ACTIVE_JOB_SOFT_CAP }
      : null;

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          targetDisplayName={impersonation.targetDisplayName}
          expiresAt={impersonation.expiresAt.toISOString()}
        />
      )}
      <EmployerShell
        companyName={company?.companyName || "Your company"}
        companyLogoUrl={company?.logoUrl ?? null}
        verifiedStatus={company?.verifiedStatus || "PENDING"}
        plan={plan}
        collaborativeHiringEnabled={collaborativeHiringEnabled}
        jobSlots={jobSlots}
        navCounts={{
          activeJobs: navCounts.activeJobs,
          needsReview: navCounts.needsReview,
          unreadMessages: navCounts.unreadMessages,
        }}
      >
        {children}
      </EmployerShell>
    </>
  );
}
