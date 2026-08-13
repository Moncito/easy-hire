import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Shared skeleton card — respects employer workspace light/dark tokens. */
export default function EmployerSkeletonSurface({ children, className = "" }: Props) {
  return (
    <div
      className={`employer-ws-surface rounded-2xl border p-5 shadow-[0_8px_24px_-8px_rgba(30,58,95,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}
