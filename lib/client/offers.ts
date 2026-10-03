import { fetchJson } from "@/lib/client/fetch-json";
import { createOfferSchema, respondToOfferSchema } from "@/lib/validations/offer";
import type { CreateOfferInput } from "@/lib/validations/offer";
import { formatOfferRate } from "@/lib/hiring/offer-state";

export type JobOfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";

export type JobOffer = {
  id: string;
  applicationId: string;
  title: string;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
  currency: string;
  hoursPerWeek: number | null;
  startDate: string | null;
  message: string | null;
  status: JobOfferStatus;
  expiresAt: string;
  respondedAt: string | null;
  declineReason: string | null;
  createdAt: string;
};

export type SeekerOffer = JobOffer & {
  application: {
    id: string;
    job: { id: string; title: string; company: { companyName: string; logoUrl: string | null } };
  };
};

/** "$3,000.00/mo" or "₱500.00/hr" — same output as the server's formatOfferRate. */
export function formatRate(offer: Pick<JobOffer, "monthlyRateCents" | "hourlyRateCents" | "currency">): string {
  return formatOfferRate(offer);
}

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Zod-validates the form input and returns a field → message map, or the parsed data. */
export function validateOfferInput(
  input: unknown
): { ok: true; data: CreateOfferInput } | { ok: false; errors: Record<string, string> } {
  const parsed = createOfferSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export async function listApplicationOffers(applicationId: string) {
  return fetchJson<JobOffer[]>(`/api/applications/${applicationId}/offers`, { cache: "no-store" });
}

export async function createOffer(applicationId: string, input: CreateOfferInput) {
  const body = createOfferSchema.parse(input);
  return fetchJson<JobOffer>(`/api/applications/${applicationId}/offers`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export async function withdrawOffer(offerId: string) {
  return fetchJson<{ ok: true; id: string }>(`/api/offers/${offerId}/withdraw`, { method: "POST" });
}

export async function sendGuaranteeInterest(applicationId: string) {
  return fetchJson<{ ok: true }>(`/api/applications/${applicationId}/guarantee-interest`, { method: "POST" });
}

export async function listSeekerOffers() {
  return fetchJson<SeekerOffer[]>("/api/seeker/offers", { cache: "no-store" });
}

export async function respondToOffer(offerId: string, input: { accept: true } | { accept: false; declineReason?: string }) {
  const body = respondToOfferSchema.parse(input);
  return fetchJson<{ offer: JobOffer; application: unknown }>(`/api/seeker/offers/${offerId}/respond`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export async function confirmHire(applicationId: string) {
  return fetchJson<{ id: string; hireConfirmedBySeekerAt: string }>(
    `/api/seeker/applications/${applicationId}/confirm-hire`,
    { method: "POST" }
  );
}
