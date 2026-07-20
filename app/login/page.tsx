"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Credentials flow can safely redirect client-side via the shared
    // dashboard router, same as the Google flow below.
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-mist">
      {/* Decorative dotted squares */}
      <div
        className="absolute left-16 top-32 hidden h-24 w-24 rounded-2xl border border-marigold/30 md:block"
        style={{
          backgroundImage: "radial-gradient(#F2A93B 1.5px, transparent 1.5px)",
          backgroundSize: "10px 10px",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute right-20 bottom-40 hidden h-20 w-20 rounded-2xl border border-teal/30 md:block"
        style={{
          backgroundImage: "radial-gradient(#1F8073 1.5px, transparent 1.5px)",
          backgroundSize: "10px 10px",
          opacity: 0.5,
        }}
      />

      {/* Abstract diagonal blob, echoing the hero seam */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-marigold/25 to-teal/25 blur-3xl md:h-96 md:w-96" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
            </div>
            <span className="font-display text-lg font-bold text-ink">EasyHire</span>
          </Link>
        </div>
        <p className="text-sm text-ink/60">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-ink hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-black/5 md:p-12">
          <h1 className="mb-2 text-center font-display text-2xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mb-8 text-center text-sm text-ink/60">
            Enter your details to sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
            />

            {error && <p className="text-sm text-ember">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-ink/15" />
            <span className="text-xs text-ink/50">OR</span>
            <div className="flex-1 border-t border-ink/15" />
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.28h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.59z"
                  fill="#4285F4"
                />
                <path
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.13-4.07 1.13-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.395 21.3 7.765 24 12.255 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V7.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.46-3.46C18.205 1.48 15.495 0 12.255 0c-4.49 0-8.86 2.7-10.86 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-ink/10 bg-mist py-6 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} EasyHire VA Solutions &nbsp;|&nbsp;{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>{" "}
        &nbsp;|&nbsp;{" "}
        <Link href="/terms" className="hover:underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}