"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Role, CredentialsData } from "./types";

type Props = {
  role: Role;
  loading: boolean;
  serverError: string;
  onSubmit: (data: CredentialsData) => void;
};

export default function CredentialsStep({ role, loading, serverError, onSubmit }: Props) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    onSubmit({
      fullName: role === "SEEKER" ? fullName : undefined,
      companyName: role === "EMPLOYER" ? companyName : undefined,
      email,
      password,
    });
  }

  const displayError = localError || serverError;

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-black/5 md:p-12">
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">
        Create your account
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {role === "SEEKER" ? (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
          />
        ) : (
          <input
            type="text"
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />

        {displayError && <p className="text-sm text-ember">{displayError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {/* Google is only wired up for the Seeker flow — the OAuth profile()
          callback always creates a SEEKER, so it doesn't make sense to
          offer it on the Employer path. */}
      {role === "SEEKER" && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-ink/15" />
            <span className="text-xs text-ink/50">OR</span>
            <div className="flex-1 border-t border-ink/15" />
          </div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/seeker/dashboard" })}
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
              Continue with Google
            </div>
          </button>
        </>
      )}
    </div>
  );
}