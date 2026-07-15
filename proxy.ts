import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Uses the edge-safe config only — does NOT import from ./auth.ts,
// so Prisma/bcrypt never get bundled into the Edge Runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSeekerRoute = nextUrl.pathname.startsWith("/seeker");
  const isEmployerRoute = nextUrl.pathname.startsWith("/employer");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  const isProtectedRoute = isSeekerRoute || isEmployerRoute || isAdminRoute;

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isSeekerRoute && role !== "SEEKER") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isEmployerRoute && role !== "EMPLOYER") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/seeker/:path*", "/employer/:path*", "/admin/:path*"],
};