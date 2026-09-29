"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export type OwnershipOfferCard = {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  fromEmail: string;
  expiresAt: string;
  willConvertToEmployer: boolean;
};

/**
 * Shown on /hiring to a teammate who's been offered a company. Accepting is a
 * two-click confirm because, for a job-seeker account, it changes what the
 * whole account can do — see lib/company-ownership-transfer.ts.
 */
export default function OwnershipOfferPrompt({ offers }: { offers: OwnershipOfferCard[] }) {
  const [remaining, setRemaining] = useState(offers);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(companyId: string, action: "accept" | "decline") {
    setError(null);
    setBusy(companyId);
    try {
      const res = await fetch(`/api/hiring/ownership-offers/${encodeURIComponent(companyId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (action === "accept") {
        // Full navigation, not router.push: the session cookie just changed
        // role, and the proxy has to see the new one.
        window.location.assign((data as { redirectTo?: string }).redirectTo ?? "/employer/dashboard");
        return;
      }
      setRemaining((current) => current.filter((offer) => offer.companyId !== companyId));
      setConfirming(null);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  if (remaining.length === 0) return null;

  return (
    <section aria-label="Ownership offers" className="mb-8 space-y-3">
      {remaining.map((offer) => {
        const isConfirming = confirming === offer.companyId;
        const isBusy = busy === offer.companyId;
        return (
          <div key={offer.companyId} className="rounded-2xl border border-teal/25 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    You&apos;ve been offered ownership of {offer.companyName}
                  </p>
                  <p className="mt-0.5 text-sm text-ink/55">
                    From {offer.fromEmail}. Expires{" "}
                    <span suppressHydrationWarning>{new Date(offer.expiresAt).toLocaleDateString()}</span>.
                  </p>
                </div>
              </div>

              {!isConfirming && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(offer.companyId)}
                    disabled={isBusy}
                    className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/90 active:scale-[0.98] disabled:opacity-60"
                  >
                    Review and accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(offer.companyId, "decline")}
                    disabled={isBusy}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:opacity-60"
                  >
                    {isBusy ? "Declining…" : "Decline"}
                  </button>
                </div>
              )}
            </div>

            {isConfirming && (
              <div className="mt-4 border-t border-ink/[0.06] pt-4">
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink/65">
                  <li>You become the owner of {offer.companyName}: its jobs, billing, and hiring team.</li>
                  <li>{offer.fromEmail} stays on the team as a recruiter. You can change or remove that later.</li>
                  {offer.willConvertToEmployer && (
                    <li>
                      <strong className="font-semibold text-ink">Your account becomes an employer account.</strong>{" "}
                      Your job-seeker profile and applications are kept, but you won&apos;t be able to reach
                      them while it&apos;s an employer account.
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => respond(offer.companyId, "accept")}
                    disabled={isBusy}
                    aria-busy={isBusy}
                    className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/90 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isBusy ? "Transferring…" : "Accept ownership"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    disabled={isBusy}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:opacity-60"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
    </section>
  );
}
