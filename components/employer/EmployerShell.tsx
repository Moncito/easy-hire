"use client";

import Sidebar from "@/components/employer/Sidebar";
import Topbar from "@/components/employer/Topbar";
import EmployerPageContainer from "@/components/employer/EmployerPageContainer";
import EmployerWorkspaceBackdrop from "@/components/employer/EmployerWorkspaceBackdrop";
import { EmployerShellProvider, useEmployerShell } from "@/components/employer/EmployerShellContext";
import EmployerPageEnter from "@/components/employer/EmployerPageEnter";
import EmployerRouteProgress from "@/components/employer/EmployerRouteProgress";
import EmployerMobileNav from "@/components/employer/EmployerMobileNav";
import { EmployerThemeProvider, useEmployerTheme } from "@/components/employers/EmployerPageThemeProvider";
import { usePathname } from "next/navigation";

type Props = {
  companyName: string;
  companyLogoUrl?: string | null;
  verifiedStatus: string;
  plan?: "FREE" | "PRO";
  navCounts: { activeJobs: number; needsReview: number; unreadMessages: number };
  children: React.ReactNode;
};

function EmployerShellInner({
  companyName,
  companyLogoUrl,
  verifiedStatus,
  plan = "FREE",
  navCounts,
  children,
}: Props) {
  const { expanded } = useEmployerShell();
  const pathname = usePathname();
  const { theme, mounted } = useEmployerTheme();
  const isPro = plan === "PRO";
  const isFixedWorkspace =
    pathname.startsWith("/employer/messages") ||
    !!pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/);
  const isJobForm =
    pathname === "/employer/jobs/new" || !!pathname.match(/\/employer\/jobs\/[^/]+\/edit$/);
  const isCompanyProfile = pathname === "/employer/company-profile";

  return (
    <div
      className="employer-workspace flex h-screen overflow-hidden bg-mist"
      data-employer-theme={mounted ? theme : "light"}
      suppressHydrationWarning
    >
      <Sidebar navCounts={navCounts} plan={plan} />
      <EmployerMobileNav />
      <div
        className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${
          expanded ? "lg:pl-52" : "lg:pl-[60px]"
        }`}
      >
        <EmployerWorkspaceBackdrop />
        <EmployerRouteProgress />
        <Topbar
          companyName={companyName}
          companyLogoUrl={companyLogoUrl}
          verifiedStatus={verifiedStatus}
          plan={plan}
        />
        <main
          className={`relative z-[1] flex min-h-0 flex-1 flex-col ${
            isFixedWorkspace ? "overflow-hidden pb-16 lg:pb-0" : "overflow-y-auto pb-16 lg:pb-0"
          } ${isPro ? "lg:px-1" : ""} ${isJobForm || isCompanyProfile ? "scroll-pb-20" : ""}`}
        >
          <EmployerPageContainer pro={isPro}>
            <EmployerPageEnter>{children}</EmployerPageEnter>
          </EmployerPageContainer>
        </main>
      </div>
    </div>
  );
}

export default function EmployerShell(props: Props) {
  return (
    <EmployerShellProvider>
      <EmployerThemeProvider>
        <EmployerShellInner {...props} />
      </EmployerThemeProvider>
    </EmployerShellProvider>
  );
}
