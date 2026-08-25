import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import WorkspaceFrame from "@/components/workspaces/WorkspaceFrame";
import RecruiterSidebar from "@/components/workspaces/recruiter/RecruiterSidebar";
import HiringManagerSidebar from "@/components/workspaces/hiring-manager/HiringManagerSidebar";
import ViewerSidebar from "@/components/workspaces/viewer/ViewerSidebar";

export type WorkspaceSection = "overview" | "queue" | "jobs" | "interviews" | "reports" | "company-profile" | "messages" | "notifications";

/** Route pages choose a role layout here; each role owns its own sidebar component. */
export default function WorkspaceForRole({ companyId, role, active, children }: { companyId: string; role: CompanyMemberRole; active: WorkspaceSection; children: React.ReactNode }) {
  const sidebar = role === "HIRING_MANAGER" ? <HiringManagerSidebar companyId={companyId} active={active} /> : role === "VIEWER" ? <ViewerSidebar companyId={companyId} active={active} /> : <RecruiterSidebar companyId={companyId} active={active} />;
  return (
    <WorkspaceFrame sidebar={sidebar} companyId={companyId} role={role} active={active} queueHref={`/hiring/${companyId}/queue`}>
      {children}
    </WorkspaceFrame>
  );
}
