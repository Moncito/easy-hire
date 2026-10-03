import type { JobOffer } from "@/lib/client/offers";

/** What the Offer section of a candidate panel should show. Shared by the Free and Pro trees (logic only; each draws its own UI). */
export type OfferView =
  | { kind: "none"; canOffer: boolean }
  | { kind: "pending"; offer: JobOffer }
  | { kind: "accepted"; offer: JobOffer }
  | { kind: "closed"; offer: JobOffer; canOffer: boolean };

export function deriveOfferView(offers: JobOffer[] | undefined, applicationStatus: string): OfferView {
  const canOffer = applicationStatus !== "HIRED" && applicationStatus !== "REJECTED";
  const latest = offers?.[0];
  if (!latest) return { kind: "none", canOffer };
  if (latest.status === "PENDING") return { kind: "pending", offer: latest };
  if (latest.status === "ACCEPTED") return { kind: "accepted", offer: latest };
  return { kind: "closed", offer: latest, canOffer };
}

export function closedOfferText(offer: JobOffer): { text: string; warn: boolean } {
  switch (offer.status) {
    case "DECLINED":
      return { text: offer.declineReason ? `Offer declined: ${offer.declineReason}` : "Offer declined", warn: true };
    case "EXPIRED":
      return { text: "Offer expired without a response", warn: true };
    default:
      return { text: "Offer withdrawn", warn: false };
  }
}

export const GUARANTEE_BODY =
  "Replacement guarantee — if this hire doesn't work out, we help you find a replacement. Coming soon.";
export const GUARANTEE_THANKS = "Thanks — we'll let you know when it's ready.";

export type OfferPanelProps = {
  offers?: JobOffer[];
  offersLoading?: boolean;
  onMakeOffer?: () => void;
  onWithdrawOffer?: (offerId: string) => void;
  onGuaranteeInterest?: () => Promise<boolean> | void;
};
