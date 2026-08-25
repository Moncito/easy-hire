"use client";

import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import { getWorkspaceNavItems } from "@/components/workspaces/workspaceNavItems";
export default function HiringManagerSidebar({companyId,active}:{companyId:string;active:WorkspaceSection}){return <WorkspaceSidebar title="Hiring manager workspace" items={getWorkspaceNavItems("HIRING_MANAGER", companyId, active)}/>}
