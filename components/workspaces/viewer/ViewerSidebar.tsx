import { BriefcaseBusiness, CalendarDays, LayoutDashboard } from "lucide-react";
import WorkspaceSidebar from "@/components/workspaces/WorkspaceSidebar";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
export default function ViewerSidebar({companyId,active}:{companyId:string;active:WorkspaceSection}){return <WorkspaceSidebar title="Viewer workspace" items={[{href:`/hiring/${companyId}/team`,label:"Dashboard",icon:LayoutDashboard,active:active === "overview"},{href:`/hiring/${companyId}/queue`,label:"Open roles",icon:BriefcaseBusiness,active:active === "queue"},{href:`/hiring/${companyId}/interviews`,label:"Interviews",icon:CalendarDays,active:active === "interviews"}]}/>}
