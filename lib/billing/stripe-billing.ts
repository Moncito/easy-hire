import { prisma } from "@/lib/prisma";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export async function createProCheckoutSession(input: {
  companyId: string;
  companyName: string;
  userEmail: string;
}): Promise<{ url: string | null }> {
  if (!STRIPE_SECRET || !PRO_PRICE_ID) {
    return { url: null };
  }

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": PRO_PRICE_ID,
    "line_items[0][quantity]": "1",
    success_url: `${APP_URL}/employer/billing?upgraded=1`,
    cancel_url: `${APP_URL}/employer/billing`,
    customer_email: input.userEmail,
    "metadata[companyId]": input.companyId,
    "metadata[companyName]": input.companyName,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error("[stripe] checkout session failed:", await res.text());
    return { url: null };
  }

  const data = (await res.json()) as { url?: string };
  return { url: data.url ?? null };
}

export async function activateProSubscription(input: {
  companyId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const existing = await prisma.subscription.findFirst({
    where: { companyId: input.companyId, status: "ACTIVE", planType: "PRO" },
  });

  if (existing) return existing;

  return prisma.subscription.create({
    data: {
      companyId: input.companyId,
      planType: "PRO",
      status: "ACTIVE",
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    },
  });
}

export async function cancelProSubscription(companyId: string) {
  await prisma.subscription.updateMany({
    where: { companyId, planType: "PRO", status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });
}
