"use client";

import { usePathname } from "next/navigation";

type ContentWidth = "full" | "7xl" | "6xl";

function getContentWidth(pathname: string): ContentWidth {
  if (pathname.match(/\/employer\/jobs\/[^/]+\/applicants$/)) return "full";
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

  return <div className={`px-8 py-8 pb-28 ${widthClasses[width]}`}>{children}</div>;
}
