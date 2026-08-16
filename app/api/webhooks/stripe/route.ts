import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  activateProSubscription,
  cancelProSubscription,
  getStripeClient,
  syncSubscriptionFromStripe,
} from "@/lib/stripe-billing";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function toDate(unixSeconds: number | null | undefined): Date | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000) : null;
}

/** Reads the subscription's current period end from either the object itself or its first item. */
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const direct = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof direct === "number") return toDate(direct);
  const item = subscription.items?.data?.[0];
  return toDate(item?.current_period_end ?? null);
}

/**
 * Stripe webhook — verifies the signature via `stripe.webhooks.constructEvent`
 * (never trusts an unverified payload) and keeps `Subscription` rows in
 * sync with Stripe's source of truth, including `currentPeriodEnd`.
 */
export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const companyId = checkoutSession.metadata?.companyId;
        const stripeSubscriptionId =
          typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : null;
        const stripeCustomerId =
          typeof checkoutSession.customer === "string" ? checkoutSession.customer : null;

        if (companyId) {
          let currentPeriodEnd: Date | null = null;
          if (stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            currentPeriodEnd = getCurrentPeriodEnd(subscription);
          }

          await activateProSubscription({
            companyId,
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodEnd,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe({
          stripeSubscriptionId: subscription.id,
          status: subscription.status === "active" ? "ACTIVE" : subscription.status === "past_due" ? "PAST_DUE" : undefined,
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;
        if (companyId) {
          await cancelProSubscription(companyId);
        } else {
          await syncSubscriptionFromStripe({ stripeSubscriptionId: subscription.id, status: "CANCELLED" });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : null;
        if (subscriptionId) {
          await syncSubscriptionFromStripe({ stripeSubscriptionId: subscriptionId, status: "PAST_DUE" });
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe-webhook] handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
