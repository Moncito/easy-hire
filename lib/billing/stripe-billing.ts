import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

let cachedClient: Stripe | null | undefined;

/** Lazily constructs the Stripe client — returns null when STRIPE_SECRET_KEY isn't set. */
export function getStripeClient(): Stripe | null {
  if (cachedClient !== undefined) return cachedClient;
  cachedClient = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;
  return cachedClient;
}

export async function createProCheckoutSession(input: {
  companyId: string;
  companyName: string;
  userEmail: string;
}): Promise<{ url: string | null }> {
  const stripe = getStripeClient();
  if (!stripe || !PRO_PRICE_ID) {
    return { url: null };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/employer/billing?upgraded=1`,
      cancel_url: `${APP_URL}/employer/billing`,
      customer_email: input.userEmail,
      metadata: { companyId: input.companyId, companyName: input.companyName },
      subscription_data: {
        metadata: { companyId: input.companyId, companyName: input.companyName },
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("[stripe] checkout session failed:", error);
    return { url: null };
  }
}

/**
 * Opens the Stripe-hosted Customer Portal for an existing Pro subscriber so
 * they can update payment methods, view invoices, or cancel — without us
 * building any of that UI ourselves.
 */
export async function createBillingPortalSession(input: {
  stripeCustomerId: string;
  returnUrl?: string;
}): Promise<{ url: string | null }> {
  const stripe = getStripeClient();
  if (!stripe) return { url: null };

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: input.returnUrl ?? `${APP_URL}/employer/billing`,
    });
    return { url: session.url };
  } catch (error) {
    console.error("[stripe] billing portal session failed:", error);
    return { url: null };
  }
}

export async function activateProSubscription(input: {
  companyId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}) {
  const existing = await prisma.subscription.findFirst({
    where: { companyId: input.companyId, status: "ACTIVE", planType: "PRO" },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        stripeCustomerId: input.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        ...(input.currentPeriodEnd !== undefined ? { currentPeriodEnd: input.currentPeriodEnd } : {}),
      },
    });
  }

  return prisma.subscription.create({
    data: {
      companyId: input.companyId,
      planType: "PRO",
      status: "ACTIVE",
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
    },
  });
}

export async function cancelProSubscription(companyId: string) {
  await prisma.subscription.updateMany({
    where: { companyId, planType: "PRO", status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });
}

/** Updates billing period / status fields on the subscription matching a Stripe subscription id. */
export async function syncSubscriptionFromStripe(input: {
  stripeSubscriptionId: string;
  status?: "ACTIVE" | "CANCELLED" | "PAST_DUE";
  currentPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
}) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.currentPeriodEnd !== undefined ? { currentPeriodEnd: input.currentPeriodEnd } : {}),
      ...(input.stripeCustomerId !== undefined ? { stripeCustomerId: input.stripeCustomerId } : {}),
    },
  });
}