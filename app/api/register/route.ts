import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { registerSchema } from "@/lib/validations/sign-up";
import { registerUser } from "@/lib/auth/registration";

// Unauthenticated + runs bcrypt.hash(cost 10) per call — keep this tight.
const REGISTER_RATE_LIMIT = 5;
const REGISTER_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  try {
    await enforceRateLimit({
      key: clientKeyFromRequest(req, "register"),
      limit: REGISTER_RATE_LIMIT,
      windowSeconds: REGISTER_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const { email, password, role, fullName, companyName } = registerSchema.parse(body);

    const user = await registerUser({ email, password, role, fullName, companyName });

    return NextResponse.json(user);
  } catch (error) {
    return errorResponse(error);
  }
}
