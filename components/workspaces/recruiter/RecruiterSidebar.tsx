"use client";

import { usePathname } from "next/navigation";
import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import { getWorkspaceNavItems, resolveWorkspaceSection } from "@/components/workspaces/workspaceNavItems";

export default function RecruiterSidebar({ companyId }: { companyId: string }) {
  const active = resolveWorkspaceSection(usePathname() ?? "");
  return <WorkspaceSidebar title="Recruiter workspace" items={getWorkspaceNavItems("RECRUITER", companyId, active)} />;
}
