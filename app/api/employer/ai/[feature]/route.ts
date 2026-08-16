import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireProCompanyForAi } from "@/lib/ai/gates";
import { AI_FEATURE_ROUTES } from "@/lib/ai/features";

/**
 * Single Pro-gated router for every Easy AI feature:
 * POST /api/employer/ai/[feature] — see lib/ai/features for the feature list.
 * Business logic (prompting, schemas, generation) lives in /lib/ai — this
 * route only authenticates, gates on Pro, validates the body, and dispatches.
 */
export async function POST(req: Request, { params }: { params: Promise<{ feature: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feature } = await params;
    const route = AI_FEATURE_ROUTES[feature];
    if (!route) {
      return NextResponse.json({ error: `Unknown Easy AI feature: ${feature}` }, { status: 404 });
    }

    const company = await requireProCompanyForAi(session.user.id);

    const rawBody = await req.json().catch(() => ({}));
    const input = route.inputSchema.parse(rawBody);

    const result = await route.run(company.id, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}
