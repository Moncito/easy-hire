"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import WorkspaceTopbar from "@/components/workspaces/WorkspaceTopbar";
import WorkspacePageContainer from "@/components/workspaces/WorkspacePageContainer";
import { WorkspaceShellProvider, useWorkspaceShell } from "@/components/workspaces/WorkspaceShellContext";
import { EmployerThemeProvider, useEmployerThemeOptional } from "@/components/employers/EmployerPageThemeProvider";

type Props = {
  sidebar: React.ReactNode;
  companyId: string;
  role: CompanyMemberRole;
  active: WorkspaceSection;
  queueHref: string;
  children: React.ReactNode;
};

function WorkspaceFrameInner({ sidebar, companyId, role, active, queueHref, children }: Props) {
  const { expanded } = useWorkspaceShell();
  const pathname = usePathname() ?? "";
  const isMessages = /^\/hiring\/[^/]+\/messages/.test(pathname);
  const themeCtx = useEmployerThemeOptional();
  const theme = themeCtx?.mounted ? themeCtx.theme : "light";

  return (
    <div
      className="employer-workspace flex h-screen overflow-hidden bg-mist text-ink"
      data-employer-theme={theme}
      suppressHydrationWarning
    >
      {sidebar}
      <div
        className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${
          expanded ? "lg:pl-52" : "lg:pl-[60px]"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-ink/8 bg-mist/90 px-5 backdrop-blur lg:hidden">
          <span className="font-display text-lg font-black">EasyHire</span>
          <Link href={queueHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#9A5B12]">
            <ClipboardCheck className="h-4 w-4" />
            Review queue
          </Link>
        </header>

        <div className="hidden lg:block">
          <WorkspaceTopbar companyId={companyId} role={role} active={active} />
        </div>

        <main
          className={`relative z-[1] flex min-h-0 flex-1 flex-col ${isMessages ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          <WorkspacePageContainer>{children}</WorkspacePageContainer>
        </main>

        {/* Portal target for EmployerActionBar's Pro branch (CollaboratorJobForm wraps
            JobForm in EmployerShellProvider plan="PRO" for visual parity — this mirrors
            the same slot components/employer/EmployerShell.tsx renders for the owner's
            Pro job form so the sticky action bar has somewhere to portal into). */}
        <div id="employer-action-bar-slot" className="shrink-0" />
      </div>
    </div>
  );
}

export default function WorkspaceFrame(props: Props) {
  return (
    <EmployerThemeProvider>
      <WorkspaceShellProvider>
        <WorkspaceFrameInner {...props} />
      </WorkspaceShellProvider>
    </EmployerThemeProvider>
  );
}
