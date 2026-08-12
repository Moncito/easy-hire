import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/auth-secret";

// This file must stay Edge Runtime-safe: no Prisma, no bcrypt, no Node-only
// imports. It's used by middleware.ts. The full config with providers lives
// in auth.ts and is only used in Node.js runtime contexts (API routes,
// Server Components, Server Actions).
export const authConfig = {
  secret: getAuthSecret(),
  pages: {
    signIn: "/login",
  },
  providers: [], // real providers are added in auth.ts, not here
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SEEKER" | "EMPLOYER" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;