import type { JobOfferStatus, ApplicationStatus } from "@prisma/client";
import { OFFER_TTL_DAYS } from "@/lib/validations/offer";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A PENDING offer past its expiry is treated as EXPIRED everywhere (checked on read, no cron). */
export function effectiveOfferStatus(
  offer: { status: JobOfferStatus; expiresAt: Date },
  now = new Date()
): JobOfferStatus {
  // Exactly at expiresAt already counts as expired.
  if (offer.status === "PENDING" && offer.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return offer.status;
}

/** Null when the offer can be accepted/declined/withdrawn now; otherwise a user-facing reason. */
export function offerActionBlocker(
  offer: { status: JobOfferStatus; expiresAt: Date },
  now = new Date()
): string | null {
  switch (effectiveOfferStatus(offer, now)) {
    case "PENDING":
      return null;
    case "EXPIRED":
      return "This offer has expired.";
    case "ACCEPTED":
      return "This offer was already accepted.";
    case "DECLINED":
      return "This offer was already declined.";
    case "WITHDRAWN":
      return "This offer was withdrawn.";
  }
}

/** Null when an employer may send a new offer on an application in this status. */
export function createOfferBlocker(applicationStatus: ApplicationStatus): string | null {
  if (applicationStatus === "HIRED") return "This candidate is already hired.";
  if (applicationStatus === "REJECTED") return "This application was rejected.";
  return null;
}

export function offerExpiry(now = new Date()): Date {
  return new Date(now.getTime() + OFFER_TTL_DAYS * DAY_MS);
}

/** "$3,000.00/mo" or "₱500.00/hr" — for notifications/emails. */
export function formatOfferRate(offer: {
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
  currency: string;
}): string {
  const monthly = offer.monthlyRateCents != null;
  const cents = (monthly ? offer.monthlyRateCents : offer.hourlyRateCents) ?? 0;
  const symbol = offer.currency === "PHP" ? "₱" : "$";
  const amount = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${amount}${monthly ? "/mo" : "/hr"}`;
}
