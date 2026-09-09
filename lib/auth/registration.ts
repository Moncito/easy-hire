import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { sendWelcomeVerification } from "@/lib/auth/credentials-recovery";
import { recordEvent } from "@/lib/admin/events";

/**
 * Business logic for POST /api/register — the route handler stays thin
 * (rate limit + parse + call this + respond) per CLAUDE.md.
 *
 * Fields are expected to already be validated by `registerSchema` — this
 * function does no input validation of its own.
 */
export type RegisterUserInput = {
  email: string;
  password: string;
  role: "SEEKER" | "EMPLOYER";
  fullName?: string;
  companyName?: string;
};

export type RegisteredUser = {
  id: string;
  email: string;
  role: Role;
};

export async function registerUser({
  email,
  password,
  role,
  fullName,
  companyName,
}: RegisterUserInput): Promise<RegisteredUser> {
  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("An account with this email already exists", 409);
    }
    throw error;
  }

  // Top of both the seeker and employer funnels — §7.1. Recorded after the
  // user row is created (and outside any transaction, since user.create
  // above isn't one), per the rules in lib/admin/events.ts.
  recordEvent({
    eventType: "USER_SIGNED_UP",
    actorType: role === "EMPLOYER" ? "EMPLOYER" : "SEEKER",
    userId: user.id,
    metadata: { role },
  });

  // Fire-and-forget: a mail provider failure must never break account
  // creation. The user can always request another verification email later.
  sendWelcomeVerification(user.id, user.role).catch((err) =>
    console.error("[register] failed to send welcome/verification email:", err)
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
