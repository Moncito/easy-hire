import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, role, fullName, companyName } = body;

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "Email, password, and role are required" },
      { status: 400 }
    );
  }

  if (role !== "SEEKER" && role !== "EMPLOYER") {
    return NextResponse.json(
      { error: "Role must be SEEKER or EMPLOYER" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

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

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}