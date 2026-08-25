import { BarChart3, BriefcaseBusiness, Building2, CalendarDays, ClipboardCheck, LayoutDashboard, MessageSquare } from "lucide-react";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import type { WorkspaceNavItem } from "@/components/workspaces/WorkspaceSidebar";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";

/**
 * Single source of truth for each role's workspace nav items — hrefs, labels,
 * icons, and active-matching are defined here once and consumed by both the
 * desktop sidebars (components/workspaces/{role}/*Sidebar.tsx) and
 * WorkspaceMobileNav, so the two surfaces can never drift apart.
 *
 * `primary` marks the ~3-4 items surfaced directly on the mobile bottom tab
 * bar; everything else lives behind its "More" sheet. Desktop sidebars ignore
 * the flag and simply render every item in order.
 */
export type WorkspaceNavEntry = WorkspaceNavItem & { primary?: boolean };

export function getWorkspaceNavItems(
  role: CompanyMemberRole,
  companyId: string,
  active: WorkspaceSection
): WorkspaceNavEntry[] {
  if (role === "HIRING_MANAGER") {
    return [
      { href: `/hiring/${companyId}/team`, label: "Dashboard", icon: LayoutDashboard, active: active === "overview", primary: true },
      { href: `/hiring/${companyId}/queue`, label: "Open roles", icon: ClipboardCheck, active: active === "queue", primary: true },
      { href: `/hiring/${companyId}/interviews`, label: "Interviews", icon: CalendarDays, active: active === "interviews", primary: true },
      { href: `/hiring/${companyId}/reports`, label: "Reports", icon: BarChart3, active: active === "reports" },
      { href: `/hiring/${companyId}/company-profile`, label: "Company profile", icon: Building2, active: active === "company-profile" },
    ];
  }

  if (role === "VIEWER") {
    return [
      { href: `/hiring/${companyId}/team`, label: "Dashboard", icon: LayoutDashboard, active: active === "overview", primary: true },
      { href: `/hiring/${companyId}/queue`, label: "Open roles", icon: BriefcaseBusiness, active: active === "queue", primary: true },
      { href: `/hiring/${companyId}/interviews`, label: "Interviews", icon: CalendarDays, active: active === "interviews", primary: true },
      { href: `/hiring/${companyId}/reports`, label: "Reports", icon: BarChart3, active: active === "reports" },
      { href: `/hiring/${companyId}/company-profile`, label: "Company profile", icon: Building2, active: active === "company-profile" },
    ];
  }

  // RECRUITER (and the RecruiterSidebar/RecruiterShell default fallback)
  return [
    { href: `/hiring/${companyId}/team`, label: "Overview", icon: LayoutDashboard, active: active === "overview", primary: true },
    { href: `/hiring/${companyId}/queue`, label: "Review queue", icon: ClipboardCheck, active: active === "queue", primary: true },
    { href: `/hiring/${companyId}/jobs/new`, label: "Post a role", icon: BriefcaseBusiness, active: active === "jobs", primary: true },
    { href: `/hiring/${companyId}/messages`, label: "Messages", icon: MessageSquare, active: active === "messages", primary: true },
    { href: `/hiring/${companyId}/interviews`, label: "Interviews", icon: CalendarDays, active: active === "interviews" },
    { href: `/hiring/${companyId}/reports`, label: "Reports", icon: BarChart3, active: active === "reports" },
    { href: `/hiring/${companyId}/company-profile`, label: "Company profile", icon: Building2, active: active === "company-profile" },
  ];
}
