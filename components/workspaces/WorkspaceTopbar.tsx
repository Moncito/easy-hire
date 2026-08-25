"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import WorkspaceNotificationBell from "@/components/workspaces/WorkspaceNotificationBell";
import EmployerSearchTrigger from "@/components/employer/EmployerSearchTrigger";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import EmployerThemeToggle from "@/components/employers/EmployerThemeToggle";
import { parseJsonBody } from "@/lib/client/fetch-json";

const roleLabel: Record<CompanyMemberRole, string> = {
  OWNER: "Owner",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring manager",
  VIEWER: "Viewer",
};

const roleTone: Record<CompanyMemberRole, string> = {
  OWNER: "bg-marigold/20 text-[#81510d]",
  RECRUITER: "bg-teal/10 text-teal",
  HIRING_MANAGER: "bg-navy/10 text-navy",
  VIEWER: "bg-ink/5 text-ink/55",
};

/** Page-context titles, mirroring each role's own nav labels (see the role sidebars). */
const sectionTitles: Record<CompanyMemberRole, Partial<Record<WorkspaceSection, string>>> = {
  OWNER: {
    overview: "Overview",
    queue: "Review queue",
    jobs: "Post a role",
    messages: "Messages",
    interviews: "Interviews",
    reports: "Reports",
    "company-profile": "Company profile",
    notifications: "Notifications",
  },
  RECRUITER: {
    overview: "Overview",
    queue: "Review queue",
    jobs: "Post a role",
    messages: "Messages",
    interviews: "Interviews",
    reports: "Reports",
    "company-profile": "Company profile",
    notifications: "Notifications",
  },
  HIRING_MANAGER: {
    overview: "Dashboard",
    queue: "Open roles",
    interviews: "Interviews",
    reports: "Reports",
    "company-profile": "Company profile",
  },
  VIEWER: {
    overview: "Dashboard",
    queue: "Open roles",
    interviews: "Interviews",
    reports: "Reports",
    "company-profile": "Company profile",
  },
};

type CompanyBranding = {
  companyName: string;
  logoUrl: string | null;
  verifiedStatus: "PENDING" | "APPROVED" | "REJECTED";
};

const statusDot: Record<string, string> = {
  PENDING: "bg-navy/50",
  APPROVED: "bg-teal",
  REJECTED: "bg-ember",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Verified",
  REJECTED: "Rejected",
};

export default function WorkspaceTopbar({
  companyId,
  role,
  active,
}: {
  companyId: string;
  role: CompanyMemberRole;
  active: WorkspaceSection;
}) {
  const title = sectionTitles[role]?.[active] ?? "Hiring workspace";
  const pathname = usePathname() ?? "";
  const isMessages = /^\/hiring\/[^/]+\/messages/.test(pathname);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchBranding() {
      try {
        const res = await fetch(`/api/hiring/${companyId}/branding`);
        if (!res.ok) return;
        const data = (await parseJsonBody(res)) as CompanyBranding;
        if (!cancelled) setBranding(data);
      } catch {
        /* ignore */
      }
    }
    fetchBranding();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <header className="employer-topbar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-ink/[0.08] bg-white/70 px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] backdrop-blur-md sm:px-6">
      <h1 className={`min-w-0 truncate font-display text-lg font-bold tracking-tight text-ink ${isMessages ? "" : "lg:hidden"}`}>
        {title}
      </h1>

      <div className={`hidden flex-1 justify-center lg:flex ${isMessages ? "lg:hidden" : ""}`}>
        <EmployerSearchTrigger />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <span
          className={`hidden items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] sm:inline-flex ${roleTone[role]}`}
        >
          {roleLabel[role]}
        </span>

        <WorkspaceNotificationBell companyId={companyId} />

        <EmployerThemeToggle variant="topbar" />

        {branding && (
          <div
            className="employer-topbar-verified hidden items-center gap-2 rounded-full bg-white/60 px-2.5 py-1 ring-1 ring-ink/5 sm:flex"
            title={statusLabel[branding.verifiedStatus] ?? branding.verifiedStatus}
          >
            <span
              className={`h-2 w-2 rounded-full ${statusDot[branding.verifiedStatus] ?? "bg-ink/30"}`}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-ink/60">
              {statusLabel[branding.verifiedStatus] ?? branding.verifiedStatus}
            </span>
          </div>
        )}

        {branding && (
          <Link
            href={`/hiring/${companyId}/company-profile`}
            className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-ink/[0.04]"
          >
            <EmployerAvatar
              name={branding.companyName}
              imageUrl={branding.logoUrl}
              size="sm"
              shape="rounded"
              fallbackClassName="bg-teal text-white shadow-sm shadow-teal/25"
            />
            <div className="hidden max-w-[140px] md:block">
              <span className="employer-topbar-company-name flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                {branding.companyName}
              </span>
              <span className="employer-topbar-company-role block truncate text-[10px] text-ink/45">
                {roleLabel[role]}
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
