import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

// This file runs in the Node.js runtime only (API routes, Server Components,
// Server Actions) — never imported directly by middleware.ts.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
async authorize(credentials) {
  console.log("Attempting login for:", credentials?.email);

  if (!credentials?.email || !credentials?.password) {
    console.log("Missing email or password");
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  });

  console.log("User found:", user ? user.email : "NOT FOUND");

  if (!user || !user.passwordHash) {
    console.log("No user or no passwordHash set");
    return null;
  }

  const isValid = await bcrypt.compare(
    credentials.password as string,
    user.passwordHash
  );

  console.log("Password valid:", isValid);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
},
    }),
  ],
});