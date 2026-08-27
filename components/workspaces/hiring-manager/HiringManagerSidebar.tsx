"use client";

import { usePathname } from "next/navigation";
import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import { getWorkspaceNavItems, resolveWorkspaceSection } from "@/components/workspaces/workspaceNavItems";

export default function HiringManagerSidebar({ companyId }: { companyId: string }) {
  const active = resolveWorkspaceSection(usePathname() ?? "");
  return <WorkspaceSidebar title="Hiring manager workspace" items={getWorkspaceNavItems("HIRING_MANAGER", companyId, active)} />;
}
