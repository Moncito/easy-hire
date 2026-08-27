import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import WorkspaceFrame from "@/components/workspaces/WorkspaceFrame";
import type { WorkspaceBranding } from "@/components/workspaces/WorkspaceTopbar";
import RecruiterSidebar from "@/components/workspaces/recruiter/RecruiterSidebar";
import HiringManagerSidebar from "@/components/workspaces/hiring-manager/HiringManagerSidebar";
import ViewerSidebar from "@/components/workspaces/viewer/ViewerSidebar";

export type WorkspaceSection = "overview" | "queue" | "jobs" | "interviews" | "reports" | "company-profile" | "messages" | "notifications";

/** Route pages choose a role layout here; each role owns its own sidebar component. */
export default function WorkspaceForRole({
  companyId,
  role,
  branding,
  children,
}: {
  companyId: string;
  role: CompanyMemberRole;
  branding?: WorkspaceBranding | null;
  children: React.ReactNode;
}) {
  const sidebar = role === "HIRING_MANAGER" ? <HiringManagerSidebar companyId={companyId} /> : role === "VIEWER" ? <ViewerSidebar companyId={companyId} /> : <RecruiterSidebar companyId={companyId} />;
  return (
    <WorkspaceFrame sidebar={sidebar} companyId={companyId} role={role} branding={branding}>
      {children}
    </WorkspaceFrame>
  );
}
