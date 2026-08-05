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

export default function EmployerPageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const width = getContentWidth(pathname);
  const isMessages = pathname.startsWith("/employer/messages");

  return (
    <div
      className={`${
        isMessages
          ? "flex h-[calc(100dvh-3.5rem-4rem)] min-h-0 flex-col overflow-hidden px-0 py-0 lg:h-[calc(100dvh-3.5rem)]"
          : "px-6 py-6 pb-28 sm:px-8 lg:pb-24"
      } ${widthClasses[width]}`}
    >
      {children}
    </div>
  );
}
