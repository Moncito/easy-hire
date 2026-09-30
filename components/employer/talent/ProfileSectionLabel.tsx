"use client";

import type { ReactNode } from "react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

/**
 * Section heading on the talent profile. Pro: a real heading in the
 * design-system style (Space Grotesk, sentence case, muted 16px icon).
 * Free: the original small uppercase navy label, unchanged.
 */
export default function ProfileSectionLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  const { isPro } = useEmployerShell();

  if (isPro) {
    return (
      <h2 className="flex items-center gap-2 font-heading text-[17px] font-semibold tracking-[-0.01em] text-eh-ink [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-eh-muted">
        {icon}
        {children}
      </h2>
    );
  }

  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/60 [&_svg]:h-3 [&_svg]:w-3">
      {icon}
      {children}
    </p>
  );
}
