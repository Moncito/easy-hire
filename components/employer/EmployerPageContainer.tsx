"use client";

import { usePathname } from "next/navigation";

type ContentWidth = "full" | "7xl" | "6xl" | "dashboard";

function isJobForm(pathname: string) {
  return pathname === "/employer/jobs/new" || !!pathname.match(/\/employer\/jobs\/[^/]+\/edit$/);
}

function isCompanyProfile(pathname: string) {
  return pathname === "/employer/company-profile";
}

function getContentWidth(pathname: string): ContentWidth {
  if (pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/)) return "full";
  if (pathname.startsWith("/employer/messages")) return "full";
  if (pathname === "/employer/jobs/new") return "6xl";
  if (pathname.match(/\/employer\/jobs\/[^/]+\/edit$/)) return "6xl";
  if (pathname === "/employer/dashboard") return "dashboard";
  if (pathname === "/employer/reports") return "dashboard";
  if (pathname === "/employer/billing") return "dashboard";
  return "7xl";
}

function isDashboard(pathname: string) {
  return (
    pathname === "/employer/dashboard" ||
    pathname === "/employer/reports" ||
    pathname === "/employer/billing"
  );
}

const widthClasses: Record<ContentWidth, string> = {
  full: "w-full max-w-none",
  "7xl": "mx-auto w-full max-w-7xl",
  "6xl": "mx-auto w-full max-w-6xl",
  dashboard: "mx-auto w-full max-w-[1480px]",
};

export default function EmployerPageContainer({
  children,
  pro = false,
}: {
  children: React.ReactNode;
  pro?: boolean;
}) {
  const pathname = usePathname();
  const width = getContentWidth(pathname);
  const isMessages = pathname.startsWith("/employer/messages");
  const isApplicants = !!pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/);
  const isFixedWorkspace = isMessages || isApplicants;

  const workspaceClasses = isMessages
    ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    : "flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-5 lg:px-5 lg:py-3";

  const dashboard = isDashboard(pathname);
  const jobForm = isJobForm(pathname);
  const companyProfile = isCompanyProfile(pathname);

  return (
    <div
      className={`${isFixedWorkspace ? workspaceClasses : dashboard ? "px-4 py-4 pb-24 sm:px-5 lg:px-6 lg:pb-20" : jobForm || companyProfile ? "px-6 py-5 pb-0 sm:px-8" : "px-6 py-6 pb-28 sm:px-8 lg:pb-24"} ${widthClasses[width]} ${pro ? "employer-pro-canvas" : ""}`}
    >
      {children}
    </div>
  );
}
