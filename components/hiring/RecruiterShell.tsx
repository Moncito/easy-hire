import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import WorkspaceForRole, { type WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";

export default function RecruiterShell({ companyId, role = "RECRUITER", children, active = "queue" }: { companyId: string; jobId?: string; role?: CompanyMemberRole; children: React.ReactNode; active?: WorkspaceSection; companyName?: string }) {
  return <WorkspaceForRole companyId={companyId} role={role} active={active}>{children}</WorkspaceForRole>;
}
