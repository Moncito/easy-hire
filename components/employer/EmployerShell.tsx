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
  collaborativeHiringEnabled?: boolean;
  navCounts: { activeJobs: number; needsReview: number; unreadMessages: number };
  children: React.ReactNode;
};

function EmployerShellInner({
  companyName,
  companyLogoUrl,
  verifiedStatus,
  plan = "FREE",
  collaborativeHiringEnabled = false,
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

  // `marginTop`/`height` read `--eh-impersonation-h` (0px unless
  // ImpersonationBanner is mounted above this component in the layout — see
  // its module doc comment). Reserving the banner's height this way, rather
  // than leaving `h-screen` alone, is what keeps the shell's own total
  // height at exactly 100vh (marginTop + height === 100vh) instead of
  // overflowing the viewport by the banner's height and clipping whatever's
  // at the bottom of the sidebar/main column.
  const impersonationOffsetStyle = {
    marginTop: "var(--eh-impersonation-h, 0px)",
    height: "calc(100vh - var(--eh-impersonation-h, 0px))",
  } as const;

  if (isPro) {
    return (
      <div
        className="employer-workspace employer-pro-workspace flex overflow-hidden"
        style={impersonationOffsetStyle}
        data-employer-theme={mounted ? theme : "light"}
        data-employer-plan="pro"
        suppressHydrationWarning
      >
        <Sidebar navCounts={navCounts} plan={plan} collaborativeHiringEnabled={collaborativeHiringEnabled} />
        <EmployerMobileNav plan={plan} collaborativeHiringEnabled={collaborativeHiringEnabled} />
        <div
          className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${
            expanded ? "lg:pl-52" : "lg:pl-[60px]"
          }`}
        >
          <EmployerRouteProgress />
          <Topbar
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
            verifiedStatus={verifiedStatus}
            plan={plan}
          />
          <main
            className={`relative z-[1] flex min-h-0 flex-1 flex-col ${
              isFixedWorkspace
                ? "overflow-hidden pb-16 lg:pb-0"
                : isJobForm
                  ? "overflow-y-auto pb-0"
                  : "overflow-y-auto pb-16 lg:pb-0"
            } ${isCompanyProfile ? "scroll-pb-20" : ""}`}
          >
            <EmployerPageContainer pro>
              <EmployerPageEnter fill={isFixedWorkspace}>{children}</EmployerPageEnter>
            </EmployerPageContainer>
          </main>
          <div id="employer-action-bar-slot" className="shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="employer-workspace flex overflow-hidden bg-mist"
      style={impersonationOffsetStyle}
      data-employer-theme={mounted ? theme : "light"}
      data-employer-plan="free"
      suppressHydrationWarning
    >
      <Sidebar navCounts={navCounts} plan={plan} collaborativeHiringEnabled={collaborativeHiringEnabled} />
      <EmployerMobileNav plan={plan} collaborativeHiringEnabled={collaborativeHiringEnabled} />
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
          } ${isJobForm || isCompanyProfile ? "scroll-pb-20" : ""}`}
        >
          <EmployerPageContainer pro={false}>
            <EmployerPageEnter fill={isFixedWorkspace}>{children}</EmployerPageEnter>
          </EmployerPageContainer>
        </main>
      </div>
    </div>
  );
}

export default function EmployerShell(props: Props) {
  return (
    <EmployerShellProvider plan={props.plan ?? "FREE"}>
      <EmployerThemeProvider>
        <EmployerShellInner {...props} />
      </EmployerThemeProvider>
    </EmployerShellProvider>
  );
}
