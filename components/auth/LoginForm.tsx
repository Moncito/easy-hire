"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  onSuccess?: () => void;
  showSignupLink?: boolean;
  idPrefix?: string;
};

export default function LoginForm({
  onSuccess,
  showSignupLink = true,
  idPrefix = "login",
}: Props) {
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

    onSuccess?.();
    router.push("/dashboard");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor={`${idPrefix}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-password`} className="sr-only">
            Password
          </label>
          <input
            id={`${idPrefix}-password`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
          />
        </div>

        <div className="-mt-2 text-right">
          <Link
            href="/login/forgot"
            className="text-xs font-semibold text-ink/60 hover:text-ink hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-ember">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-ink/15" />
        <span className="text-xs text-ink/50">OR</span>
        <div className="flex-1 border-t border-ink/15" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full cursor-pointer rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 active:scale-[0.99]"
      >
        <div className="flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

      {showSignupLink && (
        <p className="mt-6 text-center text-sm text-ink/55">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-ink hover:underline">
            Get started
          </Link>
        </p>
      )}
    </div>
  );
}
