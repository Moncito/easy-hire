"use client";

import { usePathname } from "next/navigation";
import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import { getWorkspaceNavItems, resolveWorkspaceSection } from "@/components/workspaces/workspaceNavItems";

export default function ViewerSidebar({ companyId }: { companyId: string }) {
  const active = resolveWorkspaceSection(usePathname() ?? "");
  return <WorkspaceSidebar title="Viewer workspace" items={getWorkspaceNavItems("VIEWER", companyId, active)} />;
}
