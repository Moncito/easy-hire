"use client";

import { Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

/**
 * Reads `plan` from EmployerShellContext (no prop drilling) to swap the
 * job-form footer copy for Pro. Actual instant-publish eligibility still
 * depends on company verification (`getPublishMode` in
 * lib/employer/billing-helpers.ts) — this is copy only.
 */
export default function InstantPublishNote() {
  const { isPro } = useEmployerShell();

  if (isPro) {
    return (
      <p className="mt-4 border-t border-ink/[0.06] pt-3 text-[11px] leading-relaxed text-ink/45">
        <Sparkles className="mr-1 inline h-3 w-3 -translate-y-px text-[color:var(--neo-gold,#c9a227)]" strokeWidth={2.25} />
        <span className="font-semibold text-ink/60">Employer Pro:</span> verified companies publish
        instantly on submit — no admin queue. Not verified yet?{" "}
        <a href="/employer/company-profile" className="cursor-pointer font-semibold text-[#9A5B12] hover:underline">
          Finish verification
        </a>
        .
      </p>
    );
  }

  return (
    <p className="mt-4 border-t border-ink/[0.06] pt-3 text-[11px] leading-relaxed text-ink/45">
      Submit for review when ready. Our team approves jobs before they appear to seekers.
    </p>
  );
}
