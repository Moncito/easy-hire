"use client";

import { usePathname } from "next/navigation";

type ContentWidth = "full" | "7xl" | "6xl" | "dashboard";

function isMessages(pathname: string) {
  return /^\/hiring\/[^/]+\/messages/.test(pathname);
}

function isJobForm(pathname: string) {
  return /^\/hiring\/[^/]+\/jobs\/new$/.test(pathname) || /^\/hiring\/[^/]+\/jobs\/[^/]+\/edit$/.test(pathname);
}

/** The workspace's own "dashboard-style" landing pages — tighter vertical rhythm, same 1296px cap as everything else. */
function isDashboard(pathname: string) {
  return (
    /^\/hiring\/[^/]+\/team$/.test(pathname) ||
    /^\/hiring\/[^/]+\/reports$/.test(pathname) ||
    /^\/hiring\/[^/]+\/notifications$/.test(pathname)
  );
}

function getContentWidth(pathname: string): ContentWidth {
  if (isMessages(pathname)) return "full";
  if (isJobForm(pathname)) return "6xl";
  if (isDashboard(pathname)) return "dashboard";
  return "7xl";
}

// 1296px matches the Pro dashboard's single authoritative content width. "full" is
// reserved for the fixed two-pane Messages layout; "6xl" (1152px) is kept for job forms.
const widthClasses: Record<ContentWidth, string> = {
  full: "w-full max-w-none",
  "7xl": "mx-auto w-full max-w-[1296px]",
  "6xl": "mx-auto w-full max-w-6xl",
  dashboard: "mx-auto w-full max-w-[1296px]",
};

export default function WorkspacePageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const width = getContentWidth(pathname);
  const messages = isMessages(pathname);
  const dashboard = isDashboard(pathname);
  const jobForm = isJobForm(pathname);

  const layoutClasses = messages
    ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    : dashboard
      ? "px-5 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-20"
      : jobForm
        ? "px-6 py-6 pb-0 sm:px-8"
        : "px-6 py-6 pb-24 sm:px-8 lg:pb-20";

  return <div className={`${layoutClasses} ${widthClasses[width]}`}>{children}</div>;
}
