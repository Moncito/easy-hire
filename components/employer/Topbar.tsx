"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getEmployerPageTitle } from "@/lib/employer-nav";

type Props = {
  companyName: string;
  verifiedStatus: string;
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

export default function Topbar({ companyName, verifiedStatus }: Props) {
  const pathname = usePathname();
  const title = getEmployerPageTitle(pathname);

  const initials = companyName
    ? companyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CO";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-ink/5 bg-mist/80 px-6 backdrop-blur-md">
      <h1 className="font-display text-lg font-bold tracking-tight text-ink">{title}</h1>

      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-full bg-white/60 px-2.5 py-1 ring-1 ring-ink/5 sm:flex"
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-xs font-bold text-white shadow-sm shadow-teal/25">
            {initials}
          </div>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink md:inline">
            {companyName}
          </span>
        </Link>
      </div>
    </header>
  );
}
