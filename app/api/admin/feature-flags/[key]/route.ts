import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { featureFlagKeyParamsSchema } from "@/lib/validations/admin";
import { updateFeatureFlag, deleteFeatureFlag } from "@/lib/admin/feature-flags";

/**
 * PATCH  /api/admin/feature-flags/[key] — update description/enabled/
 *        rolloutPercentage on an existing flag.
 * DELETE /api/admin/feature-flags/[key] — remove a flag entirely.
 *
 * Both are gated on `system.manage` at BOTH layers — here for defence in
 * depth, and again inside `updateFeatureFlag`/`deleteFeatureFlag` (the real
 * gate, per §8.1) — and rate-limited the same way as
 * PATCH/DELETE /api/admin/team/[id].
 */

const FEATURE_FLAG_MUTATION_RATE_LIMIT = 30;
const FEATURE_FLAG_MUTATION_RATE_WINDOW_SECONDS = 60 * 60;

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "system.manage");

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "admin:feature-flags:mutate", session.user.id),
      limit: FEATURE_FLAG_MUTATION_RATE_LIMIT,
      windowSeconds: FEATURE_FLAG_MUTATION_RATE_WINDOW_SECONDS,
    });

    const { key } = featureFlagKeyParamsSchema.parse(await params);
    const body = await parseJsonBody(req);

    const updated = await updateFeatureFlag(session.user.id, key, body);

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "system.manage");

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "admin:feature-flags:mutate", session.user.id),
      limit: FEATURE_FLAG_MUTATION_RATE_LIMIT,
      windowSeconds: FEATURE_FLAG_MUTATION_RATE_WINDOW_SECONDS,
    });

    const { key } = featureFlagKeyParamsSchema.parse(await params);

    const result = await deleteFeatureFlag(session.user.id, key);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
