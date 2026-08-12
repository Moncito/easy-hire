"use client";

import { usePathname } from "next/navigation";

type ContentWidth = "full" | "7xl" | "6xl";

function getContentWidth(pathname: string): ContentWidth {
  if (pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/)) return "full";
  if (pathname.startsWith("/employer/messages")) return "full";
  if (pathname === "/employer/jobs/new") return "6xl";
  if (pathname.match(/\/employer\/jobs\/[^/]+\/edit$/)) return "6xl";
  return "7xl";
}

const widthClasses: Record<ContentWidth, string> = {
  full: "w-full max-w-none",
  "7xl": "mx-auto w-full max-w-7xl",
  "6xl": "mx-auto w-full max-w-6xl",
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

  return (
    <div
      className={`${isFixedWorkspace ? workspaceClasses : "px-6 py-6 pb-28 sm:px-8 lg:pb-24"} ${widthClasses[width]} ${
        pro && !isFixedWorkspace ? "rounded-2xl bg-white/70 shadow-sm shadow-ink/5 ring-1 ring-ink/5 backdrop-blur-sm" : ""
      }`}
    >
      {children}
    </div>
  );
}
