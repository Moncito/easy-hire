import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  inset?: boolean;
  noPadding?: boolean;
};

export default function DashboardSurface({
  children,
  className = "",
  inset = false,
  noPadding = false,
}: Props) {
  return (
    <div
      className={`employer-ws-surface rounded-2xl border backdrop-blur-[2px] ${
        inset ? "employer-ws-surface-muted" : ""
      } ${noPadding ? "" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}
