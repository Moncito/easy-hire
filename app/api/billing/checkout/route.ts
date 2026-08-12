import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { createProCheckoutSession } from "@/lib/stripe-billing";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);
    const checkout = await createProCheckoutSession({
      companyId: company.id,
      companyName: company.companyName,
      userEmail: session.user.email ?? "",
    });

    if (checkout.url) {
      return NextResponse.redirect(checkout.url, 303);
    }

    return NextResponse.json(
      { error: "Stripe is not configured. Contact support to enable Employer Pro." },
      { status: 503 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
