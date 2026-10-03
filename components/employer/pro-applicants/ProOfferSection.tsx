"use client";

import { useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { Button, StatusBadge } from "@/components/employer/system";
import { formatRate, type JobOffer } from "@/lib/client/offers";
import { closedOfferText, deriveOfferView, GUARANTEE_BODY, GUARANTEE_THANKS, type OfferPanelProps } from "@/components/employer/candidate-detail/offer-view";
import { formatAppliedAt } from "@/components/employer/candidate-detail/utils";

type Props = OfferPanelProps & { applicationStatus: string };

function RateLine({ offer }: { offer: JobOffer }) {
  return (
    <span className="num text-ui font-semibold text-eh-ink">
      {formatRate(offer)}
      {offer.hoursPerWeek ? <span className="font-normal text-eh-muted"> · {offer.hoursPerWeek} h/wk</span> : null}
    </span>
  );
}

/** Pro-tree Offer section, built on the employer design system. Sits under the action row in the panel header. */
export function ProOfferSection({ applicationStatus, offers, offersLoading, onMakeOffer, onWithdrawOffer }: Props) {
  if (!onMakeOffer) return null;
  const view = deriveOfferView(offers, applicationStatus);
  if (applicationStatus === "HIRED" && view.kind !== "accepted") return null;
  if (applicationStatus === "REJECTED" && view.kind !== "pending" && view.kind !== "accepted") return null;

  return (
    <div role="group" aria-label="Offer" className="mt-4 border-t border-eh-line pt-3">
      {offersLoading && !offers ? (
        <p className="text-small text-eh-muted">Loading offers…</p>
      ) : view.kind === "pending" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge tone="info" dot>
            Offer sent · expires {formatAppliedAt(view.offer.expiresAt)}
          </StatusBadge>
          <RateLine offer={view.offer} />
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onWithdrawOffer?.(view.offer.id)}>
            Withdraw
          </Button>
        </div>
      ) : view.kind === "accepted" ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusBadge tone="success" dot>
            Offer accepted {view.offer.respondedAt ? formatAppliedAt(view.offer.respondedAt) : ""}
          </StatusBadge>
          <RateLine offer={view.offer} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {view.kind === "closed" ? (
            <p className={`min-w-0 flex-1 text-small ${closedOfferText(view.offer).warn ? "text-eh-danger" : "text-eh-muted"}`}>
              {closedOfferText(view.offer).text}
            </p>
          ) : (
            <span className="flex-1" />
          )}
          {view.canOffer ? (
            <Button variant="secondary" size="md" icon={<FileText />} onClick={onMakeOffer}>
              Make offer
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Pro-tree "Protect this hire" card, shown for HIRED candidates. Mount with key={application.id}. */
export function ProGuaranteeCard({ onGuaranteeInterest }: Pick<OfferPanelProps, "onGuaranteeInterest">) {
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
    <section
      aria-labelledby="protect-hire-title"
      className="mb-3 rounded-card border border-eh-line bg-eh-surface p-4"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-eh-navy" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 id="protect-hire-title" className="text-ui font-semibold text-eh-ink">
            Protect this hire
          </h3>
          {done ? (
            <p role="status" className="mt-1 text-small text-eh-ink-2">
              {GUARANTEE_THANKS}
            </p>
          ) : (
            <>
              <p className="mt-1 text-small text-eh-ink-2">{GUARANTEE_BODY}</p>
              <Button variant="secondary" size="sm" className="mt-3" loading={busy} onClick={handleClick}>
                I&apos;m interested
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
