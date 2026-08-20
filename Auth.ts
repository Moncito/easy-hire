import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { authConfig } from "./auth.config";

async function resolveDbUser(email?: string | null, userId?: string | null) {
  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (byEmail) return byEmail;
  }

  if (userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
  }

  return null;
}

// This file runs in the Node.js runtime only (API routes, Server Components,
// Server Actions) — never imported directly by middleware.ts / proxy.ts.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true, // Allow localhost in development
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      const ROLE_REFRESH_MS = 15 * 60 * 1000;

      if (user) {
        // Auth.js replaces OAuth user.id with a random UUID — resolve from DB by email.
        try {
          const dbUser = await resolveDbUser(
            (user.email ?? token.email) as string | undefined,
            user.id
          );

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.idVerified = true;
          } else {
            token.id = user.id;
            token.role = (user as { role?: string }).role;
            token.idVerified = false;
          }
        } catch (err) {
          console.error("[auth] jwt initial user resolve failed:", err);
          token.id = user.id;
          token.role = (user as { role?: string }).role;
          token.idVerified = false;
        }

        token.roleRefreshedAt = Date.now();
        return token;
      }

      const lastRefresh = (token.roleRefreshedAt as number | undefined) ?? 0;
      const needsRefresh =
        Date.now() - lastRefresh > ROLE_REFRESH_MS || token.idVerified !== true;

      if (!needsRefresh && token.id && token.role) {
        return token;
      }

      try {
        const dbUser = await resolveDbUser(
          token.email as string | undefined,
          token.id as string | undefined
        );

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.idVerified = true;
        }
      } catch (err) {
        console.error("[auth] jwt role refresh failed:", err);
      }

      token.roleRefreshedAt = Date.now();
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
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      // Left false on purpose: there's no email verification in this app yet,
      // so auto-linking a Google sign-in to an existing Credentials account
      // (matched only by email) would let someone hijack an account they
      // don't actually control. Revisit once email verification exists.
      allowDangerousEmailAccountLinking: false,
      async profile(profile) {
        let user = await prisma.user.findUnique({
          where: { email: profile.email! },
          include: { seekerProfile: true },
        });

        if (!user) {
          // New Google sign-ins default to SEEKER and get a linked
          // SeekerProfile created in the same step — matching what
          // /api/register already does for Credentials sign-up.
          user = await prisma.user.create({
            data: {
              email: profile.email!,
              role: "SEEKER",
              passwordHash: null,
              seekerProfile: {
                create: { fullName: profile.name || "" },
              },
            },
            include: { seekerProfile: true },
          });
        } else if (user.role === "SEEKER" && !user.seekerProfile) {
          // Older accounts (or partial sign-ups) may be SEEKER without a row.
          await ensureSeekerProfile(user.id, { fullName: profile.name || "" });
          user = await prisma.user.findUniqueOrThrow({
            where: { email: profile.email! },
            include: { seekerProfile: true },
          });
        }

        return {
          id: user.id,
          email: user.email,
          image: profile.picture,
          role: user.role,
        };
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

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