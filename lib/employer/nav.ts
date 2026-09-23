import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavCounts = {
  activeJobs: number;
  needsReview: number;
  unreadMessages: number;
};

export type EmployerNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: keyof NavCounts;
  disabled?: boolean;
  /** Rendered only when the company has collaborative hiring turned on. */
  requiresCollaborativeHiring?: boolean;
};

export type EmployerNavGroup = {
  /** null renders the items with no section header — used for the lone Dashboard entry. */
  label: string | null;
  items: EmployerNavItem[];
};

/**
 * Single source of truth for employer navigation, consumed by both the desktop
 * sidebar and the mobile nav. They were separate hand-maintained arrays and had
 * already drifted twice — badges existed only on desktop, and the two used
 * different active-state rules.
 *
 * Order within each group is deliberately unchanged from the flat list this
 * replaced. Regrouping and reordering at the same time would double what a
 * returning user has to relearn.
 */
export const EMPLOYER_NAV: EmployerNavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Hiring",
    items: [
      { label: "Jobs", href: "/employer/jobs", icon: Briefcase, badgeKey: "activeJobs" },
      { label: "Applicants", href: "/employer/applicants", icon: Users, badgeKey: "needsReview" },
      { label: "Messages", href: "/employer/messages", icon: MessageSquare, badgeKey: "unreadMessages" },
      { label: "Talent", href: "/employer/talent", icon: Search },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Company", href: "/employer/company-profile", icon: Building2 },
      { label: "Team", href: "/employer/team", icon: UserRoundPlus, requiresCollaborativeHiring: true },
      { label: "Reports", href: "/employer/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Billing", href: "/employer/billing", icon: CreditCard },
      { label: "Settings", href: "/employer/settings", icon: Settings },
    ],
  },
];

/** Drops entries the company has not unlocked, and then any group left empty. */
export function visibleEmployerNav(collaborativeHiringEnabled: boolean): EmployerNavGroup[] {
  return EMPLOYER_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requiresCollaborativeHiring || collaborativeHiringEnabled
    ),
  })).filter((group) => group.items.length > 0);
}

/**
 * Shared active-state rule. Desktop matched on `startsWith(href)` and mobile on
 * `startsWith(href + "/")`, so a path like /employer/jobs-archive would have lit
 * up Jobs on desktop only. Dashboard is exact-match because every employer route
 * would otherwise be a prefix match against it.
 */
export function isEmployerNavActive(pathname: string, href: string): boolean {
  if (href === "/employer/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getEmployerPageTitle(pathname: string): string {
  if (pathname === "/employer/dashboard") return "Dashboard";
  if (pathname === "/employer/jobs/new") return "Post a job";
  if (pathname.match(/\/employer\/jobs\/[^/]+\/edit$/)) return "Edit job";
  if (pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/)) return "Applicants";
  if (pathname === "/employer/jobs") return "Job postings";
  if (pathname === "/employer/applicants") return "Applicants";
  if (pathname.startsWith("/employer/messages")) return "Messages";
  if (pathname.match(/\/employer\/talent\/[^/]+$/)) return "Candidate profile";
  if (pathname === "/employer/talent/lists") return "Saved lists";
  if (pathname === "/employer/talent") return "Talent search";
  if (pathname === "/employer/company-profile") return "Company profile";
  if (pathname === "/employer/reports") return "Reports";
  if (pathname === "/employer/billing") return "Billing";
  if (pathname === "/employer/easy-ai") return "Easy AI";
  return "Employer";
}
