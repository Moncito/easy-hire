import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { registerSchema } from "@/lib/validations/sign-up";
import { sendWelcomeVerification } from "@/lib/auth/credentials-recovery";

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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        ...(role === "SEEKER" && {
          seekerProfile: { create: { fullName: fullName ?? "" } },
        }),
        ...(role === "EMPLOYER" && {
          company: { create: { companyName: companyName ?? "" } },
        }),
      },
    });

    // Fire-and-forget: a mail provider failure must never break account
    // creation. The user can always request another verification email later.
    sendWelcomeVerification(user.id, user.role).catch((err) =>
      console.error("[register] failed to send welcome/verification email:", err)
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    return errorResponse(error);
  }
}