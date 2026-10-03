"use client";

import { useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { formatRate, type JobOffer } from "@/lib/client/offers";
import { closedOfferText, deriveOfferView, GUARANTEE_BODY, GUARANTEE_THANKS, type OfferPanelProps } from "./offer-view";
import { formatAppliedAt } from "./utils";

type Props = OfferPanelProps & { applicationStatus: string };

const MAKE_OFFER_CLASS =
  "inline-flex items-center gap-1.5 rounded-xl bg-teal px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-teal/15 transition hover:bg-teal/95 disabled:opacity-50";

function RateLine({ offer }: { offer: JobOffer }) {
  return (
    <span className="font-data text-xs font-semibold text-ink">
      {formatRate(offer)}
      {offer.hoursPerWeek ? <span className="font-normal text-ink/50"> · {offer.hoursPerWeek} h/wk</span> : null}
    </span>
  );
}

/** Free-tree Offer section: sits in the panel header under the action row. */
export function CandidateOfferSection({ applicationStatus, offers, offersLoading, onMakeOffer, onWithdrawOffer }: Props) {
  if (!onMakeOffer) return null;
  const view = deriveOfferView(offers, applicationStatus);
  const hired = applicationStatus === "HIRED";
  // A hired candidate with no accepted offer on file has nothing to show here.
  if (hired && view.kind !== "accepted") return null;
  if (applicationStatus === "REJECTED" && view.kind !== "pending" && view.kind !== "accepted") return null;

  return (
    <div className="mt-3 border-t border-ink/6 pt-3" aria-label="Offer" role="group">
      {offersLoading && !offers ? (
        <p className="text-xs text-ink/40">Loading offers…</p>
      ) : view.kind === "pending" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
            Offer sent · expires {formatAppliedAt(view.offer.expiresAt)}
          </span>
          <RateLine offer={view.offer} />
          <button
            type="button"
            onClick={() => onWithdrawOffer?.(view.offer.id)}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink/55 transition hover:bg-ink/5 hover:text-ink"
          >
            Withdraw
          </button>
        </div>
      ) : view.kind === "accepted" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="rounded-md bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
            Offer accepted {view.offer.respondedAt ? formatAppliedAt(view.offer.respondedAt) : ""}
          </span>
          <RateLine offer={view.offer} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {view.kind === "closed" ? (
            <p className={`min-w-0 flex-1 text-xs ${closedOfferText(view.offer).warn ? "text-ember" : "text-ink/50"}`}>
              {closedOfferText(view.offer).text}
            </p>
          ) : (
            <span className="flex-1" />
          )}
          {view.canOffer ? (
            <button type="button" onClick={onMakeOffer} className={MAKE_OFFER_CLASS}>
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Make offer
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Free-tree "Protect this hire" card, shown for HIRED candidates. Mount with key={application.id}. */
export function CandidateGuaranteeCard({ onGuaranteeInterest }: Pick<OfferPanelProps, "onGuaranteeInterest">) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!onGuaranteeInterest) return null;

  async function handleClick() {
    setBusy(true);
    try {
      const result = await onGuaranteeInterest?.();
      if (result !== false) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="protect-hire-title" className="mb-3 rounded-xl border border-navy/15 bg-navy/[0.04] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 id="protect-hire-title" className="text-sm font-semibold text-ink">
            Protect this hire
          </h3>
          {done ? (
            <p role="status" className="mt-1 text-xs leading-relaxed text-ink/60">
              {GUARANTEE_THANKS}
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">{GUARANTEE_BODY}</p>
              <button
                type="button"
                onClick={handleClick}
                disabled={busy}
                className="mt-3 rounded-lg border border-navy/25 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-50"
              >
                {busy ? "Sending…" : "I'm interested"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
