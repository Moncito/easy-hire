"use client";

import { usePathname } from "next/navigation";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import WorkspaceTopbar, { type WorkspaceBranding } from "@/components/workspaces/WorkspaceTopbar";
import WorkspaceMobileNav from "@/components/workspaces/WorkspaceMobileNav";
import WorkspacePageContainer from "@/components/workspaces/WorkspacePageContainer";
import { WorkspaceShellProvider, useWorkspaceShell } from "@/components/workspaces/WorkspaceShellContext";
import { EmployerThemeProvider, useEmployerThemeOptional } from "@/components/employers/EmployerPageThemeProvider";

type Props = {
  sidebar: React.ReactNode;
  companyId: string;
  role: CompanyMemberRole;
  branding?: WorkspaceBranding | null;
  children: React.ReactNode;
};

function WorkspaceFrameInner({ sidebar, companyId, role, branding, children }: Props) {
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
      <WorkspaceMobileNav companyId={companyId} role={role} />
      <div
        className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${
          expanded ? "lg:pl-52" : "lg:pl-[60px]"
        }`}
      >
        <WorkspaceTopbar companyId={companyId} role={role} initialBranding={branding} />

        <main
          className={`relative z-[1] flex min-h-0 flex-1 flex-col ${
            isMessages ? "overflow-hidden pb-16 lg:pb-0" : "overflow-y-auto"
          }`}
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
