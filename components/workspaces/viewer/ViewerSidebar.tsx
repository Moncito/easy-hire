"use client";

import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import { getWorkspaceNavItems } from "@/components/workspaces/workspaceNavItems";
export default function ViewerSidebar({companyId,active}:{companyId:string;active:WorkspaceSection}){return <WorkspaceSidebar title="Viewer workspace" items={getWorkspaceNavItems("VIEWER", companyId, active)}/>}
