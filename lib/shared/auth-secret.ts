/**
 * Auth.js requires a secret to sign JWTs. Production must set AUTH_SECRET
 * (or NEXTAUTH_SECRET). Development uses an insecure fallback so local
 * `SessionProvider` / getSession does not crash when .env is unset.
 */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] AUTH_SECRET is not set — using insecure development fallback. Add AUTH_SECRET to .env.local."
    );
    return "easyhire-dev-auth-secret-do-not-use-in-production";
  }

  return undefined;
}
