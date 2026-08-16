export const EMPLOYER_RAIL_WIDTH = 60;
export const EMPLOYER_RAIL_EXPANDED_WIDTH = 208;
/** Sidebar visible at lg+; below this, bottom tab bar is used. */
export const EMPLOYER_MOBILE_BREAKPOINT = "lg";

export type EmployerNavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

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
