"use client";

import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import { getWorkspaceNavItems } from "@/components/workspaces/workspaceNavItems";
export default function RecruiterSidebar({companyId,active}:{companyId:string;active:WorkspaceSection}){return <WorkspaceSidebar title="Recruiter workspace" items={getWorkspaceNavItems("RECRUITER", companyId, active)}/>}
