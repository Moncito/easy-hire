"use client";

import Sidebar from "@/components/employer/Sidebar";
import Topbar from "@/components/employer/Topbar";
import EmployerPageContainer from "@/components/employer/EmployerPageContainer";
import { EmployerShellProvider, useEmployerShell } from "@/components/employer/EmployerShellContext";
import EmployerPageEnter from "@/components/employer/EmployerPageEnter";
import EmployerRouteProgress from "@/components/employer/EmployerRouteProgress";
import EmployerMobileNav from "@/components/employer/EmployerMobileNav";
import { usePathname } from "next/navigation";

type Props = {
  companyName: string;
  verifiedStatus: string;
  navCounts: { activeJobs: number; needsReview: number; unreadMessages: number };
  children: React.ReactNode;
};

function EmployerShellInner({ companyName, verifiedStatus, navCounts, children }: Props) {
  const { expanded } = useEmployerShell();
  const pathname = usePathname();
  const isFixedWorkspace =
    pathname.startsWith("/employer/messages") ||
    !!pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/);

  return (
    <div className="flex h-screen overflow-hidden bg-mist">
      <Sidebar navCounts={navCounts} />
      <EmployerMobileNav />
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${
          expanded ? "lg:pl-52" : "lg:pl-[60px]"
        }`}
      >
        <EmployerRouteProgress />
        <Topbar companyName={companyName} verifiedStatus={verifiedStatus} />
        <main
          className={`flex min-h-0 flex-1 flex-col ${
            isFixedWorkspace ? "overflow-hidden pb-16 lg:pb-0" : "overflow-y-auto pb-16 lg:pb-0"
          }`}
        >
          <EmployerPageContainer>
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
      <EmployerShellInner {...props} />
    </EmployerShellProvider>
  );
}
