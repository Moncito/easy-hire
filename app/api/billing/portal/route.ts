import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { getCompanySubscription } from "@/lib/subscriptions";
import { createBillingPortalSession } from "@/lib/billing/stripe-billing";

/** POST /api/billing/portal — opens the Stripe Customer Portal for the caller's subscription. */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const subscription = await getCompanySubscription(company.id);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found yet. Upgrade to Employer Pro first." },
        { status: 400 }
      );
    }

    const portal = await createBillingPortalSession({ stripeCustomerId: subscription.stripeCustomerId });

    if (portal.url) {
      return NextResponse.redirect(portal.url, 303);
    }

    return NextResponse.json(
      { error: "Stripe is not configured. Contact support to manage billing." },
      { status: 503 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
