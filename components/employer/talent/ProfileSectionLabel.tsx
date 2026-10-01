"use client";

import type { ReactNode } from "react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { TONE_CHIP, type SectionTone } from "@/components/employer/talent/tones";

/**
 * Section heading on the talent profile. Pro: Space Grotesk heading with
 * the section's icon on a tinted chip. Free: the original small uppercase
 * navy label, unchanged.
 */
export default function ProfileSectionLabel({
  icon,
  tone = "navy",
  children,
}: {
  icon?: ReactNode;
  tone?: SectionTone;
  children: ReactNode;
}) {
  const { isPro } = useEmployerShell();

  if (isPro) {
    return (
      <h2 className="flex items-center gap-2.5 font-heading text-[17px] font-semibold tracking-[-0.01em] text-eh-ink">
        {icon && (
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-control [&_svg]:h-4 [&_svg]:w-4 ${TONE_CHIP[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
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
