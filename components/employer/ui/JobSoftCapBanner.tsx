"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";

type Entitlements = {
  plan: "FREE" | "PRO";
  activeJobSoftCap: { limit: number; current: number; reached: boolean; appliesToPlan: boolean };
};

/**
 * Free-plan-only heads up when the account is at (or over) the active job
 * soft cap — `canCreateOrActivateJob` (lib/billing/entitlements.ts) is the
 * real enforcement; this is just an early warning fetched client-side so
 * the job form doesn't need `requireEmployerPageContext` plumbed through.
 */
export default function JobSoftCapBanner() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await fetchJsonSafe<Entitlements>("/api/employer/entitlements", {
        cache: "no-store",
      });
      if (active && result.ok) setEntitlements(result.data);
    })();
    return () => {
      active = false;
    };
  }, []);

  const cap = entitlements?.activeJobSoftCap;
  if (!cap || !cap.appliesToPlan || !cap.reached) return null;

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-amber-800">
        You&apos;re at the Free plan limit of {cap.limit} live or pending-review job
        {cap.limit === 1 ? "" : "s"} ({cap.current} now). Close or archive one, or{" "}
        <Link href="/employer/billing" className="font-semibold underline hover:no-underline">
          upgrade to Employer Pro
        </Link>{" "}
        for unlimited active jobs before submitting a new listing.
      </p>
    </div>
  );
}
