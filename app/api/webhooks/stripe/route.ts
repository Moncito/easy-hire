import { NextResponse } from "next/server";
import { activateProSubscription, cancelProSubscription } from "@/lib/stripe-billing";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Minimal verification stub — production should use stripe.webhooks.constructEvent
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const object = event.data.object;
  const companyId = (object.metadata as Record<string, string> | undefined)?.companyId;

  switch (event.type) {
    case "checkout.session.completed": {
      if (companyId) {
        await activateProSubscription({
          companyId,
          stripeCustomerId: object.customer as string | undefined,
          stripeSubscriptionId: object.subscription as string | undefined,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      if (companyId) await cancelProSubscription(companyId);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
