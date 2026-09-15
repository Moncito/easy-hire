import { redirect } from "next/navigation";
import EmployerShell from "@/components/employer/EmployerShell";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { requireEmployerLayoutContext } from "@/lib/employer-session";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireEmployerLayoutContext();

  if (!ctx) {
    redirect("/login");
  }

  const { company, navCounts, plan, collaborativeHiringEnabled, impersonation } = ctx;

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
