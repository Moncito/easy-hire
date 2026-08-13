"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getEmployerPageTitle } from "@/lib/employer-nav";
import { Search } from "lucide-react";
import EmployerSearchTrigger from "@/components/employer/EmployerSearchTrigger";
import EmployerNotificationBell from "@/components/employer/EmployerNotificationBell";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import EmployerThemeToggle from "@/components/employers/EmployerThemeToggle";

type Props = {
  companyName: string;
  companyLogoUrl?: string | null;
  verifiedStatus: string;
  plan?: "FREE" | "PRO";
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

export default function Topbar({ companyName, companyLogoUrl, verifiedStatus }: Props) {
  const pathname = usePathname();
  const title = getEmployerPageTitle(pathname);
  const isMessages = pathname.startsWith("/employer/messages");

  return (
    <header className="employer-topbar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-navy/[0.08] bg-white/70 px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] backdrop-blur-md sm:px-6">
      <h1
        className={`shrink-0 font-display text-lg font-bold tracking-tight text-ink ${
          isMessages ? "" : "lg:hidden"
        }`}
      >
        {title}
      </h1>

      <div className={`hidden flex-1 justify-center lg:flex ${isMessages ? "lg:hidden" : ""}`}>
        <EmployerSearchTrigger />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))
          }
          className="rounded-lg p-2 text-ink/55 transition hover:bg-ink/[0.04] hover:text-ink lg:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </button>

        <EmployerNotificationBell />

        <EmployerThemeToggle variant="topbar" />

        <div
          className="employer-topbar-verified hidden items-center gap-2 rounded-full bg-white/60 px-2.5 py-1 ring-1 ring-ink/5 sm:flex"
          title={statusLabel[verifiedStatus] ?? verifiedStatus}
        >
          <span
            className={`h-2 w-2 rounded-full ${statusDot[verifiedStatus] ?? "bg-ink/30"}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-ink/60">
            {statusLabel[verifiedStatus] ?? verifiedStatus}
          </span>
        </div>

        <Link
          href="/employer/company-profile"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-ink/[0.04]"
        >
          <EmployerAvatar
            name={companyName}
            imageUrl={companyLogoUrl}
            size="sm"
            shape="rounded"
            fallbackClassName="bg-teal text-white shadow-sm shadow-teal/25"
          />
          <div className="hidden max-w-[140px] md:block">
            <span className="employer-topbar-company-name block truncate text-sm font-medium text-ink">
              {companyName}
            </span>
            <span className="employer-topbar-company-role block truncate text-[10px] text-ink/45">
              Employer
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
