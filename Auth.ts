import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { normalizeEmail } from "@/lib/email-address";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { resolveGoogleAccountLinkingAction } from "@/lib/auth/google-account-linking";
import { authConfig } from "./auth.config";

// Brute-force / credential-stuffing guard for the Credentials provider.
// Keyed by IP *and* by the submitted email so one attacker can't spray many
// accounts from a single IP, and one account can't be sprayed from many IPs.
const LOGIN_RATE_LIMIT_PER_IP = 20;
const LOGIN_RATE_LIMIT_PER_EMAIL = 8;
const LOGIN_RATE_WINDOW_SECONDS = 15 * 60;

/**
 * `authorize` can't return an HTTP status, so a blocked attempt is signalled
 * the same way next-auth already signals "wrong email/password": throwing
 * `CredentialsSignin`. @auth/core catches any thrown error from `authorize`
 * (see @auth/core/src/index.ts) and turns it into a normal
 * `{ error: "CredentialsSignin" }` response instead of crashing the sign-in
 * request — `CredentialsSignin` specifically is treated as a "safe" client
 * error type, so it renders like every other failed-login case client-side.
 * The client (components/auth/LoginForm.tsx) doesn't discriminate on the
 * error code today, so this can't leak "you're rate-limited" info to an
 * attacker — it just logs which guard tripped for server-side observability.
 */
class LoginRateLimited extends CredentialsSignin {
  code = "rate_limited";
}

async function resolveDbUser(email?: string | null, userId?: string | null) {
  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
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
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      const ROLE_REFRESH_MS = 15 * 60 * 1000;
      // When a token has never been DB-verified (initial resolve failed, e.g. a
      // transient connection-pool timeout) we still want to retry — but on a
      // short interval, not on every single request, or a slow/contended DB
      // turns into a retry storm that keeps the pool exhausted.
      const UNVERIFIED_RETRY_MS = 60 * 1000;

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
      const interval = token.idVerified === true ? ROLE_REFRESH_MS : UNVERIFIED_RETRY_MS;
      const needsRefresh = Date.now() - lastRefresh > interval;

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
      // `allowDangerousEmailAccountLinking` only governs NextAuth's built-in
      // account-linking flow, which requires a database adapter. This app
      // has none (JWT sessions, no `adapter:` key, no `Account` model in
      // schema.prisma), so the flag below is inert regardless of its value.
      // The real control is the verification-gated linking logic in
      // `profile()` below: Google has already proven the signer owns this
      // mailbox, so we only ever trust that proof over an *unverified*
      // Credentials claim on the same email (see the eviction branch).
      allowDangerousEmailAccountLinking: false,
      async profile(profile) {
        const email = normalizeEmail(profile.email!);
        let user = await prisma.user.findUnique({
          where: { email },
          include: { seekerProfile: true },
        });

        if (!user) {
          // New Google sign-ins default to SEEKER and get a linked
          // SeekerProfile created in the same step — matching what
          // /api/register already does for Credentials sign-up. Google has
          // already verified this address, so stamp it verified too.
          user = await prisma.user.create({
            data: {
              email,
              role: "SEEKER",
              passwordHash: null,
              emailVerifiedAt: new Date(),
              seekerProfile: {
                create: { fullName: profile.name || "" },
              },
            },
            include: { seekerProfile: true },
          });
        } else {
          const action = resolveGoogleAccountLinkingAction({
            id: user.id,
            emailVerifiedAt: user.emailVerifiedAt,
            passwordHash: user.passwordHash,
          });

          if (action.type === "evictUnverifiedPassword") {
            // See resolveGoogleAccountLinkingAction's doc comment for the
            // full rationale. Evict whatever password is on file (locking
            // out anyone who only knew that password, i.e. a squatter),
            // invalidate any outstanding verification/reset tokens for the
            // old claim, and mark the email verified.
            console.warn(
              `[auth] account-linking eviction: unverified password claim replaced by verified Google sign-in for userId=${action.userId}`
            );
            const [updatedUser] = await prisma.$transaction([
              prisma.user.update({
                where: { id: action.userId },
                data: { passwordHash: null, emailVerifiedAt: new Date() },
                include: { seekerProfile: true },
              }),
              prisma.verificationToken.deleteMany({ where: { userId: action.userId } }),
            ]);
            user = updatedUser;
          } else if (action.type === "backfillVerification") {
            // Already Google-only (no password) — safe to link, just
            // backfill the verification stamp since Google re-confirmed ownership.
            user = await prisma.user.update({
              where: { id: action.userId },
              data: { emailVerifiedAt: new Date() },
              include: { seekerProfile: true },
            });
          }
          // "linkAsIs": already-verified account, same human — no DB write needed.
        }

        if (user.role === "SEEKER" && !user.seekerProfile) {
          // Older accounts (or partial sign-ups) may be SEEKER without a row.
          await ensureSeekerProfile(user.id, { fullName: profile.name || "" });
          user = await prisma.user.findUniqueOrThrow({
            where: { email },
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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = normalizeEmail(credentials.email as string);

        const [ipResult, emailResult] = await Promise.all([
          checkRateLimit({
            key: clientKeyFromRequest(request, "login"),
            limit: LOGIN_RATE_LIMIT_PER_IP,
            windowSeconds: LOGIN_RATE_WINDOW_SECONDS,
          }),
          checkRateLimit({
            key: `login:email:${email}`,
            limit: LOGIN_RATE_LIMIT_PER_EMAIL,
            windowSeconds: LOGIN_RATE_WINDOW_SECONDS,
          }),
        ]);

        if (!ipResult.allowed || !emailResult.allowed) {
          console.warn(
            `[auth] credentials login blocked by rate limit (${!emailResult.allowed ? "email" : "ip"})`
          );
          throw new LoginRateLimited();
        }

        const user = await prisma.user.findUnique({
          where: { email },
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