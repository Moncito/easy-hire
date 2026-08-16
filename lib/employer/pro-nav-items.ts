import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Search,
  BarChart3,
} from "lucide-react";

export type ProNavBadgeKey = "activeJobs" | "needsReview" | "unreadMessages";

export type ProNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: ProNavBadgeKey | null;
};

export const PRO_PRIMARY_NAV: ProNavItem[] = [
  { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/employer/jobs", icon: Briefcase, badgeKey: "activeJobs" },
  { label: "Applicants", href: "/employer/applicants", icon: Users, badgeKey: "needsReview" },
  { label: "Messages", href: "/employer/messages", icon: MessageSquare, badgeKey: "unreadMessages" },
  { label: "Talent", href: "/employer/talent", icon: Search },
  { label: "Reports", href: "/employer/reports", icon: BarChart3 },
];

export function isProNavActive(pathname: string, href: string) {
  if (href === "/employer/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
